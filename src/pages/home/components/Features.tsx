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

/* ── Mobile scroll 3D effect ── */
function MobileScroll3D({ containerRef }: { containerRef: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let listening = false;
    let prevCenter = -1;
    const update = () => {
      const cards = el.querySelectorAll<HTMLElement>('.fc-card');
      if (!cards.length) return;

      const scrollLeft = el.scrollLeft;
      const viewCenter = scrollLeft + el.clientWidth / 2;
      let closestIdx = 0;
      let closestDist = Infinity;

      cards.forEach((card, idx) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const dist = (cardCenter - viewCenter) / card.offsetWidth;
        const clamped = Math.max(-1, Math.min(1, dist));
        const absD = Math.abs(clamped);

        card.style.transform = `perspective(800px) rotateY(${clamped * -10}deg) scale(${1 - absD * 0.1})`;
        card.style.opacity = `${1 - absD * 0.45}`;
        card.style.filter = `blur(${absD * 2.5}px)`;

        if (Math.abs(dist) < closestDist) {
          closestDist = Math.abs(dist);
          closestIdx = idx;
        }
      });

      if (closestIdx !== prevCenter && prevCenter !== -1) {
        const card = cards[closestIdx];

        // Border flash
        card.style.borderColor = `rgba(var(--c-rgb),0.45)`;
        card.style.boxShadow = `0 0 24px rgba(var(--c-rgb),0.15), 0 12px 40px rgba(0,0,0,0.06)`;
        setTimeout(() => {
          card.style.borderColor = '';
          card.style.boxShadow = '';
        }, 450);
      }

      prevCenter = closestIdx;
    };

    let rafId = 0;
    let lastScroll = -1;
    let settleCount = 0;

    const pollUntilSettled = () => {
      update();
      if (el.scrollLeft === lastScroll) {
        settleCount++;
        if (settleCount >= 5) return;
      } else {
        settleCount = 0;
      }
      lastScroll = el.scrollLeft;
      rafId = requestAnimationFrame(pollUntilSettled);
    };
    const onTouchEnd = () => {
      settleCount = 0;
      lastScroll = -1;
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(pollUntilSettled);
    };

    const activate = () => {
      if (listening) return;
      if (el.scrollWidth <= el.clientWidth + 10) return;
      listening = true;

      // Set JS transforms BEFORE killing animation to avoid 1-frame jump
      update();
      el.classList.add('fc-3d-active');
      el.addEventListener('scroll', update, { passive: true });
      el.addEventListener('touchend', onTouchEnd, { passive: true });
    };

    // Wait for last card's entrance animation to finish, then take over
    const onAnimEnd = (e: AnimationEvent) => {
      if (e.animationName === 'fc-cardIn') {
        el.removeEventListener('animationend', onAnimEnd);
        activate();
      }
    };
    el.addEventListener('animationend', onAnimEnd);

    // Fallback: if section was already visible (no animation fires), retry periodically
    let attempts = 0;
    const maxAttempts = 30;
    const timer = setInterval(() => {
      attempts++;
      // Only activate if no entrance animation is running on any card
      const cards = el.querySelectorAll<HTMLElement>('.fc-card');
      const hasRunningAnim = Array.from(cards).some(
        (c) => c.getAnimations().some((a) => a instanceof CSSAnimation && a.animationName === 'fc-cardIn')
      );
      if (!hasRunningAnim) activate();
      if (listening || attempts >= maxAttempts) clearInterval(timer);
    }, 300);

    return () => {
      clearInterval(timer);
      el.removeEventListener('animationend', onAnimEnd);
      el.removeEventListener('scroll', update);
      el.removeEventListener('touchend', onTouchEnd);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
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
    { num: '01', tag: 'PAYMENT', title: '選べる決済方法', desc: 'クレジットカード・コンビニ決済・銀行振込に対応。完了まで代金を安全に保管。', color: '#10B981', colorRgb: '16,185,129', image: '/feature-payment.png', imgFilter: 'hue-rotate(70deg) saturate(1.0) brightness(0.96)' },
    { num: '02', tag: 'SECURITY', title: '完全匿名チャット', desc: '情報漏洩ゼロ。個人情報を公開せずにやり取り可能。暗号化された専用チャットで安全に連携。', color: '#3B82F6', colorRgb: '59,130,246', image: '/feature-security.png', imgFilter: 'hue-rotate(130deg) saturate(1.3)' },
    { num: '03', tag: 'QUALITY', title: 'プロの技術', desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。', color: '#F59E0B', colorRgb: '245,158,11', image: '/feature-quality.png', imgFilter: 'none' },
  ];

  const secondary = [
    { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
    { icon: 'ri-refund-line', title: '30日間返金保証', desc: '未達成なら全額返金' },
    { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
  ];

  const header = useReveal(0.3);
  const grid = useReveal(0.08);
  const sub = useReveal(0.15);
  const scrollContainerRef = useRef<HTMLDivElement>(null);


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

        /* ══ SCROLLBAR ══ */
        .scrollbar-hide::-webkit-scrollbar { display: none; }

        /* ══ MOBILE SCROLL 3D ══ */
        @media (max-width: 767px) {
          .fc-card {
            transition: transform 0.15s ease-out,
                        opacity 0.15s ease-out,
                        filter 0.15s ease-out,
                        box-shadow 0.7s cubic-bezier(0.22,1,0.36,1),
                        border-color 0.5s ease,
                        background 0.5s ease;
            will-change: transform, opacity, filter;
          }
          /* Once JS 3D takes over, kill entrance animation and transition so JS has full control */
          .fc-3d-active .fc-card {
            animation: none !important;
            transition: box-shadow 0.7s cubic-bezier(0.22,1,0.36,1),
                        border-color 0.5s ease,
                        background 0.5s ease !important;
          }
        }

        /* ══ CARD ANIMATIONS ══ */
        @keyframes fc-cardIn {
          0% { opacity: 0; transform: translateY(48px) scale(0.94); filter: blur(8px); }
          60% { opacity: 1; filter: blur(0); }
          80% { transform: translateY(-5px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes fc-numIn {
          from { opacity: 0; transform: translateY(16px) scale(1.2); filter: blur(8px); }
          to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes fc-imgIn {
          0% { opacity: 0; transform: scale(0.6) translateX(-20px); }
          60% { opacity: 1; }
          80% { transform: scale(1.04) translateX(2px); }
          100% { opacity: 1; transform: scale(1) translateX(0); }
        }
        @keyframes fc-imgBob {
          0%,100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-8px) rotate(1deg); }
          70% { transform: translateY(3px) rotate(-0.5deg); }
        }
        @keyframes fc-contentUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fc-lineGrow {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }

        /* ══ GLASS CARD ══ */
        .fc-card {
          position: relative;
          border-radius: 24px;
          overflow: visible;
          background: rgba(255,255,255,0.65);
          backdrop-filter: blur(32px) saturate(1.6);
          -webkit-backdrop-filter: blur(32px) saturate(1.6);
          border: 1.5px solid rgba(255,255,255,0.7);
          box-shadow:
            0 12px 40px rgba(0,0,0,0.06),
            0 4px 12px rgba(0,0,0,0.03),
            inset 0 1px 0 rgba(255,255,255,0.9),
            inset 0 -1px 0 rgba(255,255,255,0.3);
          transition: transform 0.7s cubic-bezier(0.22,1,0.36,1),
                      box-shadow 0.7s cubic-bezier(0.22,1,0.36,1),
                      border-color 0.5s ease,
                      background 0.5s ease;
        }
        .fc-card:hover {
          transform: translateY(-14px) scale(1.015);
          background: rgba(255,255,255,0.72);
          border-color: rgba(var(--c-rgb),0.3);
          box-shadow:
            0 36px 72px rgba(var(--c-rgb),0.14),
            0 0 48px rgba(var(--c-rgb),0.08),
            0 16px 32px rgba(0,0,0,0.07),
            inset 0 1px 0 rgba(255,255,255,0.95),
            inset 0 -1px 0 rgba(255,255,255,0.4);
        }
        .fc-card:hover .fc-img {
          transform: scale(1.1) rotate(3deg);
          filter: var(--img-filter) drop-shadow(0 14px 36px rgba(var(--c-rgb),0.35));
        }
        .fc-card .fc-img {
          transition: transform 0.7s cubic-bezier(0.22,1,0.36,1),
                      filter 0.7s ease;
        }
        .fc-card:hover .fc-num {
          opacity: 1 !important;
          color: rgba(var(--c-rgb),0.14);
        }
        .fc-card .fc-num {
          transition: all 0.5s ease;
        }
        .fc-card:hover .fc-bar {
          width: 44px;
          box-shadow: 0 0 8px rgba(var(--c-rgb),0.3);
        }
        .fc-card .fc-bar {
          transition: all 0.5s cubic-bezier(0.22,1,0.36,1);
        }
        .fc-card:hover .fc-glow {
          opacity: 0.15;
        }
        .fc-card .fc-glow {
          transition: opacity 0.6s ease;
        }
        .fc-card:hover .fc-bottom-line {
          opacity: 0.6;
        }
        .fc-card .fc-bottom-line {
          transition: opacity 0.5s ease;
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
      <div className="absolute inset-0 bg-[#EEEDF5]" />

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
        <div ref={(el) => { (grid.ref as React.MutableRefObject<HTMLDivElement | null>).current = el; scrollContainerRef.current = el; }} className="flex md:grid md:grid-cols-3 gap-7 mb-16 items-stretch overflow-x-auto md:overflow-visible snap-x snap-mandatory py-8 -my-8 pb-12 md:py-0 md:my-0 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {features.map((f, i) => (
            <div
              key={i}
              className="fc-card cursor-default min-w-[85vw] md:min-w-0 snap-center"
              style={{
                '--c': f.color,
                '--c-rgb': f.colorRgb,
                '--img-filter': f.imgFilter,
                opacity: grid.visible ? 1 : 0,
                animation: grid.visible
                  ? `fc-cardIn 1s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.2}s both`
                  : 'none',
              } as React.CSSProperties}
            >
              {/* Corner glow */}
              <div
                className="fc-glow absolute -top-12 -left-12 w-40 h-40 rounded-full pointer-events-none z-[0]"
                style={{
                  background: `radial-gradient(circle, rgba(${f.colorRgb},0.2), transparent 65%)`,
                  opacity: 0.06,
                }}
              />

              {/* Ghost number — top left */}
              <div
                className="fc-num absolute top-4 left-7 select-none pointer-events-none z-[0]"
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontSize: 'clamp(72px,10vw,96px)',
                  fontWeight: 900,
                  lineHeight: 0.85,
                  color: `rgba(${f.colorRgb},0.06)`,
                  opacity: grid.visible ? 1 : 0,
                  animation: grid.visible
                    ? `fc-numIn 0.8s cubic-bezier(0.22,1,0.36,1) ${0.12 + i * 0.2}s both`
                    : 'none',
                }}
              >
                {f.num}
              </div>

              {/* Two-column layout: image left, content right on md+ */}
              <div className="relative z-[1] flex flex-col items-center md:flex-row md:items-start gap-2 p-8 md:p-10">

                {/* Image — left, large */}
                <div
                  className="fc-img-wrap flex-shrink-0"
                  style={{
                    width: 150, height: 150,
                    opacity: grid.visible ? 1 : 0,
                    animation: grid.visible
                      ? `fc-imgIn 0.9s cubic-bezier(0.22,1,0.36,1) ${0.2 + i * 0.2}s both`
                      : 'none',
                  }}
                >
                  <div style={{ animation: `fc-imgBob 7s ease-in-out infinite`, animationDelay: `${-i * 2.3}s` }}>
                    <img
                      src={f.image}
                      alt={f.title}
                      className="fc-img w-full h-full object-contain"
                      style={{
                        filter: `${f.imgFilter} drop-shadow(0 8px 28px rgba(${f.colorRgb},0.25))`,
                      }}
                    />
                  </div>
                </div>

                {/* Content — right */}
                <div className="flex-1 min-w-0 text-center md:text-left md:pt-2">
                  {/* Tag */}
                  <div
                    className="flex items-center justify-center md:justify-start gap-2.5 mb-4"
                    style={{
                      opacity: grid.visible ? 1 : 0,
                      animation: grid.visible
                        ? `fc-contentUp 0.5s cubic-bezier(0.22,1,0.36,1) ${0.35 + i * 0.2}s both`
                        : 'none',
                    }}
                  >
                    <div
                      className="fc-bar h-[2px] w-5 rounded-full origin-left"
                      style={{ background: f.color }}
                    />
                    <span
                      className="text-[8px] font-bold tracking-[0.25em] uppercase"
                      style={{ fontFamily: '"Orbitron", sans-serif', color: f.color }}
                    >
                      {f.tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h3
                    className="text-[24px] font-extrabold leading-[1.15] mb-3 tracking-wide text-[#0F0E1A]"
                    style={{
                      fontFamily: '"Rajdhani", sans-serif',
                      opacity: grid.visible ? 1 : 0,
                      animation: grid.visible
                        ? `fc-contentUp 0.6s cubic-bezier(0.22,1,0.36,1) ${0.42 + i * 0.2}s both`
                        : 'none',
                    }}
                  >
                    {f.title}
                  </h3>

                  {/* Description */}
                  <p
                    className="text-[12.5px] leading-[2] font-semibold text-[#4B5563]"
                    style={{
                      opacity: grid.visible ? 1 : 0,
                      animation: grid.visible
                        ? `fc-contentUp 0.6s cubic-bezier(0.22,1,0.36,1) ${0.5 + i * 0.2}s both`
                        : 'none',
                    }}
                  >
                    {f.desc}
                  </p>

                  {/* Bottom accent */}
                  <div
                    className="fc-bottom-line mt-5 h-[1.5px] origin-left md:origin-left mx-auto md:mx-0"
                    style={{
                      width: '60%',
                      background: `linear-gradient(90deg, rgba(${f.colorRgb},0.3), transparent)`,
                      opacity: grid.visible ? 0.35 : 0,
                      animation: grid.visible
                        ? `fc-lineGrow 0.7s cubic-bezier(0.22,1,0.36,1) ${0.6 + i * 0.2}s both`
                        : 'none',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <MobileScroll3D containerRef={scrollContainerRef} />

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
                  style={{ background: 'linear-gradient(135deg, #fff, #F0EDFF)', boxShadow: '0 2px 8px rgba(91,58,232,0.08)' }}
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
