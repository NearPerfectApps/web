import { useEffect, useRef, useState } from "react";

const CONTACT_EMAIL = "contact@nearperfectapps.xyz";
const TITLE = "NearPerfect";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@!%&?";
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];

// Classic space invader pixel art (11×8)
const INVADER = [
  [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
  [0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
  [0, 0, 0, 1, 1, 0, 1, 1, 0, 0, 0],
];
const PIXEL = 3;

export default function LandingPage() {
  const contentRef = useRef<HTMLDivElement>(null);
  const grainRef = useRef<HTMLCanvasElement>(null);
  const invaderRef = useRef<HTMLDivElement>(null);
  const invaderCanvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const smooth = useRef({ x: -9999, y: -9999 });
  const scrambling = useRef(false);
  const konamiSeq = useRef<string[]>([]);

  const [displayTitle, setDisplayTitle] = useState(TITLE);
  const [showVideo, setShowVideo] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [invaderMsg, setInvaderMsg] = useState(false);

  // ── RAF: parallax + grain mask + corner invader reveal ────────────
  useEffect(() => {
    let raf: number;

    const loop = () => {
      smooth.current.x += (mouse.current.x - smooth.current.x) * 0.07;
      smooth.current.y += (mouse.current.y - smooth.current.y) * 0.07;

      const sx = smooth.current.x;
      const sy = smooth.current.y;

      // Parallax on content
      if (contentRef.current) {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const dx = ((sx - cx) / cx) * 9;
        const dy = ((sy - cy) / cy) * 5;
        contentRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
      }

      // Grain revealed around cursor via CSS mask
      if (grainRef.current) {
        const mask = `radial-gradient(circle 260px at ${sx}px ${sy}px, black 0%, transparent 72%)`;
        grainRef.current.style.maskImage = mask;
        (
          grainRef.current.style as CSSStyleDeclaration & {
            webkitMaskImage: string;
          }
        ).webkitMaskImage = mask;
      }

      // Invader revealed when cursor is near top-right corner
      if (invaderRef.current) {
        const dist = Math.hypot(sx - window.innerWidth, sy);
        invaderRef.current.style.opacity = dist < 160 ? "1" : "0";
      }

      raf = requestAnimationFrame(loop);
    };

    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY };
    };
    const onLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // ── Film grain canvas ─────────────────────────────────────────────
  useEffect(() => {
    const canvas = grainRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const SIZE = 256;
    canvas.width = SIZE;
    canvas.height = SIZE;

    const draw = () => {
      const img = ctx.createImageData(SIZE, SIZE);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = (Math.random() * 255) | 0;
        d[i] = v;
        d[i + 1] = v;
        d[i + 2] = v;
        d[i + 3] = (Math.random() * 80) | 0;
      }
      ctx.putImageData(img, 0, 0);
    };

    const iv = setInterval(draw, 1000 / 16);
    return () => clearInterval(iv);
  }, []);

  // ── Space invader pixel art canvas (drawn once) ───────────────────
  useEffect(() => {
    const canvas = invaderCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = INVADER[0].length * PIXEL;
    canvas.height = INVADER.length * PIXEL;

    ctx.fillStyle = "rgba(255,255,255,0.65)";
    INVADER.forEach((row, y) => {
      row.forEach((px, x) => {
        if (px) ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL);
      });
    });
  }, []);

  // ── Konami code ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowVideo(false);
        return;
      }
      const next = [...konamiSeq.current, e.key].slice(-KONAMI.length);
      konamiSeq.current = next;
      if (next.join(",") === KONAMI.join(",")) {
        konamiSeq.current = [];
        setShowVideo(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ── Title scramble on click ───────────────────────────────────────
  const handleTitleClick = () => {
    if (scrambling.current) return;
    scrambling.current = true;
    let iter = 0;
    const total = 18;
    const iv = setInterval(() => {
      const progress = iter / total;
      setDisplayTitle(
        TITLE.split("")
          .map((char, i) =>
            progress > i / TITLE.length
              ? char
              : SCRAMBLE_CHARS[
                  Math.floor(Math.random() * SCRAMBLE_CHARS.length)
                ],
          )
          .join(""),
      );
      iter++;
      if (iter > total) {
        setDisplayTitle(TITLE);
        scrambling.current = false;
        clearInterval(iv);
      }
    }, 40);
  };

  // ── Invader click ─────────────────────────────────────────────────
  const handleInvaderClick = () => {
    setInvaderMsg(true);
    setTimeout(() => setInvaderMsg(false), 2500);
  };

  return (
    <div
      className="relative w-screen h-screen overflow-hidden flex flex-col items-center justify-center text-center px-6"
      style={{
        background: `
          radial-gradient(ellipse 90% 70% at 15% 110%, rgba(50,22,4,0.55) 0%, transparent 55%),
          radial-gradient(ellipse 60% 50% at 85% -10%, rgba(30,12,2,0.35) 0%, transparent 50%),
          #0b0907
        `,
      }}
    >
      {/* ── Grain — revealed only around the cursor ────────────────── */}
      <canvas
        ref={grainRef}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.9,
          pointerEvents: "none",
          zIndex: 1,
          imageRendering: "pixelated",
          mixBlendMode: "screen",
        }}
      />

      {/* ── Parallax content ──────────────────────────────────────── */}
      <div
        ref={contentRef}
        style={{ willChange: "transform", position: "relative", zIndex: 3 }}
        className="flex flex-col items-center"
      >
        <p
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(0.58rem, 1.2vw, 0.7rem)",
            color: "rgba(255,255,255,0.22)",
            letterSpacing: "0.45em",
            textTransform: "uppercase",
            marginBottom: "2rem",
          }}
        >
          independent app studio
        </p>

        <h1
          onClick={handleTitleClick}
          style={{
            fontFamily: "Syne, sans-serif",
            fontSize: "clamp(2.6rem, 7.5vw, 6.5rem)",
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.04em",
            textTransform: "uppercase",
            lineHeight: 1,
            margin: 0,
            cursor: "default",
            userSelect: "none",
          }}
        >
          {displayTitle}
        </h1>

        <p
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(0.6rem, 1.4vw, 0.82rem)",
            color: "rgba(255,255,255,0.18)",
            letterSpacing: "1.1em",
            textTransform: "uppercase",
            marginTop: "0.9rem",
            marginBottom: "3rem",
          }}
        >
          Apps
        </p>

        <p
          style={{
            fontFamily: "Space Grotesk, sans-serif",
            fontSize: "clamp(0.85rem, 1.8vw, 1rem)",
            fontWeight: 300,
            color: "rgba(255,255,255,0.36)",
            lineHeight: 1.0,
          }}
        >
          We build the apps we wish existed.
        </p>
      </div>

      {/* ── Contact ───────────────────────────────────────────────── */}
      <button
        onClick={() => setShowContact(true)}
        style={{
          position: "absolute",
          bottom: "2rem",
          right: "2rem",
          fontFamily: "Space Grotesk, sans-serif",
          fontSize: "0.8rem",
          fontWeight: 400,
          color: "rgba(255,255,255,0.28)",
          background: "none",
          border: "none",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          paddingBottom: "1px",
          cursor: "pointer",
          letterSpacing: "0.05em",
          zIndex: 4,
          transition: "color 0.25s ease, border-color 0.25s ease",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "rgba(255,255,255,0.72)";
          el.style.borderBottomColor = "rgba(255,255,255,0.35)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.color = "rgba(255,255,255,0.28)";
          el.style.borderBottomColor = "rgba(255,255,255,0.1)";
        }}
      >
        contact us
      </button>

      {/* ── Contact modal ─────────────────────────────────────────── */}
      {showContact && (
        <div
          onClick={() => setShowContact(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111009",
              border: "1px solid rgba(255,255,255,0.08)",
              padding: "clamp(2rem, 5vw, 3rem)",
              maxWidth: 380,
              width: "90vw",
              textAlign: "center",
              animation: "fadeIn 0.2s ease",
            }}
          >
            <p
              style={{
                fontFamily: "Space Grotesk, sans-serif",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.3)",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                marginBottom: "1.25rem",
              }}
            >
              get in touch
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              style={{
                fontFamily: "JetBrains Mono, monospace",
                fontSize: "clamp(0.8rem, 2.5vw, 1rem)",
                color: "#ffffff",
                textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.2)",
                paddingBottom: "2px",
                transition: "color 0.2s ease, border-color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "rgba(255,255,255,0.6)";
                el.style.borderBottomColor = "rgba(255,255,255,0.1)";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = "#ffffff";
                el.style.borderBottomColor = "rgba(255,255,255,0.2)";
              }}
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      )}

      {/* ── Konami hint ───────────────────────────────────────────── */}
      <p
        aria-hidden
        style={{
          position: "absolute",
          bottom: "2rem",
          left: "2rem",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "0.65rem",
          color: "rgba(255,255,255,0.2)",
          letterSpacing: "0.15em",
          userSelect: "none",
          zIndex: 4,
        }}
      >
        ↑↑↓↓←→←→ BA
      </p>

      {/* ── Corner easter egg: space invader ──────────────────────── */}
      <div
        ref={invaderRef}
        onClick={handleInvaderClick}
        style={{
          position: "absolute",
          top: "2rem",
          right: "2rem",
          opacity: 0,
          transition: "opacity 0.4s ease",
          cursor: "pointer",
          zIndex: 4,
        }}
      >
        <canvas
          ref={invaderCanvasRef}
          aria-hidden
          style={{ imageRendering: "pixelated", display: "block" }}
        />
      </div>

      {/* ── Invader message ───────────────────────────────────────── */}
      {invaderMsg && (
        <p
          style={{
            position: "absolute",
            top: "calc(2rem + 32px)",
            right: "2rem",
            fontFamily: "JetBrains Mono, monospace",
            fontSize: "0.6rem",
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.05em",
            userSelect: "none",
            zIndex: 4,
            animation: "fadeIn 0.3s ease",
            whiteSpace: "nowrap",
          }}
        >
          // TODO: world domination
        </p>
      )}

      {/* ── Easter egg: fullscreen video ──────────────────────────── */}
      {showVideo && (
        <div
          onClick={() => setShowVideo(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            cursor: "pointer",
          }}
        >
          <video
            src="/nevergonnagiveyouup.mp4"
            autoPlay
            loop
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
