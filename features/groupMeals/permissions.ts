import type { GroupMeal } from '@/lib/api';
import type { User } from '@/lib/types';

export const GROUP_MEAL_MANAGE_FORBIDDEN_MESSAGE =
  'この箱を管理できるのは、作成者または運営だけです。';

export function canManageGroupMealFrontend(
  user: User | null | undefined,
  groupMeal: GroupMeal
): boolean {
  if (!user) {
    return false;
  }

  if (user.isAdmin) {
    return true;
  }

  if (groupMeal.createdByUserId && groupMeal.createdByUserId === user.id) {
    return true;
  }

  if (groupMeal.host.userId === user.id) {
    return true;
  }

  return false;
}
