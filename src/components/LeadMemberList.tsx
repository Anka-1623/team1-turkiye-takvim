import { currentAge, formatBirthdayFull } from "@/lib/date";
import { platformLabel } from "@/lib/socials";
import type { SocialLink } from "@/lib/types";

export type LeadRow = {
  id: string;
  name: string;
  email: string | null;
  birthday: string; // "YYYY-MM-DD"
  socials: SocialLink[];
  notifyOptIn: boolean;
  createdAt: string;
};

const registeredFormat = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Istanbul",
});

/** Everyone who has registered, with the full birth date and the account's e-mail. */
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
        <table className="lead-table">
          <caption className="sr-only">Kayıtlı üyeler, en son kayıt olan en üstte</caption>
          <thead>
            <tr>
              <th scope="col">Ad Soyad</th>
              <th scope="col">Doğum tarihi</th>
              <th scope="col">E-posta</th>
              <th scope="col">Kayıt tarihi</th>
              <th scope="col">Hatırlatma</th>
              <th scope="col">Bağlantılar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <th scope="row" className="lead-name">
                  {r.name}
                </th>
                <td data-label="Doğum tarihi">
                  <div>
                    {formatBirthdayFull(r.birthday)}
                    <span className="lead-sub">{currentAge(r.birthday)} yaşında</span>
                  </div>
                </td>
                <td data-label="E-posta" className="lead-email">
                  <div>{r.email ?? <span className="lead-sub">Hesap bağlı değil</span>}</div>
                </td>
                <td data-label="Kayıt tarihi">
                  <div>{registeredFormat.format(new Date(r.createdAt))}</div>
                </td>
                <td data-label="Hatırlatma">
                  <div>{r.notifyOptIn ? "Açık" : "Kapalı"}</div>
                </td>
                <td data-label="Bağlantılar">
                  <div>
                    {r.socials.length === 0 ? (
                      <span className="lead-sub">Yok</span>
                    ) : (
                      <span className="lead-links">
                        {r.socials.map((s, i) => (
                          <a key={i} href={s.url} target="_blank" rel="noreferrer noopener">
                            {platformLabel(s.platform)} ↗
                          </a>
                        ))}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
