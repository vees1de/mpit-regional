import Link from "next/link";
import type { CSSProperties, PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title: string;
  description: string;
}>;

const layoutStyle: CSSProperties = {
  minHeight: "100dvh",
  background: "linear-gradient(180deg, #0f1117 0%, #0b0c12 100%)",
  display: "grid",
  placeItems: "center",
  color: "#f4f5f7",
  padding: "32px",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: "540px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "20px",
  padding: "28px 24px",
  boxShadow: "0 18px 38px rgba(0, 0, 0, 0.45)",
  textAlign: "center",
};

const linkRowStyle: CSSProperties = {
  display: "flex",
  gap: "12px",
  justifyContent: "center",
  marginTop: "12px",
  flexWrap: "wrap",
};

const linkStyle: CSSProperties = {
  display: "inline-block",
  padding: "10px 16px",
  borderRadius: "12px",
  background: "#2563eb",
  color: "#fff",
  textDecoration: "none",
  fontWeight: 700,
  boxShadow: "0 10px 20px rgba(37, 99, 235, 0.35)",
};

const secondaryLinkStyle: CSSProperties = {
  ...linkStyle,
  background: "#22c55e",
  boxShadow: "0 10px 20px rgba(34, 197, 94, 0.35)",
};

const descriptionStyle: CSSProperties = {
  margin: "0 0 20px",
  color: "#c6c8d4",
  lineHeight: 1.6,
};

export function NavPlaceholderPage({ title, description, children }: Props) {
  return (
    <main style={layoutStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: "0 0 12px", fontSize: "24px" }}>{title}</h1>
        <p style={descriptionStyle}>{description}</p>
        {children}
        <div style={linkRowStyle}>
          <Link href="/feed" style={linkStyle}>
            В ленту игр
          </Link>
          <Link href="/" style={secondaryLinkStyle}>
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
