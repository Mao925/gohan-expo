export type User = {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
};

export type Profile = {
  name: string;
  bio: string;
};

export type CommunityStatus = 'UNAPPLIED' | 'PENDING' | 'APPROVED';

export type Member = {
  id: string;
  name: string;
  bio: string;
  isSelf?: boolean;
};

export type PartnerAnswer = 'YES' | 'NO' | 'UNANSWERED' | 'PENDING' | 'UNKNOWN' | null;

export type MemberRelationship = {
  id: string;
  name: string;
  bio: string;
  targetUserId?: string;
  partnerAnswer?: PartnerAnswer;
  canToggleToYes?: boolean;
  canToggleToNo?: boolean;
  matchedAt?: string | null;
};

export type MemberRelationshipsResponse = {
  matches?: MemberRelationship[];
  awaitingResponse?: MemberRelationship[];
  rejected?: MemberRelationship[];
};

export type Match = {
  id: string;
  partnerName: string;
  partnerBio: string;
  matchedAt: string;
};

export type MatchCandidate = {
  id: string;
  name: string;
  bio: string;
};

export type JoinRequest = {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
};
