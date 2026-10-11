import { currentAge, formatBirthdayFull } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { SocialLink } from "@/lib/types";

export type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  birthday: string; // "YYYY-MM-DD"
  socials: SocialLink[];
  interests: string | null;
  wish: string | null;
  note: string | null;
  notifyOptIn: boolean;
  createdAt: string;
};

const registeredFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const empty = <span className="lead-sub">Belirtilmemiş</span>;

/** Everyone who has registered; opening a row shows what they like, their note and links. */
export function LeadMemberList({ rows }: { rows: LeadRow[] }) {
  const optedIn = rows.filter((r) => r.notifyOptIn).length;

  return (
    <>
      <dl className="lead-stats">
        <div className="lead-stat">
          <dt>Kayıtlı üye</dt>
          <dd>{rows.length}</dd>
        </div>
        <div className="lead-stat">
          <dt>E-posta hatırlatması açık</dt>
          <dd>{optedIn}</dd>
        </div>
      </dl>

      {rows.length === 0 ? (
        <p className="alert">Henüz kayıtlı üye yok.</p>
      ) : (
        <div className="lead-list">
          <div className="lead-head" aria-hidden="true">
            <span>Ad Soyad</span>
            <span>Doğum tarihi</span>
            <span>E-posta</span>
            <span>Kayıt tarihi</span>
          </div>

          {rows.map((r) => (
            <details key={r.id} className="lead-row">
              <summary className="lead-summary">
                <span className="lead-name">{r.name}</span>
                <span className="lead-cell" data-label="Doğum tarihi">
                  <span>
                    {formatBirthdayFull(r.birthday)}
                    <span className="lead-sub">{currentAge(r.birthday)} yaşında</span>
                  </span>
                </span>
                <span className="lead-cell lead-email" data-label="E-posta">
                  <span>{r.email ?? <span className="lead-sub">Hesap bağlı değil</span>}</span>
                </span>
                <span className="lead-cell" data-label="Kayıt tarihi">
                  <span>{registeredFormat.format(new Date(r.createdAt))}</span>
                </span>
                <svg
                  className="lead-chevron"
                  width="14"
                  height="14"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  aria-hidden="true"
                >
                  <path d="M2.5 4.5 6 8l3.5-3.5" />
                </svg>
              </summary>

              <dl className="lead-detail">
                <div>
                  <dt>Doğum gününde istediği</dt>
                  <dd>{r.wish ?? empty}</dd>
                </div>
                <div>
                  <dt>İlgi alanları ve sevdikleri</dt>
                  <dd>{r.interests ?? empty}</dd>
                </div>
                <div>
                  <dt>Not</dt>
                  <dd>{r.note ?? empty}</dd>
                </div>
                <div>
                  <dt>Bağlantılar</dt>
                  <dd>
                    {r.socials.length === 0 ? (
                      empty
                    ) : (
                      <span className="lead-links">
                        {r.socials.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noreferrer noopener">
                            {platformLabel(s.platform)} ↗
                          </a>
                        ))}
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>E-posta hatırlatması</dt>
                  <dd>{r.notifyOptIn ? "Açık" : "Kapalı"}</dd>
                </div>
              </dl>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
