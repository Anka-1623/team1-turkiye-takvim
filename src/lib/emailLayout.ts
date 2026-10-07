/**
 * Shared e-mail layout. Same language as the site: ink-black paper, the
 * Avalanche red slab, sharp corners, the mark's 60-degree slope. Table
 * based with inline styles because mail clients ignore most modern CSS;
 * the slope uses the CSS border-triangle trick and falls back to a plain
 * rectangle in Outlook.
 */

export const C = {
  paper: "#151518",
  panel: "#1E1E22",
  line: "#34343A",
  ink: "#F4F2EC",
  ink2: "#B4B3BA",
  ink3: "#9A99A3",
  accent: "#E84142",
} as const;

const FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif";
const MONO = "ui-monospace,'SF Mono',Menlo,Consolas,'Courier New',monospace";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Member-supplied links end up in other people's inboxes: http(s) only. */
export function safeUrl(url: string): string | null {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}

/** Primary button: red body plus a triangle that continues the slope (rectangle in Outlook). */
export function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td bgcolor="${C.accent}" style="background:${C.accent};padding:15px 8px 15px 26px;">
      <a href="${escapeHtml(href)}" style="font:700 15px/18px ${FONT};color:${C.paper};text-decoration:none;white-space:nowrap;">${escapeHtml(label)}</a>
    </td>
    <!--[if !mso]><!--><td width="22" style="width:22px;padding:0;font-size:0;line-height:0;"><div style="width:0;height:0;border-top:48px solid ${C.accent};border-right:22px solid ${C.paper};"></div></td><!--<![endif]-->
  </tr></table>`;
}

/** Outlined link chips, for members' social profiles. */
export function chips(links: { label: string; url: string }[]): string {
  return links
    .map((l) => {
      const href = safeUrl(l.url);
      if (!href) return "";
      return `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 8px 8px 0;padding:9px 13px;border:1px solid #6E6D76;font:600 13px/16px ${FONT};color:${C.ink};text-decoration:none;">${escapeHtml(l.label)} &#8599;</a>`;
    })
    .join("");
}

/** Small label + value block (interests, note...). */
export function fact(label: string, value: string): string {
  return `<div style="margin:0 0 16px;">
    <div style="font:600 12px/16px ${FONT};color:${C.ink3};letter-spacing:.04em;text-transform:uppercase;">${escapeHtml(label)}</div>
    <div style="margin-top:4px;font:400 15px/22px ${FONT};color:${C.ink};">${escapeHtml(value)}</div>
  </div>`;
}

export function bigNumber(value: number, unit: string): string {
  return `<div class="num" style="font:700 120px/1 ${MONO};letter-spacing:-7px;color:${C.paper};">${value}</div>
    <div style="margin-top:10px;font:600 18px/24px ${FONT};color:${C.paper};">${escapeHtml(unit)}</div>`;
}

export function bigWord(word: string): string {
  return `<div class="word" style="font:700 64px/1 ${FONT};letter-spacing:-3px;color:${C.paper};">${escapeHtml(word)}</div>`;
}

export function slabTitle(title: string, sub?: string): string {
  return `<div style="margin-top:28px;font:700 26px/30px ${FONT};letter-spacing:-.6px;color:${C.paper};">${escapeHtml(title)}</div>
    ${sub ? `<div style="margin-top:6px;font:400 15px/22px ${FONT};color:rgba(21,21,24,.82);">${escapeHtml(sub)}</div>` : ""}`;
}

/** The red slab from the site's hero: notched top-left corner, label in the notch band. */
export function slab(label: string, inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.accent}" style="background:${C.accent};">
    <tr>
      <td width="48" style="width:48px;padding:0;font-size:0;line-height:0;"><div style="width:0;height:0;border-top:48px solid ${C.paper};border-right:48px solid ${C.accent};"></div></td>
      <td height="48" style="padding:0 28px 0 12px;font:600 14px/48px ${FONT};color:${C.paper};">${escapeHtml(label)}</td>
    </tr>
    <tr><td colspan="2" class="px" style="padding:4px 32px 36px;">${inner}</td></tr>
  </table>`;
}

export function heading(text: string): string {
  return `<h1 class="h1" style="margin:0;font:700 36px/38px ${FONT};letter-spacing:-1.2px;color:${C.ink};">${escapeHtml(text)}</h1>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:16px 0 0;font:400 16px/25px ${FONT};color:${C.ink2};">${escapeHtml(text)}</p>`;
}

export function emailShell(opts: {
  title: string;
  preheader: string;
  siteUrl: string;
  /** Rows of the card; each already a full `<tr>`. */
  rows: string;
  footer: string;
}): string {
  const { title, preheader, siteUrl, rows, footer } = opts;
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${escapeHtml(title)}</title>
<style>
  body { margin:0; padding:0; background:${C.paper}; }
  a { color:inherit; }
  @media (max-width:520px) {
    .outer { padding:20px 16px 32px !important; }
    .px { padding-left:22px !important; padding-right:22px !important; }
    .num { font-size:96px !important; letter-spacing:-5px !important; }
    .word { font-size:48px !important; letter-spacing:-2px !important; }
    .h1 { font-size:30px !important; line-height:32px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:${C.paper};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${C.paper};">${escapeHtml(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${C.paper}" style="background:${C.paper};">
  <tr><td align="center" class="outer" style="padding:28px 12px 40px;">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:560px;">
      <tr><td style="padding:0 0 24px;">
        <a href="${escapeHtml(siteUrl)}" style="text-decoration:none;"><img src="${escapeHtml(siteUrl)}/brand/team1-turkiye-wordmark.png" alt="Team1 Türkiye" width="121" height="18" style="display:block;width:121px;height:18px;border:0;font:700 16px/18px ${FONT};color:${C.ink};"></a>
      </td></tr>
      ${rows}
      <tr><td style="padding:28px 0 0;font:400 12px/19px ${FONT};color:${C.ink3};">${footer}</td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/** A padded content row on the paper background. */
export function row(inner: string, pad = "32px 0 0"): string {
  return `<tr><td style="padding:${pad};">${inner}</td></tr>`;
}
