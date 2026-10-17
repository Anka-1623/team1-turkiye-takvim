import { LeadActions } from "@/components/LeadActions";
import { currentAge, formatBirthdayFull } from "@/lib/date";
import type { PortalStatus } from "@/lib/portal";
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
  /** What they typed as Member Portal ID, and whether the roster vouches for it. */
  portalId: string | null;
  portalStatus: PortalStatus;
  /** Private: only the lead sees it. */
  address: string | null;
  /** False while the registration waits for the lead. */
  approved: boolean;
};

const registeredFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

const empty = <span className="lead-sub">Belirtilmemiş</span>;

const PORTAL_NOTE: Record<PortalStatus, string> = {
  listed: "Üye listesinde",
  unlisted: "Üye listesinde yok",
  missing: "Girilmemiş",
};

function Badge({ row }: { row: LeadRow }) {
  if (!row.approved) return <span className="lead-badge lead-badge-alert">Onay bekliyor</span>;
  if (row.portalStatus === "unlisted") return <span className="lead-badge">ID listede yok</span>;
  if (row.portalStatus === "missing") return <span className="lead-badge">ID girilmemiş</span>;
  return null;
}

/**
 * Everyone who has registered, waiting registrations and members the roster does not vouch for first;
 * opening a row shows their portal ID, address, what they like, their note and links, and lets the lead
 * approve or remove them.
 */
export function LeadMemberList({ rows, rosterSize }: { rows: LeadRow[]; rosterSize: number }) {
  const optedIn = rows.filter((r) => r.notifyOptIn).length;
  const waiting = rows.filter((r) => !r.approved).length;
  const unverified = rows.filter((r) => r.approved && r.portalStatus !== "listed").length;

  return (
    <>
      <dl className="lead-stats">
        <div className="lead-stat">
          <dt>Kayıtlı üye</dt>
          <dd>{rows.length}</dd>
        </div>
        <div className="lead-stat">
          <dt>Onay bekleyen</dt>
          <dd>{waiting}</dd>
        </div>
        <div className="lead-stat">
          <dt>Listede olmayan</dt>
          <dd>{unverified}</dd>
        </div>
        <div className="lead-stat">
          <dt>E-posta hatırlatması açık</dt>
          <dd>{optedIn}</dd>
        </div>
      </dl>

      {rosterSize === 0 && (
        <p className="alert mb-6">
          Üye listesi (<code>portal_roster</code>) boş: her yeni kayıt onay bekleyecek. Member Portal ID&apos;leri
          Supabase&apos;e eklenmeli.
        </p>
      )}

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
                <span className="lead-name">
                  {r.name}
                  <Badge row={r} />
                </span>
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
                  <dt>Member Portal ID</dt>
                  <dd>
                    {r.portalId ?? empty}
                    <span className="lead-sub">{PORTAL_NOTE[r.portalStatus]}</span>
                  </dd>
                </div>
                <div>
                  <dt>Adres</dt>
                  <dd>{r.address ?? empty}</dd>
                </div>
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
              <LeadActions memberId={r.id} name={r.name} approved={r.approved} />
            </details>
          ))}
        </div>
      )}
    </>
  );
}
