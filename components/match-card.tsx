'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MatchSummary } from '@/lib/types';
import { FavoriteMealsList } from './favorite-meals-list';

interface Props {
  match: MatchSummary;
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
        <p className="text-sm font-semibold text-slate-700">好きなご飯</p>
        <FavoriteMealsList meals={match.partnerFavoriteMeals} />
      </CardContent>
    </Card>
  );
}
