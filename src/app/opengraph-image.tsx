import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Team1 Türkiye Doğum Günü Takvimi";

const HEADLINE = ["Doğum Günü", "Takvimi"];
const SUBLINE = "Üyelerin doğum günleri tek yerde.";

/** Kanit from Google Fonts, subset to the glyphs this card uses. Falls back to the default face if the fetch fails. */
async function loadKanit(weight: 300 | 500, text: string): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch(`https://fonts.googleapis.com/css2?family=Kanit:wght@${weight}&text=${encodeURIComponent(text)}`)
    ).text();
    const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (!src) return null;
    const res = await fetch(src[1]);
    return res.ok ? await res.arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function OpengraphImage() {
  // The approved Türkiye chapter lockup, untouched; it carries white lettering for dark fields.
  const lockup = await readFile(join(process.cwd(), "public/brand/team1/team1turkiye.svg"));
  const lockupSrc = `data:image/svg+xml;base64,${lockup.toString("base64")}`;

  const [medium, light] = await Promise.all([
    loadKanit(500, HEADLINE.join("")),
    loadKanit(300, SUBLINE),
  ]);
  const fonts = [
    medium && { name: "Kanit", data: medium, weight: 500 as const, style: "normal" as const },
    light && { name: "Kanit", data: light, weight: 300 as const, style: "normal" as const },
  ].filter((f): f is NonNullable<typeof f> => Boolean(f));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#000000",
          fontFamily: "Kanit",
        }}
      >
        <img src={lockupSrc} width={376} height={56} alt="" />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ width: 96, height: 6, background: "#E6212F", marginBottom: 32, display: "flex" }} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 120,
              fontWeight: 500,
              color: "#FFFFFF",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            {HEADLINE.map((line) => (
              <span key={line}>{line}</span>
            ))}
          </div>
          <div style={{ marginTop: 28, fontSize: 36, fontWeight: 300, color: "#E5E7EB", display: "flex" }}>
            {SUBLINE}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
