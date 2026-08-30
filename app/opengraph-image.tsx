import { ImageResponse } from "next/og";

export const alt = "AI Body Fat Calculator body composition and physique progress tracker";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "68px 76px",
        color: "#172119",
        background: "linear-gradient(120deg, #f2f8e5 0%, #fffdf7 55%, #e8f1d2 100%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, fontWeight: 800 }}>
        <div
          style={{
            width: 58,
            height: 58,
            borderRadius: 999,
            background: "#172119",
            color: "#c9ff3d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
          }}
        >
          BF
        </div>
        AI Body Fat Calculator
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ fontSize: 73, lineHeight: 1.02, letterSpacing: -3, fontWeight: 800, maxWidth: 1040 }}>
          AI Body Fat Calculator That Tracks Your Progress
        </div>
        <div style={{ display: "flex", fontSize: 27, color: "#536052" }}>
          Estimate your range · Assess muscle balance · Build a better next step
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 22, fontWeight: 700 }}>
        <span style={{ color: "#658313" }}>Free first analysis</span>
        <span>•</span>
        <span>No signup</span>
        <span>•</span>
        <span>Privacy-first</span>
      </div>
    </div>,
    size,
  );
}
