import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ATELIER";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        background: "#0A0908",
        color: "#EFE9DC",
        padding: "80px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          width: 24,
          height: 24,
          background: "#E8A33C",
          transform: "rotate(45deg)",
          marginBottom: 40,
        }}
      />
      <div style={{ fontSize: 28, color: "#9A8E78", letterSpacing: 4, marginBottom: 16 }}>
        ATELIER
      </div>
      <div
        style={{
          fontSize: 96,
          fontWeight: 700,
          lineHeight: 1.05,
          color: "#EFE9DC",
        }}
      >
        A factory of
        <br />
        <span style={{ color: "#E8A33C", fontStyle: "italic" }}>agents</span>, in motion.
      </div>
      <div
        style={{
          marginTop: 60,
          fontSize: 20,
          color: "#5C544A",
          letterSpacing: 6,
        }}
      >
        v0.4 · CAL.04
      </div>
    </div>,
    { ...size },
  );
}
