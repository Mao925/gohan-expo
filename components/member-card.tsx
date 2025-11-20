'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Member } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  member: Member;
  onRemove?: (id: string) => void;
  canRemove?: boolean;
}

export function MemberCard({ member, onRemove, canRemove }: Props) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Card className={cn('relative flex flex-col gap-3 border-orange-100', member.isSelf && 'border-brand/50')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {member.name}
            {member.isSelf ? '（あなた）' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {member.isSelf ? <span className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand">自分です</span> : null}
          {canRemove && onRemove ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-full border border-red-200 bg-red-50 px-4 py-1 text-xs font-semibold text-red-600 hover:bg-red-100"
              onClick={() => setConfirming(true)}
            >
              削除
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-sm text-slate-600">{member.bio}</p>
      {confirming && canRemove && onRemove ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <div className="fixed left-1/2 top-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-red-200 bg-white p-6 text-sm text-slate-700 shadow-3xl">
            <p className="text-lg font-semibold text-red-600">本当に削除しますか？</p>
            <p className="mt-1 text-xs text-slate-500">削除すると、このメンバーはコミュニティ未申請に戻り、再申請が必要です。</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                className="rounded-full border border-slate-200 bg-white px-5 py-2 text-slate-600 hover:bg-slate-100"
                onClick={() => setConfirming(false)}
              >
                やめておく
              </Button>
              <Button
                type="button"
                className="rounded-full bg-red-500 px-5 py-2 text-white hover:bg-red-600"
                onClick={() => {
                  onRemove(member.id);
                  setConfirming(false);
                }}
              >
                削除する
              </Button>
            </div>
          </div>
        </>
      ) : null}
    </Card>
  );
}
