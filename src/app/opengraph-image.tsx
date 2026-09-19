import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 100px",
          background: "linear-gradient(180deg, #050708 0%, #0b0607 100%)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -260,
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "420px solid transparent",
            borderRight: "420px solid transparent",
            borderBottom: "520px solid rgba(230,33,47,0.20)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#E6212F",
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderBottom: "20px solid #E6212F",
            }}
          />
          Team1 Türkiye
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 108,
            fontWeight: 800,
            color: "#F2EDE9",
            lineHeight: 1,
          }}
        >
          Kozalak Takvim
        </div>
        <div style={{ marginTop: 20, fontSize: 30, color: "#A89EA0", display: "flex" }}>
          Üye doğum günleri — tek yerde
        </div>
      </div>
    ),
    { ...size }
  );
}
