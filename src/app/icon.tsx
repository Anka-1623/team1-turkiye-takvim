import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default async function Icon() {
  const mark = await readFile(join(process.cwd(), "public/brand/avalanche-triangle.png"));

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#151518",
        }}
      >
        <img
          src={`data:image/png;base64,${mark.toString("base64")}`}
          width={30}
          height={26}
          alt=""
        />
      </div>
    ),
    { ...size }
  );
}
