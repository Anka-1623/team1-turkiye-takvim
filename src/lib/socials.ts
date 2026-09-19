export const SOCIAL_PLATFORMS = [
  { value: "x", label: "X / Twitter" },
  { value: "instagram", label: "Instagram" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "github", label: "GitHub" },
  { value: "discord", label: "Discord" },
  { value: "youtube", label: "YouTube" },
  { value: "tiktok", label: "TikTok" },
  { value: "web", label: "Web sitesi" },
  { value: "other", label: "Diğer" },
] as const;

export type SocialPlatformValue = (typeof SOCIAL_PLATFORMS)[number]["value"];

export function platformLabel(value: string): string {
  return SOCIAL_PLATFORMS.find((p) => p.value === value)?.label ?? value;
}

export const MAX_SOCIAL_LINKS = 8;
