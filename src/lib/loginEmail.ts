import { C, button, emailShell, escapeHtml, heading, paragraph, row } from "@/lib/emailLayout";

export const LOGIN_EMAIL_SUBJECT = "Team1 Türkiye giriş linkin";

export function renderLoginEmailHtml({ link, siteUrl }: { link: string; siteUrl: string }): string {
  const rows = [
    row(heading("Giriş linkin hazır."), "8px 0 0"),
    row(
      paragraph(
        "Aşağıdaki butona tıklayarak Doğum Günü Takvimi'ne giriş yapabilirsin. Link tek kullanımlık ve kısa süre geçerli."
      ),
      "0"
    ),
    row(button(link, "Giriş yap"), "28px 0 0"),
    row(
      `<div style="font:400 13px/20px -apple-system,'Segoe UI',Helvetica,Arial,sans-serif;color:${C.ink3};">Buton çalışmazsa bu adresi tarayıcına yapıştır:</div>
       <div style="margin-top:6px;font:400 12px/18px ui-monospace,'SF Mono',Menlo,Consolas,'Courier New',monospace;color:${C.ink2};word-break:break-all;">${escapeHtml(link)}</div>`,
      "28px 0 0"
    ),
  ].join("");

  return emailShell({
    title: LOGIN_EMAIL_SUBJECT,
    preheader: "Tek tıkla giriş yap. Link tek kullanımlık.",
    siteUrl,
    rows,
    footer:
      "Bu maili sen istemediysen görmezden gelebilirsin, hesabına kimse giremez.<br>Team1 Türkiye Doğum Günü Takvimi",
  });
}
