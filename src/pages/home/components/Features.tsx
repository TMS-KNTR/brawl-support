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

export default function Features() {
  const primary = [
    {
      icon: 'ri-shield-check-line',
      highlight: 'PayPay',
      title: 'PayPay対応の安全決済',
      desc: 'カード不要。PayPayでかんたん決済。エスクロー方式で代行完了まで代金を安全に保全。',
    },
    {
      icon: 'ri-chat-private-line',
      highlight: '0件',
      title: '完全匿名チャット',
      desc: '情報漏洩ゼロ。個人情報を一切公開せずにやり取り可能。引き継ぎも専用チャットで安全に。',
    },
    {
      icon: 'ri-star-line',
      highlight: '99%',
      title: 'プロの技術',
      desc: '成功率99%。厳正な審査を通過した実力派プレイヤーのみが在籍。',
    },
  ];

  const secondary = [
    { icon: 'ri-time-line', title: '24時間対応', desc: 'いつでも依頼OK' },
    { icon: 'ri-refund-line', title: '全額返金保証', desc: '未達成なら返金' },
    { icon: 'ri-lock-line', title: 'アカウント保護', desc: '暗号化で厳重管理' },
  ];

  const header = useReveal(0.3);
  const primaryGrid = useReveal(0.15);
  const secondaryGrid = useReveal(0.15);

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
        @keyframes feat-scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(20px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes feat-countUp {
          from { opacity: 0; transform: translateY(12px) scale(0.9); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes feat-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .feat-primary-card {
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease;
        }
        .feat-primary-card:hover {
          transform: translateY(-6px);
          box-shadow:
            0 20px 40px rgba(18,8,42,0.25),
            0 0 30px rgba(91,58,232,0.15);
        }
        .feat-primary-card:hover .feat-accent-line {
          opacity: 1;
          animation: feat-shimmer 1s ease forwards;
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

        {/* Section header */}
        <div
          ref={header.ref}
          className="text-center mb-14"
          style={{ perspective: '600px' }}
        >
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

        {/* Top 3 primary features with big numbers */}
        <div ref={primaryGrid.ref} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          {primary.map((f, i) => (
            <div
              key={i}
              className="feat-primary-card group relative rounded-2xl p-7 overflow-hidden"
              style={{
                background: 'linear-gradient(145deg, #1A1A2E 0%, #12082A 60%, #1A0E3A 100%)',
                opacity: primaryGrid.visible ? 1 : 0,
                animation: primaryGrid.visible
                  ? `feat-scaleIn 0.65s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s forwards`
                  : 'none',
                animationFillMode: 'both',
              }}
            >
              {/* Nebula glow */}
              <div
                className="absolute inset-0 opacity-40 pointer-events-none"
                style={{
                  background: `radial-gradient(ellipse 70% 60% at ${30 + i * 25}% 80%, rgba(91,58,232,0.15) 0%, transparent 70%)`,
                }}
              />

              {/* Shimmer line */}
              <div
                className="feat-accent-line absolute top-0 left-0 right-0 h-[2px] opacity-0"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(139,122,255,0.6) 45%, rgba(196,181,253,0.8) 50%, rgba(139,122,255,0.6) 55%, transparent 70%)',
                  backgroundSize: '200% 100%',
                }}
              />

              <div className="relative z-10">
                {/* Big highlight number */}
                <p
                  className="text-[40px] font-extrabold leading-none mb-3"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    background: 'linear-gradient(135deg, #C4B5FD 0%, #8B7AFF 50%, #5B3AE8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    opacity: primaryGrid.visible ? 1 : 0,
                    animation: primaryGrid.visible
                      ? `feat-countUp 0.6s cubic-bezier(0.22,1,0.36,1) ${0.3 + i * 0.15}s forwards`
                      : 'none',
                    animationFillMode: 'both',
                  }}
                >
                  {f.highlight}
                </p>

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
            </div>
          ))}
        </div>

        {/* Bottom 3 secondary features */}
        <div ref={secondaryGrid.ref} className="grid grid-cols-3 gap-3">
          {secondary.map((f, i) => (
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
              <p className="text-[10px] text-[#8A7DA8] font-medium">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
