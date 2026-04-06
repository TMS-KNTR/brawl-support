import { useEffect, useRef, useState } from 'react';

/* ── Scroll-reveal ── */
function useReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ── Star field ── */
const STARS = Array.from({ length: 40 }, (_, i) => ({
  id: i, x: Math.random() * 100, y: Math.random() * 100,
  size: 0.8 + Math.random() * 1.5, dur: 2 + Math.random() * 4, del: Math.random() * 3,
}));

/* ── Floating particles ── */
const PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i, x: 5 + Math.random() * 90, size: 1.5 + Math.random() * 2.5,
  dur: 7 + Math.random() * 10, del: Math.random() * 6, hue: Math.random() > 0.5,
}));


export default function Features() {
  const features = [
    { icon: 'ri-bank-card-line', title: '選べる決済方法', desc: 'クレカ・コンビニ・銀行振込に対応。代行完了まで代金を安全に保管。', accent: '#8B7AFF', svgColor: '#10B981' },
    { icon: 'ri-chat-private-line', title: '完全匿名チャット', desc: '情報漏洩ゼロ。個人情報を一切公開せずにやり取り可能。アカウント共有も専用チャットで安全に。', accent: '#5B3AE8', svgColor: '#3B82F6' },
    { icon: 'ri-star-line', title: 'プロの技術', desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。', accent: '#C4B5FD', svgColor: '#F59E0B' },
  ];

  const secondary = [
    { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
    { icon: 'ri-refund-line', title: '30日間返金保証', desc: '未達成なら全額返金' },
    { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
  ];

  const header = useReveal(0.3);
  const grid = useReveal(0.08);
  const sub = useReveal(0.15);


  return (
    <section className="relative py-32 overflow-hidden">
      <style>{`
        /* ══ BACKGROUND ══ */
        @keyframes feat-aurora {
          0%,100% { background-position: 0% 50%; }
          25% { background-position: 50% 0%; }
          50% { background-position: 100% 50%; }
          75% { background-position: 50% 100%; }
        }
        @keyframes feat-twinkle {
          0%,100% { opacity: 0.1; }
          50% { opacity: 0.8; }
        }
        @keyframes feat-gridPulse {
          0%,100% { opacity: 0.02; }
          50% { opacity: 0.05; }
        }

        /* ══ REVEALS ══ */
        @keyframes feat-fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes feat-headerIn {
          from { opacity: 0; transform: translateY(24px) rotateX(40deg); }
          to { opacity: 1; transform: translateY(0) rotateX(0); }
        }

        @keyframes feat-cardReveal {
          0% {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
            filter: blur(12px) brightness(1.5);
          }
          40% {
            opacity: 1;
            filter: blur(4px) brightness(1.2);
          }
          70% {
            transform: translateY(-4px) scale(1.01);
            filter: blur(0) brightness(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0) brightness(1);
          }
        }

        /* ══ ACCENT LINE — left to right sweep ══ */
        @keyframes feat-lineSweep {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* ══ ACCENT DOT — breathing pulse ══ */
        @keyframes feat-dotBreathe {
          0%, 100% { box-shadow: 0 0 0 0 var(--dot-color, #8B7AFF); }
          50% { box-shadow: 0 0 0 6px transparent; }
        }
        @keyframes feat-dotRingPulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(3); opacity: 0; }
        }

        /* ══ TITLE CHARS ══ */
        @keyframes feat-charIn {
          from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }

        /* ══ SVG FLOAT ══ */
        @keyframes feat-svgFloat {
          0%,100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(2deg); }
        }

        /* ══ CARD CLASS ══ */
        .feat-card {
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.5s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.4s ease;
        }
        .feat-card:hover {
          transform: translateY(-8px);
          box-shadow:
            0 24px 60px rgba(91,58,232,0.10),
            0 8px 24px rgba(0,0,0,0.04),
            0 0 0 1px rgba(139,122,255,0.15);
          border-color: rgba(139,122,255,0.35);
        }

        /* Hover: border glow pulse */
        .feat-card:hover .feat-border-glow {
          opacity: 1;
        }

        /* Hover: dot glow + scale + ring explode */
        .feat-dot-inner {
          transition: transform 0.3s cubic-bezier(0.22,1,0.36,1),
                      background 0.3s ease,
                      box-shadow 0.3s ease;
        }
        .feat-card:hover .feat-dot-inner {
          transform: scale(1.6);
          background: #5B3AE8 !important;
          box-shadow: 0 0 10px rgba(139,122,255,0.5), 0 0 20px rgba(91,58,232,0.2);
        }
        .feat-card:hover .feat-dot-ring {
          animation: feat-dotRingPulse 0.8s ease-out;
        }

        /* Hover: SVG visual lifts and glows */
        .feat-card .feat-visual {
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1),
                      filter 0.6s ease;
          animation: feat-svgFloat 5s ease-in-out infinite;
        }
        .feat-card:nth-child(2) .feat-visual { animation-delay: -1.7s; }
        .feat-card:nth-child(3) .feat-visual { animation-delay: -3.3s; }
        .feat-card:hover .feat-visual {
          animation-play-state: paused;
          transform: rotate(6deg) scale(1.12);
          filter: drop-shadow(0 4px 12px var(--accent-glow, rgba(139,122,255,0.3)));
        }

        /* Hover: shimmer sweep */
        @keyframes feat-shimmer {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
        .feat-card:hover .feat-shimmer {
          animation: feat-shimmer 1.2s ease-in-out;
        }

        /* ══ SECONDARY ══ */
        @keyframes feat-hexReveal {
          0% { opacity: 0; transform: scale(0.4) rotate(-30deg); }
          60% { transform: scale(1.15) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        .feat-hex {
          clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
        }
        .feat-hex-cell {
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .feat-hex-cell:hover {
          transform: translateY(-4px);
        }
        .feat-hex-cell:hover .feat-hex {
          box-shadow: 0 0 16px rgba(91,58,232,0.15);
        }
        .feat-hex-cell:hover .feat-hex-icon {
          transform: scale(1.15) rotate(8deg);
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1);
        }

        /* Particles */
        @keyframes feat-particleDrift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--po,0.3); }
          80% { opacity: var(--po,0.3); }
          100% { transform: translateY(-220px) translateX(30px) scale(0.5); opacity: 0; }
        }
      `}</style>

      {/* ══ DEEP SPACE BACKGROUND ══ */}
      <div className="absolute inset-0 bg-[#FAFBFF]" />

      {/* Aurora nebula */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(91,58,232,0.03) 0%, rgba(139,122,255,0.02) 25%, transparent 50%, rgba(196,181,253,0.03) 75%, rgba(91,58,232,0.02) 100%)',
          backgroundSize: '200% 200%',
          animation: 'feat-aurora 20s ease infinite',
        }}
      />

      {/* Geometric grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(91,58,232,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(91,58,232,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
          animation: 'feat-gridPulse 8s ease infinite',
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: 'radial-gradient(circle, #5B3AE8 0.6px, transparent 0.6px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Star field */}
      {STARS.map(s => (
        <div
          key={s.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.size, height: s.size, left: `${s.x}%`, top: `${s.y}%`,
            background: s.id % 3 === 0 ? '#8B7AFF' : s.id % 3 === 1 ? '#C4B5FD' : '#5B3AE8',
            animation: `feat-twinkle ${s.dur}s ease-in-out ${s.del}s infinite`,
          }}
        />
      ))}

      {/* Floating particles */}
      {PARTICLES.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size, height: p.size, left: `${p.x}%`, bottom: '10%',
            background: p.hue ? '#8B7AFF' : '#C4B5FD',
            '--po': 0.25,
            animation: `feat-particleDrift ${p.dur}s ease-in-out ${p.del}s infinite`,
            filter: 'blur(0.3px)',
          } as React.CSSProperties}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 0 120px rgba(26,26,46,0.06)' }} />

      {/* Section transitions */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">

        {/* ══ HEADER ══ */}
        <div ref={header.ref} className="text-center mb-20" style={{ perspective: '800px' }}>
          <span
            className="inline-block text-[10px] font-bold tracking-[0.3em] uppercase text-[#5B3AE8] mb-5"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) both' : 'none',
            }}
          >
            Why GEMUSUKE
          </span>
          <h2
            className="text-[clamp(1.5rem,4vw,2.5rem)] font-extrabold text-[#1A1A2E] tracking-wider mb-5"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.12s both' : 'none',
            }}
          >
            なぜげむ助が選ばれるのか
          </h2>
          <p
            className="text-[13px] text-[#7C6F99] max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both' : 'none',
            }}
          >
            安全性、スピード、品質。すべてにおいて妥協しない。
          </p>
        </div>

        {/* ══ FEATURE CARDS ══ */}
        <div ref={grid.ref} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 items-start">
          {features.map((f, i) => (
            <div
              key={i}
              className="feat-card relative rounded-2xl overflow-hidden cursor-default"
              style={{
                '--accent-glow': 'rgba(91,58,232,0.3)',
                '--dot-color': 'rgba(91,58,232,0.25)',
                background: '#fff',
                border: '1px solid rgba(91,58,232,0.15)',
                opacity: grid.visible ? 1 : 0,
                animation: grid.visible
                  ? `feat-cardReveal 0.9s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.18}s both`
                  : 'none',
              } as React.CSSProperties}
            >
              {/* Border glow on hover */}
              <div
                className="feat-border-glow absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500 z-[3]"
                style={{
                  opacity: 0,
                  boxShadow: 'inset 0 0 24px rgba(91,58,232,0.09), 0 0 20px rgba(91,58,232,0.07)',
                }}
              />

              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-[4]">
                <div
                  className="feat-shimmer absolute top-0 bottom-0 w-[35%] opacity-0 group-hover:opacity-100"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                  }}
                />
              </div>

              {/* Left accent line */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl z-[2]"
                style={{ background: 'linear-gradient(180deg, #5B3AE8, rgba(91,58,232,0.1))' }}
              />



              <div className="relative px-7 pt-8 pb-9">
                {/* SVG Visual — floating */}
                <div
                  className="feat-visual absolute top-4 right-4 pointer-events-none z-[1]"
                  style={{ width: 110, height: 110 }}
                >
                  {i === 0 && (
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <rect x="8" y="16" width="40" height="28" rx="4" fill={f.svgColor} fillOpacity="0.15" stroke={f.svgColor} strokeOpacity="0.4" strokeWidth="1.5" />
                      <rect x="8" y="22" width="40" height="5" fill={f.svgColor} fillOpacity="0.2" />
                      <rect x="12" y="34" width="14" height="3" rx="1.5" fill={f.svgColor} fillOpacity="0.25" />
                      <circle cx="52" cy="14" r="9" fill={f.svgColor} fillOpacity="0.2" stroke={f.svgColor} strokeOpacity="0.45" strokeWidth="1.5" />
                      <text x="52" y="18" textAnchor="middle" fontSize="10" fontWeight="bold" fill={f.svgColor} fillOpacity="0.5">¥</text>
                    </svg>
                  )}
                  {i === 1 && (
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M32 6L52 16V30C52 42 43 51 32 56C21 51 12 42 12 30V16L32 6Z" fill={f.svgColor} fillOpacity="0.12" stroke={f.svgColor} strokeOpacity="0.4" strokeWidth="1.5" strokeLinejoin="round" />
                      <rect x="26" y="28" width="12" height="10" rx="2" fill={f.svgColor} fillOpacity="0.2" />
                      <path d="M29 28V24C29 22.3 30.3 21 32 21C33.7 21 35 22.3 35 24V28" stroke={f.svgColor} strokeOpacity="0.45" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="32" cy="33" r="1.5" fill={f.svgColor} fillOpacity="0.5" />
                    </svg>
                  )}
                  {i === 2 && (
                    <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                      <path d="M22 14H42V28C42 34 38 40 32 42C26 40 22 34 22 28V14Z" fill={f.svgColor} fillOpacity="0.12" stroke={f.svgColor} strokeOpacity="0.3" strokeWidth="1.5" />
                      <path d="M22 18H16C16 24 18 26 22 26" stroke={f.svgColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M42 18H48C48 24 46 26 42 26" stroke={f.svgColor} strokeOpacity="0.3" strokeWidth="1.5" strokeLinecap="round" />
                      <path d="M32 20L34 26L40 26L35 30L37 36L32 32L27 36L29 30L24 26L30 26Z" fill={f.svgColor} fillOpacity="0.25" stroke={f.svgColor} strokeOpacity="0.5" strokeWidth="1" strokeLinejoin="round" />
                      <rect x="27" y="44" width="10" height="3" rx="1.5" fill={f.svgColor} fillOpacity="0.2" />
                      <rect x="24" y="48" width="16" height="2" rx="1" fill={f.svgColor} fillOpacity="0.15" />
                    </svg>
                  )}
                </div>

                {/* Accent dot with pulse ring */}
                <div className="relative w-3 h-3 mb-6">
                  <div
                    className="feat-dot-inner absolute inset-0 rounded-full"
                    style={{
                      background: '#5B3AE8',
                      animation: `feat-dotBreathe 2.5s ease-in-out ${i * 0.8}s infinite`,
                    }}
                  />
                  <div
                    className="feat-dot-ring absolute inset-0 rounded-full"
                    style={{ border: '1.5px solid rgba(91,58,232,0.3)' }}
                  />
                </div>

                {/* Title — staggered char reveal */}
                <h3
                  className="text-[22px] font-extrabold text-[#1A1A2E] leading-[1.2] mb-3.5 tracking-wide"
                  style={{ fontFamily: '"Rajdhani", sans-serif' }}
                >
                  {f.title.split('').map((char, ci) => (
                    <span
                      key={ci}
                      className="inline-block"
                      style={{
                        opacity: grid.visible ? 1 : 0,
                        animation: grid.visible
                          ? `feat-charIn 0.35s cubic-bezier(0.22,1,0.36,1) ${0.5 + i * 0.18 + ci * 0.03}s both`
                          : 'none',
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </h3>

                {/* Description */}
                <p
                  className="text-[13px] text-[#6B5F85] leading-[1.9] font-medium"
                  style={{
                    opacity: grid.visible ? 1 : 0,
                    animation: grid.visible
                      ? `feat-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) ${0.8 + i * 0.18}s both`
                      : 'none',
                  }}
                >
                  {f.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ══ SECONDARY — HEXAGONS ══ */}
        <div ref={sub.ref} className="relative">
          <div className="grid grid-cols-3 gap-6">
            {secondary.map((s, i) => (
              <div
                key={i}
                className="feat-hex-cell flex flex-col items-center py-5 cursor-default"
                style={{
                  opacity: sub.visible ? 1 : 0,
                  animation: sub.visible
                    ? `feat-hexReveal 0.7s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.15}s both`
                    : 'none',
                }}
              >
                <div
                  className="feat-hex w-14 h-14 flex items-center justify-center mb-3.5 relative z-10 transition-shadow duration-300"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #F3F0FF)' }}
                >
                  <i className={`${s.icon} text-[20px] text-[#5B3AE8] feat-hex-icon`} />
                </div>
                <span
                  className="text-[13px] font-bold text-[#1A1A2E] tracking-wide mb-1"
                  style={{ fontFamily: '"Rajdhani", sans-serif' }}
                >
                  {s.title}
                </span>
                <span className="text-[10px] text-[#8A7DA8] font-medium">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
