/** Days-before-birthday points that trigger an opt-in reminder to teammates. 0 = the day itself. */
export const MEMBER_NOTIFY_MILESTONES = [7, 3, 0] as const;

export type Milestone = (typeof MEMBER_NOTIFY_MILESTONES)[number];

/**
 * Which reminder a birthday is due for, given the days left. The day after a heads-up milestone
 * counts too (7 -> also 6, 3 -> also 2): the cron runs once a day, so a failed run would otherwise
 * lose that reminder for good. The dedupe row in birthday_notifications is keyed by the milestone,
 * so the reminder still goes out only once. The day itself (0) has no second chance.
 */
export function dueMilestone(daysLeft: number): Milestone | null {
  for (const milestone of MEMBER_NOTIFY_MILESTONES) {
    if (daysLeft === milestone || (milestone > 0 && daysLeft === milestone - 1)) return milestone;
  }
  return null;
}
