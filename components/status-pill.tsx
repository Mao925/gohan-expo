'use client';

import { cn } from '@/lib/utils';

interface Props {
  status: 'UNAPPLIED' | 'PENDING' | 'APPROVED';
}

const statusCopy: Record<Props['status'], { label: string; className: string }> = {
  UNAPPLIED: { label: '未申請', className: 'bg-slate-100 text-slate-600' },
  PENDING: { label: '承認待ち', className: 'bg-amber-100 text-amber-700' },
  APPROVED: { label: '承認済み', className: 'bg-emerald-100 text-emerald-700' }
};

const fallback = { label: '未設定', className: 'bg-slate-100 text-slate-500' };

export function StatusPill({ status }: Props) {
  const meta = statusCopy[status] ?? fallback;
  return (
    <span className={cn('rounded-full px-4 py-1 text-sm font-semibold', meta.className)}>
      {meta.label}
    </span>
  );
}
