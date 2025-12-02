'use client';

import dynamic from 'next/dynamic';
import type { MeetingPlaceMapProps } from './LeafletMapInner';

const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div className="h-64 w-full rounded-xl border flex items-center justify-center text-xs text-muted-foreground">
      地図を読み込み中...
    </div>
  ),
});

export function MeetingPlaceMap(props: MeetingPlaceMapProps) {
  return <LeafletMapInner {...props} />;
}
