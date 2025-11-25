'use client';

import Link from 'next/link';
import { useState } from 'react';
import { CalendarDays, Clock3, Loader2, UserRound, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ErrorBanner } from '@/components/error-banner';
import { useAuth } from '@/context/auth-context';
import { useCreateGroupMeal, useDeleteGroupMeal, useGroupMeals, useJoinGroupMeal, useLeaveGroupMeal, useRespondGroupMeal } from '@/hooks/use-group-meals';
import { ApiError, GroupMeal, TimeSlot } from '@/lib/api';
import { getTimeSlotLabel, getWeekdayLabel } from '@/lib/availability';
import { cn } from '@/lib/utils';

type CreateFormState = {
  title: string;
  date: string;
  timeSlot: TimeSlot;
  capacity: number;
};

const statusMeta: Record<GroupMeal['status'], { label: string; className: string }> = {
  OPEN: { label: '募集中', className: 'bg-emerald-100 text-emerald-700' },
  FULL: { label: '満員', className: 'bg-amber-100 text-amber-700' },
  CLOSED: { label: '終了', className: 'bg-slate-200 text-slate-600' }
};

const myStatusMeta: Record<NonNullable<GroupMeal['myStatus']>, { label: string; className: string }> = {
  JOINED: { label: '参加中', className: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
  INVITED: { label: '招待中', className: 'bg-indigo-50 text-indigo-700 border border-indigo-200' },
  NONE: { label: '未参加', className: 'bg-slate-50 text-slate-600 border border-slate-200' }
};

function formatDateLabel(date: string, weekday: GroupMeal['weekday']) {
  try {
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) throw new Error('Invalid date');
    const formatted = parsed.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
    return `${formatted} (${getWeekdayLabel(weekday)})`;
  } catch {
    return `${date} (${getWeekdayLabel(weekday)})`;
  }
}

export default function GroupMealsPage() {
  const { token, user } = useAuth();
  const [actionError, setActionError] = useState<string | null>(null);
  const { data: groupMeals, isPending, error: groupMealsError, refetch } = useGroupMeals();

  if (!token) {
    return (
      <Card>
        <p className="text-slate-700">ログインすると「みんなでGO飯」を利用できます。</p>
      </Card>
    );
  }

  const errorMessage = (groupMealsError as ApiError | undefined)?.message ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">みんなでGO飯</h1>
          <p className="mt-1 text-sm text-slate-600">ランチ / ディナーの箱を作って、仲間を招待しましょう。</p>
        </div>
        <CreateGroupMealDialog onError={setActionError} />
      </div>

      <ErrorBanner message={actionError || errorMessage} />

      {isPending ? (
        <Card>
          <p className="text-slate-600">読み込み中...</p>
        </Card>
      ) : errorMessage && !groupMeals ? (
        <Card className="space-y-3">
          <p className="text-slate-700">{errorMessage}</p>
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            再読み込み
          </Button>
        </Card>
      ) : !groupMeals || groupMeals.length === 0 ? (
        <Card className="flex flex-col items-start gap-4">
          <h3 className="text-lg font-semibold text-slate-900">まだ箱がありません</h3>
          <p className="text-sm text-slate-600">「新しい箱を作る」から最初の募集を作成しましょう。</p>
          <CreateGroupMealDialog inline onError={setActionError} />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groupMeals.map((meal) => (
            <GroupMealCard
              key={meal.id}
              meal={meal}
              currentUserId={user?.id}
              currentUserIsAdmin={user?.isAdmin ?? false}
              onActionError={setActionError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GroupMealCard({
  meal,
  currentUserId,
  currentUserIsAdmin,
  onActionError
}: {
  meal: GroupMeal;
  currentUserId?: string;
  currentUserIsAdmin?: boolean;
  onActionError?: (message: string | null) => void;
}) {
  const respondMutation = useRespondGroupMeal(meal.id);
  const joinMutation = useJoinGroupMeal(meal.id);
  const deleteMutation = useDeleteGroupMeal(meal.id);
  const leaveMutation = useLeaveGroupMeal(meal.id);
  const isHost = meal.host.userId === currentUserId;
  const canDelete = isHost || currentUserIsAdmin;
  const myStatus = meal.myStatus ?? 'NONE';
  const canLeave = myStatus === 'JOINED' && !isHost;

  const handleRespond = (action: 'ACCEPT' | 'DECLINE') => {
    onActionError?.(null);
    respondMutation.mutate(action, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '操作に失敗しました')
    });
  };

  const handleJoin = () => {
    onActionError?.(null);
    joinMutation.mutate(undefined, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '参加に失敗しました')
    });
  };

  const handleDelete = () => {
    onActionError?.(null);
    if (!window.confirm('この箱を削除しますか？\n参加メンバーの情報も含めて元に戻せません。')) {
      return;
    }
    deleteMutation.mutate(undefined, {
      onError: (err: any) => {
        onActionError?.((err as ApiError | undefined)?.message ?? '削除に失敗しました');
      }
    });
  };

  const handleLeave = () => {
    onActionError?.(null);
    if (!window.confirm('この箱から抜けますか？\n参加枠が空き、他のメンバーが参加できるようになります。')) {
      return;
    }
    leaveMutation.mutate(undefined, {
      onError: (err: any) => onActionError?.((err as ApiError | undefined)?.message ?? '退出に失敗しました')
    });
  };

  const joinedParticipants = meal.participants.filter((participant) => participant.status === 'JOINED');

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex rounded-full px-3 py-1 text-xs font-semibold',
                statusMeta[meal.status]?.className ?? 'bg-slate-100 text-slate-600'
              )}
            >
              {statusMeta[meal.status]?.label ?? meal.status}
            </span>
            {myStatus !== 'NONE' ? (
              <span className={cn('inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold', myStatusMeta[myStatus].className)}>
                {myStatusMeta[myStatus].label}
              </span>
            ) : null}
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{meal.title?.trim() || 'タイトルなし'}</h3>
          <p className="text-sm text-slate-600">
            <span className="inline-flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatDateLabel(meal.date, meal.weekday)}
            </span>
            <span className="ml-3 inline-flex items-center gap-2">
              <Clock3 className="h-4 w-4 text-slate-400" />
              {getTimeSlotLabel(meal.timeSlot)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm" variant="secondary">
            <Link href={`/group-meals/${meal.id}`}>詳細・招待</Link>
          </Button>
          {canDelete ? (
            <Button
              size="sm"
              variant="secondary"
              className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '削除中...' : '削除'}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
        <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-3 py-2">
          <UserRound className="h-4 w-4 text-orange-500" />
          <span className="font-semibold text-slate-800">{meal.host.name}</span>
          <span className="text-xs text-slate-500">(ホスト)</span>
        </div>
        <div className="flex items-center justify-end gap-3 text-right">
          <div className="flex items-center gap-2 rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            <Users className="h-4 w-4 text-slate-400" />
            {meal.joinedCount} / {meal.capacity}
          </div>
          <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            残り {meal.remainingSlots} 枠
          </div>
        </div>
      </div>

      {joinedParticipants.length > 0 ? (
        <div className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">参加メンバー</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {joinedParticipants.map((participant) => (
              <span key={participant.userId} className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow-sm">
                {participant.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-wrap items-center gap-3">
        {isHost ? (
          <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">ホストとして参加中</span>
        ) : myStatus === 'INVITED' ? (
          <>
            <Button size="sm" onClick={() => handleRespond('ACCEPT')} disabled={respondMutation.isPending}>
              {respondMutation.isPending ? '参加中...' : '参加する'}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => handleRespond('DECLINE')} disabled={respondMutation.isPending}>
              辞退する
            </Button>
          </>
        ) : myStatus === 'JOINED' ? (
          <>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">参加中</span>
            {canLeave ? (
              <Button size="sm" variant="secondary" onClick={handleLeave} disabled={leaveMutation.isPending}>
                {leaveMutation.isPending ? '退出中...' : '抜ける'}
              </Button>
            ) : null}
          </>
        ) : meal.remainingSlots > 0 && meal.status === 'OPEN' ? (
          <Button size="sm" onClick={handleJoin} disabled={joinMutation.isPending}>
            {joinMutation.isPending ? '参加中...' : '飛び入り参加'}
          </Button>
        ) : (
          <span className="text-sm text-slate-500">参加受付は終了しました</span>
        )}
      </div>
    </Card>
  );
}

function CreateGroupMealDialog({ onError, inline }: { onError?: (message: string | null) => void; inline?: boolean }) {
  const [open, setOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CreateFormState>({
    title: '',
    date: '',
    timeSlot: 'DAY',
    capacity: 4
  });
  const createMutation = useCreateGroupMeal();

  const resetForm = () => {
    setFormState({ title: '', date: '', timeSlot: 'DAY', capacity: 4 });
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);
    onError?.(null);

    if (!formState.date) {
      setFormError('日付を入力してください');
      return;
    }
    if (formState.capacity < 3 || formState.capacity > 10) {
      setFormError('定員は3〜10名で設定してください');
      return;
    }

    const isoDate = new Date(formState.date).toISOString();

    createMutation.mutate(
      {
        title: formState.title.trim() || undefined,
        date: isoDate,
        timeSlot: formState.timeSlot,
        capacity: formState.capacity
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
        onError: (err: any) => setFormError((err as ApiError | undefined)?.message ?? '作成に失敗しました')
      }
    );
  };

  const dialogTrigger = (
    <DialogTrigger asChild>
      <Button size={inline ? 'default' : 'sm'}>{createMutation.isPending ? '送信中...' : '新しい箱を作る'}</Button>
    </DialogTrigger>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        setFormError(null);
        onError?.(null);
        if (!next) resetForm();
      }}
    >
      {inline ? dialogTrigger : <div className="flex justify-end">{dialogTrigger}</div>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しい箱を作る</DialogTitle>
          <DialogDescription>日時と定員を決めて、メンバーを招待しましょう。</DialogDescription>
        </DialogHeader>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">タイトル（任意）</span>
            <Input
              placeholder="例: 金曜ランチ"
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">日付</span>
              <Input
                type="date"
                value={formState.date}
                onChange={(event) => setFormState((prev) => ({ ...prev, date: event.target.value }))}
                required
              />
            </label>
            <label className="flex flex-col gap-2 text-sm text-slate-600">
              <span className="font-medium text-slate-900">時間帯</span>
              <select
                className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                value={formState.timeSlot}
                onChange={(event) => setFormState((prev) => ({ ...prev, timeSlot: event.target.value as TimeSlot }))}
              >
                <option value="DAY">昼</option>
                <option value="NIGHT">夜</option>
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-600">
            <span className="font-medium text-slate-900">定員</span>
            <select
              className="w-full rounded-2xl border border-orange-200 bg-white px-4 py-3 text-base text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
              value={formState.capacity}
              onChange={(event) => setFormState((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
            >
              {Array.from({ length: 8 }, (_, index) => index + 3).map((num) => (
                <option key={num} value={num}>
                  {num} 名
                </option>
              ))}
            </select>
          </label>
          <ErrorBanner message={formError} />
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                キャンセル
              </Button>
            </DialogClose>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  作成中...
                </>
              ) : (
                '作成する'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
