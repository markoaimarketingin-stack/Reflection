import { useEffect, useState } from "react"
import { Cpu } from "lucide-react"

import { getHealth } from "../api/api"

function StatusBadge() {
  const [status, setStatus] = useState("checking")

  useEffect(() => {
    getHealth()
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"))
  }, [])

  const variants = {
    online: {
      label: "Connected",
      dot: "#34d399",
      text: "#d1fae5",
      background: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.12)",
      glow: "0 14px 28px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
    },
    offline: {
      label: "Offline",
      dot: "#f87171",
      text: "#fecaca",
      background: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.12)",
      glow: "0 14px 28px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
    },
    checking: {
      label: "Connecting",
      dot: "#52525b",
      text: "#e4e4e7",
      background: "rgba(255, 255, 255, 0.08)",
      border: "rgba(255, 255, 255, 0.12)",
      glow: "0 14px 28px rgba(0, 0, 0, 0.16), inset 0 1px 0 rgba(255,255,255,0.06)",
    },
  }

  const variant = variants[status]

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: 999,
        background: variant.background,
        border: `1px solid ${variant.border}`,
        boxShadow: variant.glow,
        backdropFilter: "blur(12px)",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: variant.dot,
          boxShadow: `0 0 14px ${variant.dot}`,
          animation: status === "online" ? "pulse-dot 2s ease-in-out infinite" : "none",
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: variant.text,
        }}
      >
        {variant.label}
      </span>
    </div>
  )
}

function BrandMark() {
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 16,
        border: "1px solid rgba(255, 255, 255, 0.08)",
        background: "#050505",
        boxShadow:
          "0 18px 38px rgba(0, 0, 0, 0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(16px)",
      }}
    >
      <Cpu size={18} strokeWidth={1.9} style={{ color: "#ffffff" }} />
    </div>
  )
}

export default function AppHeader() {
  return (
    <header
      data-intro-reveal="navbar"
      style={{
        borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 18,
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: "linear-gradient(180deg, rgba(5,5,5,0.98) 0%, rgba(10,10,10,0.95) 100%)",
        backdropFilter: "blur(22px)",
        boxShadow: "0 18px 40px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.04)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
        <div data-intro-anchor="brand" style={{ flexShrink: 0 }}>
          <BrandMark />
        </div>
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Marko AI
          </h1>
          <p
            style={{
              margin: "6px 0 0",
              fontSize: 14,
              fontWeight: 500,
              letterSpacing: "-0.01em",
              color: "rgba(255, 255, 255, 0.72)",
              whiteSpace: "nowrap",
            }}
          >
            Marketing intelligence for multi-agent analysis
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", minWidth: 128 }}>
        <StatusBadge />
      </div>
    </header>
  )
}
