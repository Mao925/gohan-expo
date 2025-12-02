'use client';

import { useEffect, useRef } from 'react';
import { markGroupMealInvitationOpened } from '@/lib/api';

type InvitationOpenTrackerProps = {
  invitationId?: string;
};

export function InvitationOpenTracker({ invitationId }: InvitationOpenTrackerProps) {
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    if (!invitationId || hasTrackedRef.current) return;
    hasTrackedRef.current = true;
    markGroupMealInvitationOpened(invitationId).catch(() => {
      // swallow errors
    });
  }, [invitationId]);

  return null;
}
