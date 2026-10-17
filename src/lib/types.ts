export type SocialLink = {
  platform: string;
  url: string;
};

export type Member = {
  id: string;
  first_name: string;
  last_name: string;
  birthday: string; // "YYYY-MM-DD"
  socials: SocialLink[];
  interests: string | null;
  wish: string | null;
  note: string | null;
  created_at: string;
};

export type MyMember = {
  id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  socials: SocialLink[];
  interests: string | null;
  wish: string | null;
  note: string | null;
  notify_opt_in: boolean;
  /** Private: only the member and the local lead ever see it. */
  address: string | null;
  portal_id: string | null;
  /** The portal ID is on the roster (and can no longer be changed). */
  portal_verified: boolean;
  /** False while the registration waits for the local lead's approval. */
  approved: boolean;
};

export type EditableMember = {
  portal_id: string;
  first_name: string;
  last_name: string;
  birthday: string;
  socials: SocialLink[];
  interests: string;
  wish: string;
  note: string;
  address: string;
  notify_opt_in: boolean;
};
