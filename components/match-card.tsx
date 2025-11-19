'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Match } from '@/lib/types';

interface Props {
  match: Match;
}

export function MatchCard({ match }: Props) {
  const formatted = new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(match.matchedAt));
  return (
    <Card>
      <CardHeader>
        <CardTitle>{match.partnerName}</CardTitle>
        <p className="text-sm text-slate-500">{formatted}</p>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600">{match.partnerBio}</p>
      </CardContent>
    </Card>
  );
}
