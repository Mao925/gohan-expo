'use client';

import { Card } from '@/components/ui/card';
import { Member } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  member: Member;
}

export function MemberCard({ member }: Props) {
  return (
    <Card className={cn('flex flex-col gap-3 border-orange-100', member.isSelf && 'border-brand/50')}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {member.name}
            {member.isSelf ? '（あなた）' : ''}
          </p>
        </div>
        {member.isSelf ? <span className="rounded-full bg-brand/10 px-3 py-1 text-xs text-brand">自分です</span> : null}
      </div>
      <p className="text-sm text-slate-600">{member.bio}</p>
    </Card>
  );
}
