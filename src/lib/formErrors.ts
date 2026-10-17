const MEMBER_ERROR_MESSAGES: Record<string, string> = {
  members_first_name_len: "Ad alanı boş olamaz.",
  members_last_name_len: "Soyad alanı boş olamaz.",
  members_birthday_range: "Doğum günü geçersiz. Gelecekte bir tarih olamaz.",
  members_socials_valid:
    "Sosyal medya bağlantıları geçersiz — en az bir, en fazla 8 tane olmalı ve http:// veya https:// ile başlamalı.",
  members_interests_len: "İlgi alanları en fazla 300 karakter olabilir.",
  members_wish_len: "Doğum gününde istediğin şey en fazla 300 karakter olabilir.",
  members_note_len: "Not en fazla 500 karakter olabilir.",
  members_address_len: "Adres en fazla 300 karakter olabilir.",
  members_portal_id_len: "Member Portal ID 2 ile 80 karakter arasında olmalı.",
  not_authenticated: "Oturumun kapanmış, tekrar giriş yapman gerekiyor.",
  portal_id_required: "Member Portal ID'ni yazmalısın.",
  members_portal_id_key_unique:
    "Bu Member Portal ID'ye bağlı bir kayıt zaten var. Daha önce kaydolduysan 'Kaydımı Yönet' sayfasından eski kaydını bağlayabilirsin.",
  PORTAL_ID_LOCKED: "Doğrulanmış Member Portal ID değiştirilemez.",
  members_user_id_key: "Zaten bir kaydın var. 'Kaydımı Yönet' sayfasından düzenleyebilirsin.",
};

/** Maps a Postgres constraint-violation message to a Turkish, user-facing string. */
export function friendlyMemberError(message: string): string {
  const code = Object.keys(MEMBER_ERROR_MESSAGES).find((k) => message.includes(k));
  return code ? MEMBER_ERROR_MESSAGES[code] : "Bir şeyler ters gitti, tekrar dener misin?";
}
