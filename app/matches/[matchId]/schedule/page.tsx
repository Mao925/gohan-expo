import { CommunityGate } from '@/components/community/community-gate';
import { MatchSchedulePageClient } from './match-schedule-page-client';

type PageProps = {
  params: {
    matchId: string;
  };
};

export default function MatchSchedulePage({ params }: PageProps) {
  return (
    <CommunityGate>
      <div className="mx-auto max-w-4xl px-4 py-8 md:px-6">
        <MatchSchedulePageClient matchId={params.matchId} />
      </div>
    </CommunityGate>
  );
}
