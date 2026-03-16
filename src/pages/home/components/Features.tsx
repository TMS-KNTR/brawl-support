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

const SLIDES = [
  {
    icon: 'ri-shield-check-line',
    highlight: 'PayPay',
    highlightSub: '対応',
    title: 'PayPay対応の安全決済',
    desc: 'カード不要。PayPayでかんたん決済。エスクロー方式で代行完了まで代金を安全に保全。',
    accent: '#5B3AE8',
    glowPos: '25% 70%',
  },
  {
    icon: 'ri-chat-private-line',
    highlight: '0',
    highlightSub: '件',
    title: '完全匿名チャット',
    desc: '情報漏洩ゼロ。個人情報を一切公開せずにやり取り可能。引き継ぎも専用チャットで安全に。',
    accent: '#6D5AED',
    glowPos: '50% 60%',
  },
  {
    icon: 'ri-star-line',
    highlight: '99',
    highlightSub: '%',
    title: 'プロの技術',
    desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。',
    accent: '#7B6AF0',
    glowPos: '75% 65%',
  },
];

const SECONDARY = [
  { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
  { icon: 'ri-refund-line', title: '全額返金保証', desc: '未達成なら返金' },
  { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
];

export default function Features() {
  const [active, setActive] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const header = useReveal(0.3);
  const carousel = useReveal(0.1);
  const secondaryGrid = useReveal(0.15);

  /* ── scroll-snap observer ── */
  const updateActiveFromScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const scrollLeft = track.scrollLeft;
    const cardWidth = track.offsetWidth;
    const idx = Math.round(scrollLeft / cardWidth);
    setActive(Math.max(0, Math.min(idx, SLIDES.length - 1)));
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', updateActiveFromScroll, { passive: true });
    return () => track.removeEventListener('scroll', updateActiveFromScroll);
  }, [updateActiveFromScroll]);

  const scrollTo = (idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: idx * track.offsetWidth, behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <style>{`
        @keyframes feat-fadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes feat-headerIn {
          from { opacity: 0; transform: translateY(20px) rotateX(35deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes feat-numberReveal {
          from { opacity: 0; transform: scale(0.6) translateY(20px); filter: blur(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        @keyframes feat-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes feat-pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.6; }
        }
        .feat-carousel-track {
          display: flex;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .feat-carousel-track::-webkit-scrollbar { display: none; }
        .feat-carousel-slide {
          flex: 0 0 100%;
          scroll-snap-align: center;
        }
        .feat-dot {
          transition: all 0.4s cubic-bezier(0.22,1,0.36,1);
        }
        .feat-dot-active {
          width: 28px;
          background: #5B3AE8;
        }
        .feat-secondary-card {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease, border-color 0.3s ease;
        }
        .feat-secondary-card:hover {
          transform: translateY(-4px);
          border-color: rgba(91,58,232,0.3);
          box-shadow: 0 12px 28px rgba(91,58,232,0.08);
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── Section header ── */}
        <div ref={header.ref} className="text-center mb-12" style={{ perspective: '600px' }}>
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

        {/* ── Carousel ── */}
        <div
          ref={carousel.ref}
          style={{
            opacity: carousel.visible ? 1 : 0,
            animation: carousel.visible ? 'feat-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          <div ref={trackRef} className="feat-carousel-track -mx-6 lg:-mx-8 mb-6">
            {SLIDES.map((slide, i) => (
              <div key={i} className="feat-carousel-slide px-6 lg:px-8">
                <div
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(145deg, #1A1A2E 0%, #0D0618 50%, #150A30 100%)',
                    minHeight: '280px',
                  }}
                >
                  {/* Ambient glow */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: `radial-gradient(ellipse 60% 50% at ${slide.glowPos}, ${slide.accent}25 0%, transparent 70%)`,
                      animation: 'feat-pulse 4s ease-in-out infinite',
                    }}
                  />

                  {/* Orbiting ring */}
                  <div
                    className="absolute pointer-events-none"
                    style={{
                      width: '300px',
                      height: '300px',
                      right: '-60px',
                      top: '-40px',
                      border: `1px solid ${slide.accent}15`,
                      borderRadius: '50%',
                      animation: 'feat-orbit 30s linear infinite',
                    }}
                  >
                    <div
                      className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                      style={{ background: slide.accent, boxShadow: `0 0 8px ${slide.accent}80` }}
                    />
                  </div>

                  {/* Content */}
                  <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-10">
                    {/* Left: big number */}
                    <div className="shrink-0">
                      <div className="flex items-baseline gap-1">
                        <span
                          className="text-[72px] sm:text-[88px] font-black leading-none"
                          style={{
                            fontFamily: '"Orbitron", sans-serif',
                            background: `linear-gradient(135deg, #fff 0%, ${slide.accent} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            animation: active === i ? 'feat-numberReveal 0.6s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
                          }}
                        >
                          {slide.highlight}
                        </span>
                        <span
                          className="text-[24px] sm:text-[28px] font-bold text-white/50"
                          style={{ fontFamily: '"Rajdhani", sans-serif' }}
                        >
                          {slide.highlightSub}
                        </span>
                      </div>
                    </div>

                    {/* Right: info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${slide.accent}20` }}
                        >
                          <i className={`${slide.icon} text-lg`} style={{ color: `${slide.accent}CC` }}></i>
                        </div>
                        <h3
                          className="text-[17px] sm:text-[19px] font-bold text-white tracking-wide"
                          style={{ fontFamily: '"Rajdhani", sans-serif' }}
                        >
                          {slide.title}
                        </h3>
                      </div>
                      <p
                        className="text-[13px] text-[#9890B8] leading-relaxed font-medium max-w-md"
                        style={{ fontFamily: '"Rajdhani", sans-serif' }}
                      >
                        {slide.desc}
                      </p>
                    </div>
                  </div>

                  {/* Bottom edge line */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{
                      background: `linear-gradient(90deg, transparent, ${slide.accent}60, transparent)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                className={`feat-dot h-[6px] rounded-full cursor-pointer ${
                  active === i ? 'feat-dot-active' : 'w-[6px] bg-[#D4D0E0]'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* ── Secondary features ── */}
        <div ref={secondaryGrid.ref} className="grid grid-cols-3 gap-3 mt-8">
          {SECONDARY.map((f, i) => (
            <div
              key={i}
              className="feat-secondary-card group rounded-xl border border-[#E8E4F3] p-5 text-center"
              style={{
                opacity: secondaryGrid.visible ? 1 : 0,
                animation: secondaryGrid.visible
                  ? `feat-fadeUp 0.55s cubic-bezier(0.22,1,0.36,1) ${0.05 + i * 0.08}s forwards`
                  : 'none',
                animationFillMode: 'both',
              }}
            >
              <div className="w-10 h-10 rounded-lg bg-[#F3F0FF] flex items-center justify-center mx-auto mb-3 transition-all duration-300 group-hover:bg-[#EDE9FE] group-hover:scale-110">
                <i className={`${f.icon} text-sm text-[#5B3AE8] transition-all duration-300`}></i>
              </div>
              <h3
                className="text-[12px] font-bold text-[#1A1A2E] tracking-wide mb-1"
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              >
                {f.title}
              </h3>
              <p className="text-[10px] text-[#8A7DA8] font-medium">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
