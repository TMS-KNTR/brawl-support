import { useEffect, useRef, useState } from 'react';

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

const TABS = [
  {
    key: 'payment',
    label: '決済',
    icon: 'ri-shield-check-line',
    highlight: 'PayPay',
    highlightSub: '対応',
    title: 'PayPay対応の安全決済',
    desc: 'クレジットカード不要。PayPayアプリからワンタップで決済完了。エスクロー方式を採用し、代行が完了するまで代金を安全に保全します。万が一のトラブルにも全額返金保証で安心。',
    details: [
      { icon: 'ri-bank-card-line', text: 'クレジットカード対応' },
      { icon: 'ri-refund-line', text: '全額返金保証' },
      { icon: 'ri-lock-2-line', text: 'Stripe社のセキュリティ基盤' },
    ],
    accent: '#5B3AE8',
  },
  {
    key: 'chat',
    label: 'チャット',
    icon: 'ri-chat-private-line',
    highlight: '0',
    highlightSub: '件',
    title: '完全匿名チャット',
    desc: '情報漏洩ゼロの実績。個人情報を一切公開せずに代行者とやり取りできます。アカウント引き継ぎも専用の暗号化チャットで安全に実施。NGワード自動検知で個人情報の流出を防止します。',
    details: [
      { icon: 'ri-eye-off-line', text: '個人情報の非公開' },
      { icon: 'ri-spam-2-line', text: 'NGワード自動検知' },
      { icon: 'ri-shield-keyhole-line', text: '暗号化通信' },
    ],
    accent: '#6D5AED',
  },
  {
    key: 'skill',
    label: '技術',
    icon: 'ri-star-line',
    highlight: '99',
    highlightSub: '%',
    title: 'プロの技術',
    desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。豊富な実績と高い評価を持つプロが、あなたの目標を確実に達成します。24時間体制で迅速に対応。',
    details: [
      { icon: 'ri-user-star-line', text: '厳選されたプロプレイヤー' },
      { icon: 'ri-time-line', text: '24時間対応' },
      { icon: 'ri-trophy-line', text: '高い成功率を維持' },
    ],
    accent: '#7B6AF0',
  },
];

export default function Features() {
  const [activeTab, setActiveTab] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const header = useReveal(0.3);
  const content = useReveal(0.1);

  const switchTab = (idx: number) => {
    if (idx === activeTab || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setActiveTab(idx);
      setTimeout(() => setTransitioning(false), 50);
    }, 200);
  };

  const tab = TABS[activeTab];

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
        @keyframes feat-contentIn {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes feat-numberPop {
          from { opacity: 0; transform: scale(0.5); filter: blur(6px); }
          to   { opacity: 1; transform: scale(1); filter: blur(0); }
        }
        @keyframes feat-detailIn {
          from { opacity: 0; transform: translateX(-12px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes feat-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes feat-pulse {
          0%, 100% { opacity: 0.25; }
          50% { opacity: 0.5; }
        }
        .feat-tab-btn {
          position: relative;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .feat-tab-btn::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 2px;
          background: #5B3AE8;
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
          transform: translateX(-50%);
        }
        .feat-tab-active {
          color: #5B3AE8;
        }
        .feat-tab-active::after {
          width: 100%;
        }
        .feat-content-enter {
          animation: feat-contentIn 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .feat-content-exit {
          opacity: 0;
          transform: translateY(8px);
          transition: all 0.2s ease;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">

        {/* ── Section header ── */}
        <div ref={header.ref} className="text-center mb-10" style={{ perspective: '600px' }}>
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

        {/* ── Tab buttons ── */}
        <div
          ref={content.ref}
          style={{
            opacity: content.visible ? 1 : 0,
            animation: content.visible ? 'feat-fadeUp 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          <div className="flex justify-center gap-1 mb-8">
            {TABS.map((t, i) => (
              <button
                key={t.key}
                onClick={() => switchTab(i)}
                className={`feat-tab-btn flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-bold cursor-pointer ${
                  activeTab === i
                    ? 'feat-tab-active bg-[#F3F0FF]'
                    : 'text-[#8A7DA8] hover:text-[#5B3AE8] hover:bg-[#F9F8FF]'
                }`}
                style={{ fontFamily: '"Rajdhani", sans-serif' }}
              >
                <i className={`${t.icon} text-[15px]`}></i>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Content panel ── */}
          <div
            className={`relative rounded-2xl overflow-hidden ${transitioning ? 'feat-content-exit' : 'feat-content-enter'}`}
            style={{
              background: 'linear-gradient(145deg, #1A1A2E 0%, #0D0618 50%, #150A30 100%)',
              minHeight: '320px',
            }}
            key={activeTab}
          >
            {/* Ambient glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 50% 60% at 30% 70%, ${tab.accent}20 0%, transparent 70%)`,
                animation: 'feat-pulse 4s ease-in-out infinite',
              }}
            />

            {/* Orbiting ring */}
            <div
              className="absolute pointer-events-none"
              style={{
                width: '400px',
                height: '400px',
                right: '-100px',
                top: '-80px',
                border: `1px solid ${tab.accent}12`,
                borderRadius: '50%',
                animation: 'feat-orbit 35s linear infinite',
              }}
            >
              <div
                className="absolute top-0 left-1/2 w-1.5 h-1.5 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{ background: tab.accent, boxShadow: `0 0 10px ${tab.accent}80` }}
              />
            </div>

            {/* Content layout */}
            <div className="relative z-10 p-8 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-start gap-8 lg:gap-14">
              {/* Left: big number */}
              <div className="shrink-0 flex flex-col items-start">
                <div className="flex items-baseline gap-1 mb-2">
                  <span
                    className="text-[80px] sm:text-[100px] lg:text-[120px] font-black leading-none"
                    style={{
                      fontFamily: '"Orbitron", sans-serif',
                      background: `linear-gradient(135deg, #fff 0%, ${tab.accent} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'feat-numberPop 0.5s cubic-bezier(0.22,1,0.36,1) forwards',
                    }}
                  >
                    {tab.highlight}
                  </span>
                  <span
                    className="text-[28px] sm:text-[36px] font-bold text-white/40"
                    style={{ fontFamily: '"Rajdhani", sans-serif' }}
                  >
                    {tab.highlightSub}
                  </span>
                </div>
                <div
                  className="h-[2px] w-16 rounded-full"
                  style={{ background: `linear-gradient(90deg, ${tab.accent}, transparent)` }}
                />
              </div>

              {/* Right: info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${tab.accent}20` }}
                  >
                    <i className={`${tab.icon} text-lg`} style={{ color: `${tab.accent}CC` }}></i>
                  </div>
                  <h3
                    className="text-[19px] sm:text-[22px] font-bold text-white tracking-wide"
                    style={{ fontFamily: '"Rajdhani", sans-serif' }}
                  >
                    {tab.title}
                  </h3>
                </div>

                <p
                  className="text-[13px] sm:text-[14px] text-[#9890B8] leading-[1.8] font-medium mb-6 max-w-lg"
                  style={{ fontFamily: '"Rajdhani", sans-serif' }}
                >
                  {tab.desc}
                </p>

                {/* Detail chips */}
                <div className="flex flex-wrap gap-2.5">
                  {tab.details.map((d, di) => (
                    <div
                      key={di}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg"
                      style={{
                        background: `${tab.accent}10`,
                        border: `1px solid ${tab.accent}18`,
                        animation: `feat-detailIn 0.4s cubic-bezier(0.22,1,0.36,1) ${0.15 + di * 0.1}s forwards`,
                        animationFillMode: 'both',
                        opacity: 0,
                      }}
                    >
                      <i className={`${d.icon} text-[13px]`} style={{ color: `${tab.accent}AA` }}></i>
                      <span
                        className="text-[11px] font-semibold text-white/70"
                        style={{ fontFamily: '"Rajdhani", sans-serif' }}
                      >
                        {d.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom accent line */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px]"
              style={{ background: `linear-gradient(90deg, transparent, ${tab.accent}50, transparent)` }}
            />
          </div>

          {/* ── Tab indicator dots ── */}
          <div className="flex justify-center gap-1.5 mt-5">
            {TABS.map((_, i) => (
              <div
                key={i}
                className="h-[4px] rounded-full transition-all duration-400"
                style={{
                  width: activeTab === i ? '24px' : '4px',
                  background: activeTab === i ? '#5B3AE8' : '#D4D0E0',
                  transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
