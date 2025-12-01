export type User = {
  id: string;
  name: string;
  email: string;
  isAdmin?: boolean;
};

export type Profile = import('@/lib/api').Profile;
export type GroupMealBudget = import('@/lib/api').GroupMealBudget;
export type DrinkingStyle = import('@/lib/api').DrinkingStyle;
export type MealStyle = import('@/lib/api').MealStyle;
export type GoMealFrequency = import('@/lib/api').GoMealFrequency;

export type CommunityStatus = 'UNAPPLIED' | 'PENDING' | 'APPROVED';

export type LikeStatus = 'YES' | 'NO' | 'NONE';
export type LikeActionStatus = Exclude<LikeStatus, 'NONE'>;

export type Member = import('@/lib/api').Member & {
  isSelf?: boolean;
};

export type PartnerAnswer = 'YES' | 'NO' | 'UNANSWERED' | 'PENDING' | 'UNKNOWN' | null;

export type MemberRelationship = {
  id: string;
  name: string;
  favoriteMeals: string[];
  profileImageUrl?: string | null;
  targetUserId?: string;
  partnerAnswer?: PartnerAnswer;
  canToggleToYes?: boolean;
  canToggleToNo?: boolean;
  matchedAt?: string | null;
};

export type RelationshipCard = MemberRelationship;

export type MemberRelationshipsResponse = {
  matches?: MemberRelationship[];
  awaitingResponse?: MemberRelationship[];
  rejected?: MemberRelationship[];
};

export type MatchSummary = {
  id: string;
  partnerName: string;
  partnerFavoriteMeals: string[];
  profileImageUrl?: string | null;
  matchedAt: string;
};

export type Match = MatchSummary;

export type LikeCandidate = {
  id: string;
  name: string;
  favoriteMeals: string[];
  profileImageUrl?: string | null;
};

export type MatchCandidate = LikeCandidate;

export type JoinRequest = {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
};

export type GroupMealParticipant = import('@/lib/api').GroupMealParticipant;
export type GroupMealHost = import('@/lib/api').GroupMeal['host'];
export type GroupMealInviteCandidate = import('@/lib/api').GroupMealCandidate;

export type Weekday = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
export type TimeSlot = 'DAY' | 'NIGHT';
export type AvailabilityStatus = 'AVAILABLE' | 'UNAVAILABLE';
export type AvailabilitySlotDto = { weekday: Weekday; timeSlot: TimeSlot; status: AvailabilityStatus };
export type AvailabilityGrid = Record<Weekday, Record<TimeSlot, AvailabilityStatus>>;
export type OverlapSlotDto = { weekday: Weekday; timeSlot: TimeSlot };
