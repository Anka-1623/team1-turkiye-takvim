import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Team1 Türkiye Doğum Günü Takvimi";

export default async function OpengraphImage() {
  const mark = await readFile(join(process.cwd(), "public/brand/team1-turkiye-wordmark.png"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: "#151518",
        }}
      >
        {/* A sloped red slab bleeding off the right edge. */}
        <div
          style={{
            position: "absolute",
            top: -20,
            bottom: -20,
            right: -140,
            width: 520,
            background: "#E84142",
            transform: "skewX(-14deg)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "72px 88px",
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={`data:image/png;base64,${mark.toString("base64")}`}
            width={376}
            height={56}
            alt=""
          />

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#E84142", display: "flex" }}>
              Team1 Türkiye
            </div>
            <div
              style={{
                marginTop: 14,
                fontSize: 112,
                fontWeight: 800,
                color: "#F4F2EC",
                lineHeight: 0.95,
                letterSpacing: -4,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <span>Doğum Günü</span>
              <span>Takvimi</span>
            </div>
            <div style={{ marginTop: 28, fontSize: 30, color: "#B4B3BA", display: "flex" }}>
              Üye doğum günleri tek yerde.
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
