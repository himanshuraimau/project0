import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Flinote – AI-Powered Study Tools for Students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "white",
              marginBottom: 16,
              letterSpacing: "-2px",
            }}
          >
            Flinote
          </div>
          <div
            style={{
              fontSize: 32,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 40,
              maxWidth: 800,
              lineHeight: 1.4,
            }}
          >
            Turn any PDF, video, or lecture into AI-powered notes, flashcards, and quizzes
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 18,
              color: "rgba(255,255,255,0.75)",
            }}
          >
            <span>10,000+ students</span>
            <span>•</span>
            <span>4.9 stars</span>
            <span>•</span>
            <span>50+ languages</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
