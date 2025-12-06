"use client";

import { useEffect, useState } from "react";

const containerStyle: React.CSSProperties = {
  minHeight: "100dvh",
  display: "grid",
  placeItems: "center",
  background: "linear-gradient(180deg, #0c1018 0%, #0a0d14 100%)",
  color: "#f6f7fb",
  fontFamily: "Inter, system-ui, -apple-system, sans-serif",
  padding: "24px",
};

const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "420px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "18px",
  padding: "28px 24px",
  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.45)",
};

const buttonStyle: React.CSSProperties = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: "12px",
  border: "none",
  background: "#2787f5",
  color: "#fff",
  fontWeight: 800,
  fontSize: "16px",
  cursor: "pointer",
  boxShadow: "0 12px 24px rgba(39, 135, 245, 0.35)",
};

const helperStyle: React.CSSProperties = {
  marginTop: "12px",
  color: "#c7c9d4",
  fontSize: "13px",
  lineHeight: 1.5,
  textAlign: "center" as const,
};

export default function LoginPage() {
  const [redirectUrl, setRedirectUrl] = useState<string>("/");
  const [startUrl, setStartUrl] = useState<string>("/api/auth/vk/start");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const redirect = params.get("redirect");
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL("/api/auth/vk/start", window.location.origin);
    url.searchParams.set("redirect", redirectUrl);
    setStartUrl(url.toString());
  }, [redirectUrl]);

  return (
    <main style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={{ margin: "0 0 10px" }}>Вход через VK ID</h1>
        <p style={{ margin: "0 0 20px", color: "#c7c9d4" }}>
          Авторизуйтесь, чтобы продолжить к приложению и игровому фиду.
        </p>
        <button
          type="button"
          style={buttonStyle}
          onClick={() => {
            window.location.href = startUrl;
          }}
        >
          Войти через VK ID
        </button>
        <div style={helperStyle}>123</div>
      </div>
    </main>
  );
}
