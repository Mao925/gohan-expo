'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ErrorBanner } from '@/components/error-banner';
import { apiFetch } from '@/lib/api';
import { JoinRequest } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { useState } from 'react';

export default function AdminPage() {
  const { token, user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isPending } = useQuery<JoinRequest[]>({
    queryKey: ['admin-join-requests', token],
    queryFn: async () => {
      try {
        setError(null);
        return await apiFetch('/api/admin/join-requests', { token });
      } catch (err: any) {
        setError(err?.message ?? '取得に失敗しました');
        throw err;
      }
    },
    enabled: Boolean(token && user?.isAdmin)
  });

  const handleAction = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      apiFetch(`/api/admin/join-requests/${id}/${action}`, { method: 'POST', token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-join-requests', token] });
    },
    onError: (err: any) => setError(err?.message ?? '処理に失敗しました')
  });

  if (!token || !user?.isAdmin) {
    return (
      <Card>
        <p className="text-slate-700">管理者のみアクセスできます。</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">承認待ち</h1>
        <p className="mt-2 text-sm text-slate-500">コミュニティ申請をここから承認 / 拒否できます。</p>
      </div>
      <ErrorBanner message={error} />
      {isPending ? (
        <p className="text-slate-500">読み込み中...</p>
      ) : data && data.length > 0 ? (
        <div className="space-y-4">
          {data.map((request) => (
            <Card key={request.id} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold">{request.name}</p>
                <p className="text-sm text-slate-500">{request.email}</p>
                <p className="text-xs text-slate-400">申請日時: {new Date(request.requestedAt).toLocaleString('ja-JP')}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={handleAction.isPending}
                  onClick={() => handleAction.mutate({ id: request.id, action: 'reject' })}
                >
                  拒否
                </Button>
                <Button type="button" disabled={handleAction.isPending} onClick={() => handleAction.mutate({ id: request.id, action: 'approve' })}>
                  承認
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <p className="text-slate-500">承認待ちはありません。</p>
        </Card>
      )}
    </div>
  );
}
