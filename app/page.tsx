import Link from "next/link";

function InsiderKaeufeIllustration() {
  return (
    <svg
      viewBox="0 0 560 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="barGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c026d3" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <rect x="48" y="118" width="92" height="202" rx="6" fill="#131316" stroke="rgba(255,255,255,0.14)" />
      <g fill="rgba(255,255,255,0.07)">
        <rect x="64" y="140" width="16" height="18" rx="2" />
        <rect x="88" y="140" width="16" height="18" rx="2" />
        <rect x="112" y="140" width="16" height="18" rx="2" />
        <rect x="64" y="170" width="16" height="18" rx="2" />
        <rect x="112" y="170" width="16" height="18" rx="2" />
        <rect x="64" y="200" width="16" height="18" rx="2" />
        <rect x="88" y="200" width="16" height="18" rx="2" />
        <rect x="112" y="230" width="16" height="18" rx="2" />
        <rect x="64" y="260" width="16" height="18" rx="2" />
        <rect x="88" y="260" width="16" height="18" rx="2" />
      </g>
      <rect x="88" y="170" width="16" height="18" rx="2" fill="url(#barGrad)" />
      <rect x="112" y="200" width="16" height="18" rx="2" fill="url(#barGrad)" />
      <rect x="64" y="230" width="16" height="18" rx="2" fill="url(#barGrad)" />
      <rect x="90" y="290" width="12" height="30" fill="rgba(255,255,255,0.1)" />

      <line x1="200" y1="320" x2="536" y2="320" stroke="rgba(255,255,255,0.16)" />

      <rect x="200" y="260" width="40" height="60" rx="8" fill="rgba(255,255,255,0.08)" />
      <rect x="256" y="230" width="40" height="90" rx="8" fill="rgba(255,255,255,0.08)" />
      <rect x="312" y="250" width="40" height="70" rx="8" fill="rgba(255,255,255,0.08)" />
      <rect x="368" y="190" width="40" height="130" rx="8" fill="rgba(255,255,255,0.1)" />
      <rect x="424" y="210" width="40" height="110" rx="8" fill="rgba(255,255,255,0.1)" />
      <rect x="480" y="150" width="40" height="170" rx="8" fill="url(#barGrad)" />

      <polyline
        points="220,260 276,230 332,250 388,190 444,210 500,150"
        fill="none"
        stroke="url(#lineGrad)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle
        cx="500"
        cy="150"
        r="13"
        fill="none"
        stroke="#a855f7"
        strokeWidth="2"
        className="origin-center animate-[home-ringpulse_2.2s_ease-out_infinite] motion-reduce:animate-none"
        style={{ transformBox: "fill-box" }}
      />
      <circle cx="500" cy="150" r="8" fill="#3b82f6" />
    </svg>
  );
}

function TradingIntelligenceIllustration() {
  return (
    <svg
      viewBox="0 0 560 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="candleGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c026d3" />
          <stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
      </defs>

      <line x1="40" y1="330" x2="530" y2="330" stroke="rgba(255,255,255,0.14)" />

      <polyline
        points="82,168 162,138 242,192 322,120 402,168 482,96"
        fill="none"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
        strokeDasharray="3 7"
      />

      <g stroke="rgba(255,255,255,0.35)" strokeWidth="2">
        <line x1="82" y1="120" x2="82" y2="260" />
        <line x1="162" y1="90" x2="162" y2="230" />
        <line x1="242" y1="150" x2="242" y2="270" />
        <line x1="322" y1="70" x2="322" y2="210" />
        <line x1="402" y1="120" x2="402" y2="250" />
        <line x1="482" y1="60" x2="482" y2="190" />
      </g>
      <g>
        <rect x="70" y="150" width="24" height="60" rx="3" fill="rgba(255,255,255,0.14)" />
        <rect x="150" y="105" width="24" height="55" rx="3" fill="url(#candleGrad)" />
        <rect x="230" y="180" width="24" height="60" rx="3" fill="rgba(255,255,255,0.14)" />
        <rect x="310" y="90" width="24" height="55" rx="3" fill="url(#candleGrad)" />
        <rect x="390" y="160" width="24" height="55" rx="3" fill="rgba(255,255,255,0.14)" />
        <rect x="470" y="75" width="24" height="60" rx="3" fill="url(#candleGrad)" />
      </g>

      <circle cx="352" cy="150" r="74" fill="rgba(59,130,246,0.05)" stroke="#3b82f6" strokeWidth="5.5" />
      <line x1="404" y1="203" x2="456" y2="255" stroke="#3b82f6" strokeWidth="11" strokeLinecap="round" />
    </svg>
  );
}

function TradingAcademyIllustration() {
  return (
    <svg
      viewBox="0 0 560 380"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="stepGrad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#c026d3" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>

      <line x1="40" y1="320" x2="520" y2="320" stroke="rgba(255,255,255,0.14)" />

      <rect x="60" y="280" width="76" height="40" rx="4" fill="#131316" stroke="rgba(255,255,255,0.14)" />
      <rect x="144" y="240" width="76" height="80" rx="4" fill="#131316" stroke="rgba(255,255,255,0.14)" />
      <rect x="228" y="200" width="76" height="120" rx="4" fill="#131316" stroke="rgba(255,255,255,0.14)" />
      <rect x="312" y="160" width="76" height="160" rx="4" fill="#131316" stroke="rgba(255,255,255,0.14)" />
      <rect x="396" y="120" width="76" height="200" rx="4" fill="url(#stepGrad)" />

      <line x1="434" y1="72" x2="434" y2="116" stroke="#f5f5f7" strokeWidth="2" />
      <polygon points="434,68 378,86 434,104 490,86" fill="#0b0b0d" stroke="#f5f5f7" strokeWidth="1.5" />
      <polygon points="378,86 434,104 434,72 378,54" fill="rgba(255,255,255,0.9)" opacity="0.06" />
    </svg>
  );
}

const GLOW_MAGENTA = "radial-gradient(ellipse 55% 60% at 50% 30%, rgba(192,38,211,0.24), transparent 70%)";
const GLOW_PURPLE = "radial-gradient(ellipse 55% 60% at 50% 30%, rgba(168,85,247,0.24), transparent 70%)";
const GLOW_BLUE = "radial-gradient(ellipse 55% 60% at 50% 30%, rgba(59,130,246,0.26), transparent 70%)";
const SCRIM_BACKGROUND =
  "radial-gradient(ellipse 72% 68% at 50% 50%, rgba(4,4,7,0.82) 0%, rgba(4,4,7,0.58) 42%, rgba(4,4,7,0.18) 68%, transparent 86%)";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-4xl px-4 pt-24 pb-16 text-center sm:px-6 sm:pt-32">
        <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl">
          Willkommen bei <span className="text-gradient">TradeInsider</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-balance">
          Deine Plattform für Insider-Käufe, Aktienanalysen und alles rund ums Trading.
        </p>
      </section>

      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-24 sm:px-6">
        {/* Insider Käufe */}
        <section className="relative py-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[35%] -inset-y-[15%] -z-10 blur-[70px]"
            style={{ background: GLOW_MAGENTA }}
          />
          <div className="relative mx-auto min-h-[460px] w-full max-w-[900px] overflow-hidden rounded-[32px] border border-white/[0.18] bg-surface shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] md:aspect-[560/380] md:min-h-0">
            <InsiderKaeufeIllustration />
            <div aria-hidden className="absolute inset-0" style={{ background: SCRIM_BACKGROUND }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-10 text-center sm:px-10">
              <p className="mb-4 inline-flex items-center gap-2 font-mono text-xs tracking-wider text-foreground uppercase">
                <span className="relative h-[7px] w-[7px] rounded-full bg-gradient-accent">
                  <span className="absolute -inset-[5px] animate-[home-livepulse_2.2s_ease-out_infinite] rounded-full border border-[#a855f7] motion-reduce:animate-none" />
                </span>
                Live · SEC EDGAR &amp; EQS News
              </p>
              <h2 className="mb-4 text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-tight text-balance [text-shadow:0_4px_26px_rgba(0,0,0,0.55)]">
                Insider Käufe
              </h2>
              <p className="mb-8 max-w-xl text-[1.08rem] leading-relaxed text-[#d4d4d9] [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
                Insider-Käufe und -Verkäufe von Vorständen in Echtzeit — USA (SEC) und Deutschland. Wenn
                Führungskräfte eigenes Geld in die eigene Aktie stecken, lohnt sich ein zweiter Blick.
              </p>
              <Link
                href="/insider-kaeufe"
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-accent px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_-8px_rgba(168,85,247,0.55)] transition hover:-translate-y-px hover:opacity-90"
              >
                Jetzt ansehen →
              </Link>
            </div>
          </div>
        </section>

        {/* Trading Intelligence */}
        <section className="relative border-t border-border py-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[35%] -inset-y-[15%] -z-10 blur-[70px]"
            style={{ background: GLOW_PURPLE }}
          />
          <div className="relative mx-auto min-h-[460px] w-full max-w-[900px] overflow-hidden rounded-[32px] border border-white/[0.18] bg-surface shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] md:aspect-[560/380] md:min-h-0">
            <TradingIntelligenceIllustration />
            <div aria-hidden className="absolute inset-0" style={{ background: SCRIM_BACKGROUND }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-10 text-center sm:px-10">
              <p className="mb-4">
                <span className="rounded-full border border-white/[0.18] bg-black/50 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground uppercase backdrop-blur-sm">
                  Bald
                </span>
              </p>
              <h2 className="mb-4 text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-tight text-balance [text-shadow:0_4px_26px_rgba(0,0,0,0.55)]">
                Trading Intelligence
              </h2>
              <p className="mb-8 max-w-xl text-[1.08rem] leading-relaxed text-[#d4d4d9] [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
                Fundamentale und technische Analysen zu Aktien — Kennzahlen, Chartmuster und Indikatoren an
                einem Ort, statt in fünf verschiedenen Tabs.
              </p>
              <Link
                href="/trading-intelligence"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-black/45 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:-translate-y-px hover:border-white/35"
              >
                Mehr erfahren →
              </Link>
            </div>
          </div>
        </section>

        {/* Trading Academy */}
        <section className="relative border-t border-border py-10 sm:py-14">
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-[35%] -inset-y-[15%] -z-10 blur-[70px]"
            style={{ background: GLOW_BLUE }}
          />
          <div className="relative mx-auto min-h-[460px] w-full max-w-[900px] overflow-hidden rounded-[32px] border border-white/[0.18] bg-surface shadow-[0_40px_90px_-30px_rgba(0,0,0,0.7)] md:aspect-[560/380] md:min-h-0">
            <TradingAcademyIllustration />
            <div aria-hidden className="absolute inset-0" style={{ background: SCRIM_BACKGROUND }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-10 text-center sm:px-10">
              <p className="mb-4">
                <span className="rounded-full border border-white/[0.18] bg-black/50 px-3 py-1 text-[11px] font-medium tracking-wide text-foreground uppercase backdrop-blur-sm">
                  Bald
                </span>
              </p>
              <h2 className="mb-4 text-[clamp(2rem,4vw,2.75rem)] font-extrabold tracking-tight text-balance [text-shadow:0_4px_26px_rgba(0,0,0,0.55)]">
                Trading Academy
              </h2>
              <p className="mb-8 max-w-xl text-[1.08rem] leading-relaxed text-[#d4d4d9] [text-shadow:0_2px_16px_rgba(0,0,0,0.6)]">
                Kurse und Guides rund ums Trading — von den Grundlagen bis zur eigenen Strategie, Schritt
                für Schritt aufgebaut.
              </p>
              <Link
                href="/trading-academy"
                className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.18] bg-black/45 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:-translate-y-px hover:border-white/35"
              >
                Mehr erfahren →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
