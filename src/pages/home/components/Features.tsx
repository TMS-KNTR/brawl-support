import { useCallback, useEffect, useRef, useState } from 'react';

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

/* ── 3D tilt with dynamic shadow ── */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    const glow = glowRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rx = (y - 0.5) * -14;
    const ry = (x - 0.5) * 14;
    el.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(20px)`;
    el.style.boxShadow = `${(x - 0.5) * -30}px ${(y - 0.5) * -30}px 60px rgba(91,58,232,0.2), 0 0 50px rgba(91,58,232,0.08)`;
    if (glow) {
      glow.style.opacity = '1';
      glow.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(139,122,255,0.25) 0%, transparent 60%)`;
    }
  }, []);
  const handleLeave = useCallback(() => {
    const el = ref.current;
    const glow = glowRef.current;
    if (el) { el.style.transform = ''; el.style.boxShadow = ''; }
    if (glow) glow.style.opacity = '0';
  }, []);
  return { ref, glowRef, handleMove, handleLeave };
}

/* ── Glitch slot number ── */
function GlitchNumber({ value, visible, delay }: { value: string; visible: boolean; delay: number }) {
  const [display, setDisplay] = useState(value);
  const [glitch, setGlitch] = useState(false);
  const isNum = /^\d+$/.test(value);

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => {
      if (!isNum) { setGlitch(true); setTimeout(() => setGlitch(false), 400); return; }
      const target = parseInt(value);
      let f = 0;
      setGlitch(true);
      const iv = setInterval(() => {
        f++;
        if (f > 20) { setDisplay(value); setGlitch(false); clearInterval(iv); }
        else setDisplay(String(Math.floor(Math.random() * (target + 80))));
      }, 35);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, [visible, value, isNum, delay]);

  return (
    <span className={glitch ? 'feat-glitch-active' : ''}>{display}</span>
  );
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

const TIERS = ['SSR', 'UR', 'LR'];
const TIER_COLORS = ['#C4B5FD', '#8B7AFF', '#FFD700'];

export default function Features() {
  const cards = [
    { icon: 'ri-shield-check-line', highlight: 'PayPay', suffix: '', title: 'PayPay対応の安全決済', desc: 'クレジットカード・PayPayに対応。エスクロー方式で代行完了まで代金を安全に保全。', fx: 'shield' },
    { icon: 'ri-chat-private-line', highlight: '0', suffix: '件', title: '完全匿名チャット', desc: '情報漏洩ゼロ。個人情報を一切公開せずにやり取り可能。引き継ぎも専用チャットで安全に。', fx: 'rings' },
    { icon: 'ri-star-line', highlight: '99', suffix: '%', title: 'プロの技術', desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。', fx: 'stars' },
  ];

  const secondary = [
    { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
    { icon: 'ri-refund-line', title: '全額返金保証', desc: '未達成なら返金' },
    { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
  ];

  const header = useReveal(0.3);
  const grid = useReveal(0.08);
  const sub = useReveal(0.15);
  const t0 = useTilt(), t1 = useTilt(), t2 = useTilt();
  const tilts = [t0, t1, t2];

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
        @keyframes feat-scanline {
          0% { top: -5%; }
          100% { top: 105%; }
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
        @keyframes feat-materialize {
          0% { opacity: 0; transform: scale(0.85) translateY(40px); filter: blur(8px) brightness(2); }
          40% { filter: blur(0) brightness(1.5); }
          70% { transform: scale(1.02) translateY(-4px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0) brightness(1); }
        }
        @keyframes feat-flash {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
        @keyframes feat-numberIn {
          0% { opacity: 0; transform: scale(0.5) translateY(20px); filter: blur(10px); }
          50% { opacity: 1; transform: scale(1.08) translateY(-6px); filter: blur(0); }
          75% { transform: scale(0.97) translateY(2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* ══ CARD FX ══ */
        @keyframes feat-float {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes feat-holoShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes feat-meshMorph {
          0%,100% { background-position: 0% 0%; }
          33% { background-position: 100% 50%; }
          66% { background-position: 50% 100%; }
        }
        @keyframes feat-shimmerSweep {
          0% { transform: translateX(-100%) skewX(-15deg); }
          100% { transform: translateX(250%) skewX(-15deg); }
        }
        @keyframes feat-chargeVibrate {
          0%,100% { transform: translateX(0); }
          25% { transform: translateX(-1px); }
          75% { transform: translateX(1px); }
        }

        /* Unique FX */
        @keyframes feat-shieldAura {
          0%,100% { box-shadow: 0 0 0 0 rgba(91,58,232,0.4), 0 0 0 0 rgba(139,122,255,0.2); }
          50% { box-shadow: 0 0 24px 8px rgba(91,58,232,0.12), 0 0 40px 16px rgba(139,122,255,0.06); }
        }
        @keyframes feat-ringPulse {
          0% { transform: scale(0.5); opacity: 0.7; border-color: rgba(139,122,255,0.3); }
          100% { transform: scale(2.2); opacity: 0; border-color: rgba(139,122,255,0); }
        }
        @keyframes feat-starBurst {
          0%,100% { opacity: 0; transform: scale(0) rotate(0deg); }
          30% { opacity: 1; transform: scale(1.2) rotate(90deg); }
          60% { opacity: 0.6; transform: scale(0.8) rotate(180deg); }
        }

        /* Particles */
        @keyframes feat-particleDrift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: var(--po,0.3); }
          80% { opacity: var(--po,0.3); }
          100% { transform: translateY(-220px) translateX(30px) scale(0.5); opacity: 0; }
        }

        /* Secondary */
        @keyframes feat-hexReveal {
          0% { opacity: 0; transform: scale(0.4) rotate(-30deg); }
          60% { transform: scale(1.15) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes feat-energyPulse {
          0% { left: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        /* Glitch */
        .feat-glitch-active {
          animation: feat-glitchText 0.1s steps(2) infinite;
        }
        @keyframes feat-glitchText {
          0% { text-shadow: 2px 0 #8B7AFF, -2px 0 #C4B5FD; }
          50% { text-shadow: -1px 0 #5B3AE8, 1px 0 #FFD700; }
          100% { text-shadow: 1px 0 #C4B5FD, -1px 0 #8B7AFF; }
        }

        /* ══ CARD CLASS ══ */
        .feat-loot-card {
          transition: transform 0.6s cubic-bezier(0.22,1,0.36,1), box-shadow 0.6s ease;
          animation: feat-float 6s ease-in-out infinite;
          will-change: transform, box-shadow;
          transform-style: preserve-3d;
        }
        .feat-loot-card:nth-child(2) { animation-delay: -2s; }
        .feat-loot-card:nth-child(3) { animation-delay: -4s; }
        .feat-loot-card:hover {
          animation: feat-chargeVibrate 0.05s steps(2) 3;
        }

        /* Holo border */
        .feat-holo {
          position: absolute; inset: -1.5px; border-radius: 1.125rem; padding: 1.5px; pointer-events: none;
          background: linear-gradient(135deg, #5B3AE8, #8B7AFF, #C4B5FD, #FFD700, #8B7AFF, #5B3AE8, #C4B5FD);
          background-size: 400% 400%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor; mask-composite: exclude;
          opacity: 0; transition: opacity 0.5s ease;
        }
        .feat-loot-card:hover .feat-holo {
          opacity: 1;
          animation: feat-holoShift 3s linear infinite;
        }

        /* Noise texture overlay */
        .feat-noise {
          position: absolute; inset: 0; border-radius: inherit; pointer-events: none; mix-blend-mode: overlay; opacity: 0.06;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
          background-size: 128px 128px;
        }

        /* Hexagon clip */
        .feat-hex {
          clip-path: polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%);
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
              animation: header.visible ? 'feat-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            Why GEMSUKE
          </span>
          <h2
            className="text-[clamp(1.5rem,4vw,2.5rem)] font-extrabold text-[#1A1A2E] tracking-wider mb-5"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.12s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            なぜGEMSUKEが選ばれるのか
          </h2>
          <p
            className="text-[13px] text-[#7C6F99] max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            安全性、スピード、品質。すべてにおいて妥協しない。
          </p>
        </div>

        {/* ══ LOOT CARDS ══ */}
        <div ref={grid.ref} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {cards.map((c, i) => {
            const t = tilts[i];
            return (
              <div
                key={i}
                ref={t.ref}
                onMouseMove={t.handleMove}
                onMouseLeave={t.handleLeave}
                className="feat-loot-card group relative rounded-2xl cursor-default"
                style={{
                  opacity: grid.visible ? 1 : 0,
                  animation: grid.visible
                    ? `feat-materialize 0.9s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.2}s forwards`
                    : 'none',
                  animationFillMode: 'both',
                }}
              >
                {/* Holo border */}
                <div className="feat-holo" />

                {/* Card surface */}
                <div
                  className="relative p-8 rounded-2xl overflow-hidden h-full"
                  style={{
                    background: `
                      radial-gradient(ellipse 120% 80% at ${20 + i * 30}% 110%, rgba(91,58,232,0.18) 0%, transparent 50%),
                      radial-gradient(ellipse 80% 60% at ${70 - i * 20}% -10%, rgba(139,122,255,0.08) 0%, transparent 50%),
                      linear-gradient(155deg, #151025 0%, #0C0618 35%, #110A28 65%, #0E071E 100%)
                    `,
                    backgroundSize: '100% 100%, 100% 100%, 100% 100%',
                  }}
                >
                  {/* Animated mesh */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-30"
                    style={{
                      background: `
                        radial-gradient(circle at ${30 + i * 20}% 80%, rgba(91,58,232,0.2) 0%, transparent 40%),
                        radial-gradient(circle at ${70 - i * 15}% 20%, rgba(139,122,255,0.15) 0%, transparent 40%)
                      `,
                      backgroundSize: '200% 200%',
                      animation: 'feat-meshMorph 12s ease infinite',
                    }}
                  />

                  {/* Noise texture */}
                  <div className="feat-noise" />

                  {/* Mouse glow */}
                  <div
                    ref={t.glowRef}
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 z-[5]"
                    style={{ opacity: 0 }}
                  />

                  {/* Hover shimmer */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[6]">
                    <div
                      className="absolute top-0 bottom-0 w-[40%]"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)',
                        animation: 'feat-shimmerSweep 2s ease-in-out infinite',
                      }}
                    />
                  </div>


                  {/* ── Unique FX ── */}
                  {c.fx === 'shield' && (
                    <div className="absolute top-12 right-8 pointer-events-none z-[2]">
                      <div className="relative w-14 h-14 flex items-center justify-center" style={{ animation: 'feat-shieldAura 3s ease-in-out infinite' }}>
                        <i className="ri-shield-check-fill text-[28px] text-[#5B3AE8]/15"></i>
                      </div>
                    </div>
                  )}
                  {c.fx === 'rings' && (
                    <div className="absolute top-14 right-10 pointer-events-none z-[2]">
                      {[0,1,2,3].map(r => (
                        <div
                          key={r}
                          className="absolute rounded-full border"
                          style={{
                            width: 24, height: 24, top: -12, left: -12,
                            borderColor: `rgba(139,122,255,${0.2 - r * 0.04})`,
                            animation: `feat-ringPulse ${1.8 + r * 0.4}s ease-out ${r * 0.5}s infinite`,
                          }}
                        />
                      ))}
                      <i className="ri-lock-2-fill text-[14px] text-[#8B7AFF]/20 relative z-10"></i>
                    </div>
                  )}
                  {c.fx === 'stars' && (
                    <div className="absolute top-10 right-6 pointer-events-none z-[2]">
                      {[0,1,2,3,4].map(s => (
                        <div
                          key={s}
                          className="absolute"
                          style={{
                            width: 3 + (s % 2) * 2, height: 3 + (s % 2) * 2,
                            top: s * 10 - 5, left: (s % 3) * 14 - 8,
                            borderRadius: '50%',
                            background: s % 2 === 0 ? '#FFD700' : '#C4B5FD',
                            animation: `feat-starBurst ${1.5 + s * 0.3}s ease-in-out ${s * 0.5}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Flash overlay on reveal */}
                  {grid.visible && (
                    <div
                      className="absolute inset-0 bg-white pointer-events-none rounded-2xl z-30"
                      style={{
                        animation: `feat-flash 0.5s ease ${0.15 + i * 0.2}s forwards`,
                        animationFillMode: 'both', opacity: 0,
                      }}
                    />
                  )}

                  {/* ── Content ── */}
                  <div className="relative z-10">
                    {/* Ghost number (depth layer) */}
                    <div className="absolute -top-4 -left-2 pointer-events-none select-none" aria-hidden="true">
                      <span
                        className="text-[100px] font-black leading-none text-white/[0.02]"
                        style={{ fontFamily: '"Orbitron", sans-serif' }}
                      >
                        {c.highlight}
                      </span>
                    </div>

                    {/* Big number */}
                    <div className="flex items-baseline gap-1.5 mb-5">
                      <p
                        className="text-[52px] font-black leading-none"
                        style={{
                          fontFamily: '"Orbitron", sans-serif',
                          background: 'linear-gradient(135deg, #fff 0%, #E0D4FF 30%, #8B7AFF 60%, #5B3AE8 100%)',
                          backgroundSize: '300% 300%',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          animation: grid.visible
                            ? `feat-numberIn 0.9s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.2}s forwards, feat-holoShift 8s linear ${1.5 + i * 0.5}s infinite`
                            : 'none',
                          animationFillMode: 'both',
                          opacity: 0,
                        }}
                      >
                        <GlitchNumber value={c.highlight} visible={grid.visible} delay={400 + i * 200} />
                      </p>
                      {c.suffix && (
                        <span className="text-[22px] font-bold text-white/25" style={{ fontFamily: '"Rajdhani", sans-serif' }}>
                          {c.suffix}
                        </span>
                      )}
                    </div>

                    <h3
                      className="text-[16px] font-bold text-white mb-2.5 tracking-wide"
                      style={{ fontFamily: '"Rajdhani", sans-serif' }}
                    >
                      {c.title}
                    </h3>
                    <p className="text-[12px] text-[#9890B8] leading-[1.7] font-medium">
                      {c.desc}
                    </p>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

        {/* ══ SECONDARY — CIRCUIT HEXAGONS ══ */}
        <div ref={sub.ref} className="relative">

          <div className="grid grid-cols-3 gap-6">
            {secondary.map((s, i) => (
              <div
                key={i}
                className="flex flex-col items-center py-5"
                style={{
                  opacity: sub.visible ? 1 : 0,
                  animation: sub.visible
                    ? `feat-hexReveal 0.7s cubic-bezier(0.22,1,0.36,1) ${0.15 + i * 0.15}s forwards`
                    : 'none',
                  animationFillMode: 'both',
                }}
              >
                <div
                  className="feat-hex w-14 h-14 flex items-center justify-center mb-3.5 relative z-10"
                  style={{ background: 'linear-gradient(135deg, #EDE9FE, #F3F0FF)' }}
                >
                  <i className={`${s.icon} text-[20px] text-[#5B3AE8]`}></i>
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
