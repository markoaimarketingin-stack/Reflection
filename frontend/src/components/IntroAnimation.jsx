import { Cpu } from "lucide-react"
import { useEffect, useLayoutEffect, useMemo, useState } from "react"

const INTRO_KEY = "campaign-intelligence-intro-shown"

export default function IntroAnimation({ children, onComplete }) {
  const [stage, setStage] = useState("intro")
  const [targetOffset, setTargetOffset] = useState({ x: 0, y: 0 })

  useLayoutEffect(() => {
    const updateTarget = () => {
      const anchor = document.querySelector('[data-intro-anchor="brand"]')
      if (!anchor) {
        setTargetOffset({
          x: -window.innerWidth * 0.34,
          y: -window.innerHeight * 0.4,
        })
        return
      }

      const rect = anchor.getBoundingClientRect()
      setTargetOffset({
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
      })
    }

    updateTarget()
    window.addEventListener("resize", updateTarget)
    return () => window.removeEventListener("resize", updateTarget)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const resetIntroFlag = () => {
      window.sessionStorage.removeItem(INTRO_KEY)
    }

    window.addEventListener("beforeunload", resetIntroFlag)
    window.addEventListener("pagehide", resetIntroFlag)

    if (window.sessionStorage.getItem(INTRO_KEY)) {
      setStage("done")
      onComplete?.()
      return () => {
        window.removeEventListener("beforeunload", resetIntroFlag)
        window.removeEventListener("pagehide", resetIntroFlag)
      }
    }

    const timers = [
      window.setTimeout(() => setStage("transitioning"), 1100),
      window.setTimeout(() => setStage("revealing"), 1600),
      window.setTimeout(() => {
        window.sessionStorage.setItem(INTRO_KEY, "true")
        setStage("done")
        onComplete?.()
      }, 2000),
    ]

    return () => {
      timers.forEach(window.clearTimeout)
      window.removeEventListener("beforeunload", resetIntroFlag)
      window.removeEventListener("pagehide", resetIntroFlag)
    }
  }, [onComplete])

  const logoTransform = useMemo(() => {
    if (stage === "transitioning" || stage === "revealing") {
      return `translate(-50%, -50%) translate(${targetOffset.x}px, ${targetOffset.y}px) scale(0.36)`
    }
    return "translate(-50%, -50%) scale(1)"
  }, [stage, targetOffset.x, targetOffset.y])

  const contentStage = stage === "done" ? "done" : stage === "revealing" ? "revealing" : "hidden"

  return (
    <>
      <div data-intro-stage={contentStage} style={{ minHeight: "100vh" }}>
        {children}
      </div>

      {stage !== "done" && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 50% 28%, rgba(125, 211, 252, 0.14) 0%, rgba(125, 211, 252, 0.04) 18%, transparent 42%), linear-gradient(180deg, #010203 0%, #06080c 54%, #0a0d12 100%)",
            opacity: stage === "revealing" ? 0 : 1,
            transition: "opacity 0.4s ease-out",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg, rgba(255, 255, 255, 0.035) 0%, transparent 26%, transparent 68%, rgba(125, 211, 252, 0.03) 100%)",
            }}
          />

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: logoTransform,
              transformOrigin: "center center",
              transition: "transform 0.65s cubic-bezier(0.4, 0, 0.2, 1), gap 0.65s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: stage === "intro" ? 16 : 0,
            }}
          >
            <div
              style={{
                position: "relative",
                width: 92,
                height: 92,
                borderRadius: 24,
                border: "1px solid rgba(255, 255, 255, 0.14)",
                background:
                  "linear-gradient(180deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)",
                boxShadow:
                  "0 20px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 36px rgba(125, 211, 252, 0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: -26,
                  borderRadius: 999,
                  background: "radial-gradient(circle, rgba(125, 211, 252, 0.16) 0%, transparent 72%)",
                  opacity: stage === "intro" ? 1 : 0.4,
                  transition: "opacity 0.35s ease",
                }}
              />
              <Cpu size={42} strokeWidth={1.8} style={{ color: "#e5f6ff", position: "relative" }} />
            </div>

            <div
              style={{
                textAlign: "center",
                opacity: stage === "transitioning" ? 0 : 1,
                transform: stage === "transitioning" ? "translateY(-10px)" : "translateY(0px)",
                maxHeight: stage === "intro" ? 120 : 0,
                overflow: "hidden",
                transition: "opacity 0.25s ease, transform 0.25s ease, max-height 0.45s ease",
              }}
            >
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 700,
                  lineHeight: 1.05,
                  letterSpacing: "-0.03em",
                  color: "#f8fbff",
                  textShadow: "0 8px 30px rgba(125, 211, 252, 0.12)",
                }}
              >
                Campaign Intelligence
              </div>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(226, 232, 240, 0.72)",
                }}
              >
                Campaign Intelligence Engine
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        [data-intro-stage="hidden"] [data-intro-reveal] {
          opacity: 0;
          transform: translateY(18px) scale(0.985);
          filter: blur(8px);
        }

        [data-intro-stage="revealing"] [data-intro-reveal],
        [data-intro-stage="done"] [data-intro-reveal] {
          opacity: 1;
          transform: translateY(0) scale(1);
          filter: blur(0);
        }

        [data-intro-reveal] {
          transition-property: opacity, transform, filter;
          transition-duration: 0.48s;
          transition-timing-function: ease;
          will-change: opacity, transform, filter;
        }

        [data-intro-reveal="navbar"] {
          transition-delay: 0ms;
        }

        [data-intro-reveal="analyze-panel"] {
          transition-delay: 110ms;
        }

        [data-intro-reveal="results-panel"] {
          transition-delay: 220ms;
        }
      `}</style>
    </>
  )
}
