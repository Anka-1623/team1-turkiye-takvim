import { button, emailShell, escapeHtml, fact, heading, paragraph, row } from "@/lib/emailLayout";

export type PendingRegistration = {
  name: string;
  /** What the person typed into the Member Portal ID field. */
  portalId: string;
  /** Their account e-mail, so the lead can tell who is behind it. */
  email: string;
};

export const PENDING_REGISTRATION_SUBJECT = "Onay bekleyen yeni kayıt - Team1 Türkiye";

/**
 * Tells the local lead that someone registered with a Member Portal ID that is not on the roster.
 * Everything in it was typed by the registrant, so it all goes through the escaping helpers.
 */
export function renderPendingRegistrationHtml(reg: PendingRegistration, siteUrl: string): string {
  const rows = [
    row(heading("Onay bekleyen yeni kayıt"), "8px 0 0"),
    row(
      paragraph(
        `${reg.name} kaydoldu ama girdiği Member Portal ID üye listesinde yok. Onaylayana kadar panelde ve hatırlatma e-postalarında görünmeyecek.`
      ),
      "0"
    ),
    row(
      fact("Ad Soyad", reg.name) + fact("Girdiği Member Portal ID", reg.portalId) + fact("Hesap e-postası", reg.email),
      "24px 0 0"
    ),
    row(paragraph("Yönetim panelinden kaydı onaylayabilir ya da sistemden silebilirsin."), "0"),
    row(button(`${siteUrl}/yonetim`, "Yönetim panelini aç"), "20px 0 0"),
  ].join("");

  return emailShell({
    title: PENDING_REGISTRATION_SUBJECT,
    preheader: `${reg.name} onayını bekliyor.`,
    siteUrl,
    rows,
    footer: `Bu e-postayı yerel lider olarak Team1 Türkiye Doğum Günü Takvimi'nden alıyorsun. <a href="${escapeHtml(siteUrl)}/yonetim" style="color:#B4B3BA;">Yönetim paneli</a>`,
  });
}
