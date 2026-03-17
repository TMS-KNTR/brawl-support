import { useCallback, useEffect, useRef, useState } from 'react';

/* ── Scroll-reveal hook ── */
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

/* ── 3D tilt card hook ── */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const handleMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.transform = `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) translateY(-8px) scale(1.02)`;
  }, []);
  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = '';
  }, []);
  return { ref, handleMove, handleLeave };
}

/* ── Slot-machine number component ── */
function SlotNumber({ value, visible, delay }: { value: string; visible: boolean; delay: number }) {
  const [display, setDisplay] = useState(value);
  const isNumeric = /^\d+$/.test(value);

  useEffect(() => {
    if (!visible || !isNumeric) return;
    const target = parseInt(value);
    let frame = 0;
    const totalFrames = 18;
    const interval = setInterval(() => {
      frame++;
      if (frame >= totalFrames) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(String(Math.floor(Math.random() * (target + 50))));
      }
    }, 40);
    const timer = setTimeout(() => {
      /* kick off after delay */
    }, delay);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, [visible, value, isNumeric, delay]);

  return <>{display}</>;
}

/* ── Floating particles ── */
const PARTICLES = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  x: 10 + Math.random() * 80,
  size: 2 + Math.random() * 2,
  duration: 6 + Math.random() * 8,
  delay: Math.random() * 5,
  opacity: 0.15 + Math.random() * 0.25,
}));

export default function Features() {
  const primary = [
    {
      icon: 'ri-shield-check-line',
      highlight: 'PayPay',
      highlightSuffix: '',
      title: 'PayPay対応の安全決済',
      desc: 'クレジットカード・PayPayに対応。エスクロー方式で代行完了まで代金を安全に保全。',
      uniqueEffect: 'shield',
    },
    {
      icon: 'ri-chat-private-line',
      highlight: '0',
      highlightSuffix: '件',
      title: '完全匿名チャット',
      desc: '情報漏洩ゼロ。個人情報を一切公開せずにやり取り可能。引き継ぎも専用チャットで安全に。',
      uniqueEffect: 'lock',
    },
    {
      icon: 'ri-star-line',
      highlight: '99',
      highlightSuffix: '%',
      title: 'プロの技術',
      desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。',
      uniqueEffect: 'stars',
    },
  ];

  const secondary = [
    { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
    { icon: 'ri-refund-line', title: '全額返金保証', desc: '未達成なら返金' },
    { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
  ];

  const header = useReveal(0.3);
  const primaryGrid = useReveal(0.1);
  const secondaryGrid = useReveal(0.15);
  const tilt0 = useTilt();
  const tilt1 = useTilt();
  const tilt2 = useTilt();
  const tilts = [tilt0, tilt1, tilt2];

  return (
    <section className="relative py-28 overflow-hidden">
      <style>{`
        /* ── Background ── */
        @keyframes feat-bgShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        /* ── Reveals ── */
        @keyframes feat-fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes feat-headerIn {
          from { opacity: 0; transform: translateY(20px) rotateX(35deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes feat-cardReveal {
          from { opacity: 0; transform: scale(0.88) translateY(30px); filter: blur(4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes feat-numberReveal {
          0% { opacity: 0; transform: translateY(16px) scale(0.8); filter: blur(6px); }
          60% { opacity: 1; transform: translateY(-4px) scale(1.05); filter: blur(0); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }

        /* ── Card effects ── */
        @keyframes feat-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes feat-holoShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes feat-shimmerSweep {
          0% { left: -100%; }
          100% { left: 200%; }
        }

        /* ── Unique card effects ── */
        @keyframes feat-shieldPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,58,232,0.3); }
          50% { box-shadow: 0 0 20px 8px rgba(91,58,232,0.08); }
        }
        @keyframes feat-ringExpand {
          0% { transform: scale(0.6); opacity: 0.6; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes feat-sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }

        /* ── Particles ── */
        @keyframes feat-particleUp {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          15% { opacity: var(--p-opacity); }
          85% { opacity: var(--p-opacity); }
          100% { transform: translateY(-200px) translateX(20px); opacity: 0; }
        }

        /* ── Secondary bounce ── */
        @keyframes feat-iconBounce {
          0% { opacity: 0; transform: translateY(20px) scale(0.7); }
          60% { transform: translateY(-6px) scale(1.1); }
          80% { transform: translateY(2px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        /* ── Card container ── */
        .feat-card {
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease;
          animation: feat-float 5s ease-in-out infinite;
          will-change: transform;
        }
        .feat-card:nth-child(2) { animation-delay: -1.7s; }
        .feat-card:nth-child(3) { animation-delay: -3.3s; }
        .feat-card:hover {
          animation-play-state: paused;
          box-shadow:
            0 24px 48px rgba(18,8,42,0.3),
            0 0 40px rgba(91,58,232,0.15),
            inset 0 1px 0 rgba(255,255,255,0.05);
        }

        /* ── Holographic border ── */
        .feat-holo-border {
          position: absolute;
          inset: -1px;
          border-radius: 1rem;
          padding: 1px;
          background: linear-gradient(135deg, #5B3AE8, #8B7AFF, #C4B5FD, #8B7AFF, #5B3AE8);
          background-size: 300% 300%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }
        .feat-card:hover .feat-holo-border {
          opacity: 1;
          animation: feat-holoShift 3s ease infinite;
        }
      `}</style>

      {/* ── Background texture ── */}
      <div className="absolute inset-0 bg-white" />
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle, #5B3AE8 0.8px, transparent 0.8px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(91,58,232,0.04) 0%, transparent 70%)',
        }}
      />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            bottom: '20%',
            background: p.id % 2 === 0 ? '#8B7AFF' : '#C4B5FD',
            '--p-opacity': p.opacity,
            animation: `feat-particleUp ${p.duration}s ease-in-out ${p.delay}s infinite`,
            filter: 'blur(0.5px)',
          } as React.CSSProperties}
        />
      ))}

      {/* ── Top/bottom fade transitions ── */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-white to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none z-10" />

      <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── Section header ── */}
        <div ref={header.ref} className="text-center mb-16" style={{ perspective: '600px' }}>
          <span
            className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#5B3AE8] mb-4"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            Why GEMSUKE
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-wider mb-4"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            なぜGEMSUKEが選ばれるのか
          </h2>
          <p
            className="text-[13px] text-[#7C6F99] max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'feat-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            安全性、スピード、品質。すべてにおいて妥協しない。
          </p>
        </div>

        {/* ── Primary feature cards ── */}
        <div ref={primaryGrid.ref} className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {primary.map((f, i) => {
            const tilt = tilts[i];
            return (
              <div
                key={i}
                ref={tilt.ref}
                onMouseMove={tilt.handleMove}
                onMouseLeave={tilt.handleLeave}
                className="feat-card group relative rounded-2xl p-8 overflow-hidden cursor-default"
                style={{
                  background: 'linear-gradient(150deg, #1A1A2E 0%, #0F0720 40%, #160B35 100%)',
                  opacity: primaryGrid.visible ? 1 : 0,
                  animation: primaryGrid.visible
                    ? `feat-cardReveal 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.15}s forwards`
                    : 'none',
                  animationFillMode: 'both',
                }}
              >
                {/* Holographic border on hover */}
                <div className="feat-holo-border" />

                {/* Inner nebula */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse 80% 70% at ${25 + i * 30}% 85%, rgba(91,58,232,0.12) 0%, transparent 65%)`,
                  }}
                />

                {/* ── Unique per-card effect ── */}
                {f.uniqueEffect === 'shield' && (
                  <div
                    className="absolute top-6 right-6 w-16 h-16 rounded-full pointer-events-none"
                    style={{ animation: 'feat-shieldPulse 3s ease-in-out infinite' }}
                  >
                    <i className="ri-shield-check-fill text-[32px] text-[#5B3AE8]/20 absolute inset-0 flex items-center justify-center"></i>
                  </div>
                )}
                {f.uniqueEffect === 'lock' && (
                  <div className="absolute top-8 right-8 pointer-events-none">
                    {[0, 1, 2].map((r) => (
                      <div
                        key={r}
                        className="absolute rounded-full border border-[#8B7AFF]/10"
                        style={{
                          width: `${30 + r * 20}px`,
                          height: `${30 + r * 20}px`,
                          top: `${-(r * 10)}px`,
                          left: `${-(r * 10)}px`,
                          animation: `feat-ringExpand ${2 + r * 0.5}s ease-out ${r * 0.8}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {f.uniqueEffect === 'stars' && (
                  <div className="absolute top-4 right-4 pointer-events-none">
                    {[0, 1, 2, 3].map((s) => (
                      <div
                        key={s}
                        className="absolute w-1.5 h-1.5 rounded-full bg-[#C4B5FD]"
                        style={{
                          top: `${s * 12}px`,
                          left: `${(s % 2) * 20 + 5}px`,
                          animation: `feat-sparkle ${1.5 + s * 0.4}s ease-in-out ${s * 0.6}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Shimmer sweep on hover */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ overflow: 'hidden' }}
                >
                  <div
                    className="absolute top-0 bottom-0 w-[60%]"
                    style={{
                      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)',
                      animation: 'feat-shimmerSweep 1.5s ease-in-out infinite',
                    }}
                  />
                </div>

                <div className="relative z-10">
                  {/* Big highlight */}
                  <div className="flex items-baseline gap-1 mb-4">
                    <p
                      className="text-[44px] font-black leading-none"
                      style={{
                        fontFamily: '"Orbitron", sans-serif',
                        background: 'linear-gradient(135deg, #fff 0%, #C4B5FD 40%, #8B7AFF 70%, #5B3AE8 100%)',
                        backgroundSize: '200% 200%',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        animation: primaryGrid.visible
                          ? `feat-numberReveal 0.8s cubic-bezier(0.22,1,0.36,1) ${0.4 + i * 0.2}s forwards, feat-holoShift 6s ease ${1.5 + i * 0.3}s infinite`
                          : 'none',
                        animationFillMode: 'both',
                        opacity: 0,
                      }}
                    >
                      <SlotNumber value={f.highlight} visible={primaryGrid.visible} delay={400 + i * 200} />
                    </p>
                    {f.highlightSuffix && (
                      <span
                        className="text-[20px] font-bold text-white/30"
                        style={{ fontFamily: '"Rajdhani", sans-serif' }}
                      >
                        {f.highlightSuffix}
                      </span>
                    )}
                  </div>

                  <h3
                    className="text-[15px] font-bold text-white mb-2 tracking-wide"
                    style={{ fontFamily: '"Rajdhani", sans-serif' }}
                  >
                    {f.title}
                  </h3>
                  <p className="text-[12px] text-[#9890B8] leading-relaxed font-medium">
                    {f.desc}
                  </p>
                </div>

                {/* Bottom accent */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-[1px] opacity-40"
                  style={{
                    background: 'linear-gradient(90deg, transparent 10%, #5B3AE8, transparent 90%)',
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* ── Secondary features with connecting line ── */}
        <div ref={secondaryGrid.ref} className="relative">
          {/* Connecting line */}
          <div
            className="absolute top-[24px] left-[16.67%] right-[16.67%] h-[1px] hidden md:block"
            style={{
              background: 'linear-gradient(90deg, transparent, #D4D0E8 20%, #D4D0E8 80%, transparent)',
              opacity: secondaryGrid.visible ? 1 : 0,
              transition: 'opacity 0.6s ease 0.3s',
            }}
          />

          <div className="grid grid-cols-3 gap-6">
            {secondary.map((f, i) => (
              <div
                key={i}
                className="flex flex-col items-center py-6"
                style={{
                  opacity: secondaryGrid.visible ? 1 : 0,
                  animation: secondaryGrid.visible
                    ? `feat-iconBounce 0.7s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s forwards`
                    : 'none',
                  animationFillMode: 'both',
                }}
              >
                <div className="w-12 h-12 rounded-full bg-[#F3F0FF] flex items-center justify-center mb-3 relative z-10">
                  <i className={`${f.icon} text-[22px] text-[#5B3AE8]`}></i>
                </div>
                <span
                  className="text-[13px] font-bold text-[#1A1A2E] tracking-wide mb-1"
                  style={{ fontFamily: '"Rajdhani", sans-serif' }}
                >
                  {f.title}
                </span>
                <span className="text-[10px] text-[#8A7DA8] font-medium">
                  {f.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
