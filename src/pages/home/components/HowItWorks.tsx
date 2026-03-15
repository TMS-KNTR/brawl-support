import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../../../contexts/AuthContext';

/* ── Scroll-reveal hook ── */
function useReveal(threshold = 0.25) {
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

/* ── Animated timeline line hook ── */
function useLineProgress() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const windowH = window.innerHeight;
    // Start drawing when top enters viewport, finish when bottom reaches center
    const start = rect.top - windowH * 0.7;
    const end = rect.bottom - windowH * 0.5;
    const range = end - start;
    if (range <= 0) return;
    const p = Math.min(1, Math.max(0, (0 - start) / range));
    setProgress(p);
  }, []);
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);
  return { containerRef, progress };
}

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: '依頼内容を入力',
      desc: 'ゲームタイトル・目標・希望条件を入力。自動で料金が計算されます。',
      icon: 'ri-edit-line',
    },
    {
      num: '02',
      title: '決済',
      desc: 'クレジットカードまたはPayPayで安全にお支払い。完了まで代金はエスクローで保全されます。',
      icon: 'ri-secure-payment-line',
    },
    {
      num: '03',
      title: '代行者が受注',
      desc: 'あなたの依頼をプロの代行者が確認し、受注します。',
      icon: 'ri-user-received-line',
    },
    {
      num: '04',
      title: 'チャットで引き継ぎ',
      desc: '匿名チャットでアカウント情報を安全に共有。個人情報は一切不要。',
      icon: 'ri-chat-private-line',
    },
    {
      num: '05',
      title: '代行実施',
      desc: 'プロが代行を開始。進捗はチャットでリアルタイムに報告されます。',
      icon: 'ri-gamepad-line',
    },
    {
      num: '06',
      title: '完了',
      desc: '目標達成を確認して完了。未達成の場合は全額返金いたします。',
      icon: 'ri-checkbox-circle-line',
    },
  ];

  const { user } = useAuth();
  const header = useReveal(0.3);
  const cta = useReveal(0.3);
  const { containerRef, progress } = useLineProgress();

  return (
    <section id="how-it-works" className="py-24 bg-white overflow-hidden relative">
      {/* Hexagon grid background */}
      <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }}>
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="hiw-hex" width="56" height="97" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
              <path
                d="M28 0 L56 16.5 L56 49.5 L28 66 L0 49.5 L0 16.5 Z"
                fill="none"
                stroke="rgba(91,58,232,0.1)"
                strokeWidth="0.8"
              />
              <path
                d="M28 31 L56 47.5 L56 80.5 L28 97 L0 80.5 L0 47.5 Z"
                fill="none"
                stroke="rgba(91,58,232,0.1)"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hiw-hex)" />
        </svg>
      </div>
      {/* Fade edges so hexagons don't end abruptly */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to bottom, white 0%, transparent 12%, transparent 88%, white 100%)',
      }} />
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'linear-gradient(to right, white 0%, transparent 8%, transparent 92%, white 100%)',
      }} />

      {/* Keyframe animations */}
      <style>{`
        @keyframes hiw-fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes hiw-fadeLeft {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes hiw-fadeRight {
          from { opacity: 0; transform: translateX(-40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes hiw-nodeIn {
          0%   { opacity: 0; transform: scale(0.3); }
          60%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes hiw-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,58,232,0.45); }
          50%      { box-shadow: 0 0 0 10px rgba(91,58,232,0); }
        }
        @keyframes hiw-ringExpand {
          0%   { opacity: 0.6; transform: scale(0.8); }
          100% { opacity: 0; transform: scale(2.2); }
        }
        @keyframes hiw-headerWord {
          from { opacity: 0; transform: translateY(16px) rotateX(40deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes hiw-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hiw-iconFloat {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-3px); }
        }
        .hiw-step-content {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), box-shadow 0.4s ease;
        }
        .hiw-step-content:hover {
          transform: translateY(-3px);
        }
        .hiw-step-content:hover .hiw-accent-bar {
          transform: scaleX(1);
          opacity: 1;
        }
        .hiw-accent-bar {
          transform: scaleX(0);
          opacity: 0;
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease;
        }
        .hiw-step-content:hover .hiw-step-icon {
          animation: hiw-iconFloat 1.2s ease-in-out infinite;
          color: #5B3AE8;
        }
        .hiw-cta-btn {
          position: relative;
          overflow: hidden;
        }
        .hiw-cta-btn::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(
            105deg,
            transparent 35%,
            rgba(255,255,255,0.15) 45%,
            rgba(255,255,255,0.25) 50%,
            rgba(255,255,255,0.15) 55%,
            transparent 65%
          );
          background-size: 200% 100%;
          background-position: -200% center;
          transition: none;
        }
        .hiw-cta-btn:hover::after {
          animation: hiw-shimmer 0.8s ease forwards;
        }
        .hiw-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(91,58,232,0.35);
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={header.ref}
          className="text-center mb-16"
          style={{ perspective: '600px' }}
        >
          <span
            className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#5B3AE8] mb-4"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'hiw-headerWord 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            }}
          >
            How It Works
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-wider mb-4"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'hiw-headerWord 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            ご利用の流れ
          </h2>
          <p
            className="text-[13px] text-[#6B7280] max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'hiw-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            初めての方でも安心。わずか数分で依頼完了。
          </p>
        </div>

        {/* Timeline */}
        <div className="relative" ref={containerRef}>
          {/* Vertical center line - desktop: animated draw */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2" style={{ width: '2px' }}>
            {/* Track (faint) */}
            <div className="absolute inset-0 bg-[#5B3AE8]/[0.07] rounded-full" />
            {/* Drawn line (animated) */}
            <div
              className="absolute top-0 left-0 right-0 rounded-full"
              style={{
                height: `${progress * 100}%`,
                background: 'linear-gradient(to bottom, #5B3AE8, #8B7AFF)',
                transition: 'height 0.1s linear',
                boxShadow: '0 0 8px rgba(91,58,232,0.3)',
              }}
            />
          </div>

          {/* Mobile left line - animated draw */}
          <div className="md:hidden absolute left-[19px] top-0 bottom-0" style={{ width: '2px' }}>
            <div className="absolute inset-0 bg-[#5B3AE8]/[0.07] rounded-full" />
            <div
              className="absolute top-0 left-0 right-0 rounded-full"
              style={{
                height: `${progress * 100}%`,
                background: 'linear-gradient(to bottom, #5B3AE8, #8B7AFF)',
                transition: 'height 0.1s linear',
                boxShadow: '0 0 6px rgba(91,58,232,0.25)',
              }}
            />
          </div>

          <div className="space-y-8 md:space-y-12">
            {steps.map((step, i) => {
              const isLeft = i % 2 === 0;
              return (
                <StepRow key={i} step={step} index={i} isLeft={isLeft} />
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div
          ref={cta.ref}
          className="text-center mt-16"
          style={{
            opacity: cta.visible ? 1 : 0,
            animation: cta.visible ? 'hiw-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          <button
            onClick={() => window.REACT_APP_NAVIGATE(user ? '/order/new' : '/register')}
            className="hiw-cta-btn inline-flex items-center gap-2.5 px-8 py-3.5 bg-[#5B3AE8] hover:bg-[#4F2FD8] text-white text-[12px] font-bold tracking-[0.1em] uppercase rounded-lg transition-all duration-300 cursor-pointer"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            今すぐ無料登録
            <i className="ri-arrow-right-line text-sm"></i>
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── Individual step row (isolated observer per step) ── */
function StepRow({ step, index, isLeft }: {
  step: { num: string; title: string; desc: string; icon: string };
  index: number;
  isLeft: boolean;
}) {
  const { ref, visible } = useReveal(0.2);
  const delay = 0.08 * index;

  // Determine slide direction for desktop
  const desktopAnim = isLeft ? 'hiw-fadeRight' : 'hiw-fadeLeft';

  return (
    <div ref={ref} className="relative group">
      {/* ===== Desktop: alternating layout ===== */}
      <div className="hidden md:grid md:grid-cols-[1fr_40px_1fr] md:items-center md:gap-6">
        {/* Left content or spacer */}
        {isLeft ? (
          <div
            className="hiw-step-content text-right pr-4 relative rounded-xl p-4 -mr-2"
            style={{
              opacity: visible ? 1 : 0,
              animation: visible ? `${desktopAnim} 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards` : 'none',
              animationFillMode: 'both',
            }}
          >
            {/* Hover accent bar (right side for left content) */}
            <div className="hiw-accent-bar absolute right-0 top-[15%] bottom-[15%] w-[2px] bg-gradient-to-b from-[#5B3AE8] to-[#8B7AFF] rounded-full origin-top" />
            <div className="inline-flex items-center gap-2 mb-2 justify-end">
              <span
                className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#5B3AE8]/40"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                Step {step.num}
              </span>
              <i className={`${step.icon} hiw-step-icon text-sm text-[#5B3AE8]/60 transition-colors duration-300`}></i>
            </div>
            <h3
              className="text-[16px] font-bold text-[#1A1A2E] tracking-wide mb-1"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}
            >
              {step.title}
            </h3>
            <p className="text-[12px] text-[#6B7280] leading-relaxed font-medium">{step.desc}</p>
          </div>
        ) : (
          <div />
        )}

        {/* Center node */}
        <div className="flex justify-center">
          <div className="relative">
            {/* Expanding ring on reveal */}
            {visible && (
              <div
                className="absolute inset-0 rounded-full border-2 border-[#5B3AE8]"
                style={{
                  animation: `hiw-ringExpand 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
                  animationFillMode: 'both',
                }}
              />
            )}
            <div
              className="w-10 h-10 rounded-full bg-[#5B3AE8] flex items-center justify-center z-10 relative"
              style={{
                opacity: visible ? 1 : 0,
                animation: visible
                  ? `hiw-nodeIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards, hiw-pulse 2.5s ease-in-out ${delay + 0.6}s infinite`
                  : 'none',
                animationFillMode: 'both',
              }}
            >
              <span
                className="text-[10px] font-bold text-white"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                {step.num}
              </span>
            </div>
          </div>
        </div>

        {/* Right content or spacer */}
        {!isLeft ? (
          <div
            className="hiw-step-content pl-4 relative rounded-xl p-4 -ml-2"
            style={{
              opacity: visible ? 1 : 0,
              animation: visible ? `${desktopAnim} 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards` : 'none',
              animationFillMode: 'both',
            }}
          >
            {/* Hover accent bar (left side for right content) */}
            <div className="hiw-accent-bar absolute left-0 top-[15%] bottom-[15%] w-[2px] bg-gradient-to-b from-[#5B3AE8] to-[#8B7AFF] rounded-full origin-top" />
            <div className="inline-flex items-center gap-2 mb-2">
              <i className={`${step.icon} hiw-step-icon text-sm text-[#5B3AE8]/60 transition-colors duration-300`}></i>
              <span
                className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#5B3AE8]/40"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                Step {step.num}
              </span>
            </div>
            <h3
              className="text-[16px] font-bold text-[#1A1A2E] tracking-wide mb-1"
              style={{ fontFamily: '"Rajdhani", sans-serif' }}
            >
              {step.title}
            </h3>
            <p className="text-[12px] text-[#6B7280] leading-relaxed font-medium">{step.desc}</p>
          </div>
        ) : (
          <div />
        )}
      </div>

      {/* ===== Mobile: left-aligned timeline ===== */}
      <div className="md:hidden flex items-start gap-5">
        {/* Node */}
        <div className="relative flex-shrink-0">
          {visible && (
            <div
              className="absolute inset-0 rounded-full border-2 border-[#5B3AE8]"
              style={{
                animation: `hiw-ringExpand 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`,
                animationFillMode: 'both',
              }}
            />
          )}
          <div
            className="w-10 h-10 rounded-full bg-[#5B3AE8] flex items-center justify-center z-10 relative"
            style={{
              opacity: visible ? 1 : 0,
              animation: visible
                ? `hiw-nodeIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards, hiw-pulse 2.5s ease-in-out ${delay + 0.6}s infinite`
                : 'none',
              animationFillMode: 'both',
            }}
          >
            <span
              className="text-[10px] font-bold text-white"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              {step.num}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="pt-1.5"
          style={{
            opacity: visible ? 1 : 0,
            animation: visible ? `hiw-fadeLeft 0.65s cubic-bezier(0.22,1,0.36,1) ${delay + 0.1}s forwards` : 'none',
            animationFillMode: 'both',
          }}
        >
          <div className="inline-flex items-center gap-2 mb-1.5">
            <i className={`${step.icon} text-sm text-[#5B3AE8]/60`}></i>
            <span
              className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#5B3AE8]/40"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              Step {step.num}
            </span>
          </div>
          <h3
            className="text-[15px] font-bold text-[#1A1A2E] tracking-wide mb-1"
            style={{ fontFamily: '"Rajdhani", sans-serif' }}
          >
            {step.title}
          </h3>
          <p className="text-[12px] text-[#6B7280] leading-relaxed font-medium">{step.desc}</p>
        </div>
      </div>
    </div>
  );
}
