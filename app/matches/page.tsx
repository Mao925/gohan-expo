"use client";

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MatchCard } from '@/components/match-card';
import { ApiError, fetchMatches } from '@/lib/api';
import type { MatchSummary } from '@/lib/types';

type InsufficientAvailabilityInfo = {
  availableCount: number;
  required: number;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insufficientAvailability, setInsufficientAvailability] = useState<InsufficientAvailabilityInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMatches() {
      setLoading(true);
      setError(null);
      setInsufficientAvailability(null);

      try {
        const data = await fetchMatches();
        if (cancelled) return;
        setMatches(data);
      } catch (err: unknown) {
        if (cancelled) return;

        if (err instanceof ApiError && err.status === 403 && err.code === 'INSUFFICIENT_AVAILABILITY') {
          const availableCount = typeof err.data?.availableCount === 'number' ? err.data.availableCount : 0;
          const required = typeof err.data?.required === 'number' ? err.data.required : 3;
          setInsufficientAvailability({ availableCount, required });
          setError(null);
        } else {
          console.error(err);
          setError('サーバーでエラーが発生しました。時間をおいて再度お試しください。');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadMatches();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="p-4 text-sm text-slate-500">読み込み中です…</div>;
  }

  if (insufficientAvailability) {
    return (
      <div className="p-4 space-y-3">
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold mb-1">まだマッチ相手を確認できません</p>
          <p className="mb-1">
            現在、空いている日程は
            <span className="font-semibold mx-1">{insufficientAvailability.availableCount}件</span>
            です。
          </p>
          <p>
            マッチ相手を確認するには、空き日程を少なくとも
            <span className="font-semibold mx-1">{insufficientAvailability.required}件</span>
            登録してください。
          </p>
        </div>
        <Link
          href="/availability"
          className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          空いている日程を登録する
        </Link>
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-sm text-red-600">{error}</div>;
  }

  if (matches.length === 0) {
    return (
      <div className="p-4 text-sm text-slate-500">
        現在マッチ中の相手はいません。
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} />
      ))}
    </div>
  );
}
