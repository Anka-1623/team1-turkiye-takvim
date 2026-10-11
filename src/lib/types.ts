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
};

export type EditableMember = {
  first_name: string;
  last_name: string;
  birthday: string;
  socials: SocialLink[];
  interests: string;
  wish: string;
  note: string;
  notify_opt_in: boolean;
};
