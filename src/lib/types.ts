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
  created_at: string;
};

export type EditableMember = {
  first_name: string;
  last_name: string;
  birthday: string;
  socials: SocialLink[];
};
