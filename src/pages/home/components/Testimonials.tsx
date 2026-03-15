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

export default function Testimonials() {
  const testimonials = [
    {
      result: '目標ランク到達',
      rating: 5,
      comment: '仕事が忙しくてランク上げができなかったけど、3日で目標まで上げてくれました。チャットで進捗も教えてくれて安心でした。',
    },
    {
      result: '依頼完了',
      rating: 5,
      comment: '想像以上に早く完了して驚き。料金も明確で安心して使えます。匿名でやり取りできるのも良い。',
    },
    {
      result: '目標達成',
      rating: 5,
      comment: 'プロの立ち回りが参考になりました。目標も達成できて一石二鳥です！',
    },
    {
      result: '初回利用',
      rating: 5,
      comment: '初めて代行サービスを使ったけど、丁寧に対応してくれて不安はすぐになくなりました。',
    },
    {
      result: '期限内完了',
      rating: 5,
      comment: '期限に間に合わなそうで焦ってましたが、期限内に達成してくれて本当に感謝！',
    },
    {
      result: 'リピート利用',
      rating: 5,
      comment: '2回目の利用ですが、前回同様スムーズでした。また利用します！',
    },
  ];

  const header = useReveal(0.3);
  const grid = useReveal(0.1);

  return (
    <section className="py-24 bg-[#F8F6FF] overflow-hidden">
      {/* Animations */}
      <style>{`
        @keyframes testi-fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes testi-headerIn {
          from { opacity: 0; transform: translateY(18px) rotateX(30deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0deg); }
        }
        @keyframes testi-scaleIn {
          from { opacity: 0; transform: scale(0.93) translateY(18px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes testi-starPop {
          0%   { transform: scale(1); }
          40%  { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        @keyframes testi-badgePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(91,58,232,0.2); }
          50%      { box-shadow: 0 0 0 5px rgba(91,58,232,0); }
        }
        @keyframes testi-quoteFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%      { transform: translateY(-3px) rotate(3deg); }
        }
        .testi-card {
          transition: transform 0.45s cubic-bezier(0.22,1,0.36,1), box-shadow 0.45s ease, border-color 0.3s ease;
        }
        .testi-card:hover {
          transform: translateY(-5px);
          border-color: rgba(91,58,232,0.25);
          box-shadow:
            0 18px 36px rgba(91,58,232,0.08),
            0 0 0 1px rgba(91,58,232,0.04);
        }
        .testi-card:hover .testi-quote {
          color: #C4B5FD;
          animation: testi-quoteFloat 1.5s ease-in-out infinite;
        }
        .testi-card:hover .testi-badge {
          animation: testi-badgePulse 1.5s ease-in-out infinite;
          background: #5B3AE8;
          border-color: #5B3AE8;
        }
        .testi-card:hover .testi-badge i {
          color: white;
        }
        .testi-card:hover .testi-stars i {
          animation: testi-starPop 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .testi-card:hover .testi-stars i:nth-child(1) { animation-delay: 0s; }
        .testi-card:hover .testi-stars i:nth-child(2) { animation-delay: 0.05s; }
        .testi-card:hover .testi-stars i:nth-child(3) { animation-delay: 0.1s; }
        .testi-card:hover .testi-stars i:nth-child(4) { animation-delay: 0.15s; }
        .testi-card:hover .testi-stars i:nth-child(5) { animation-delay: 0.2s; }
        .testi-card:hover .testi-comment {
          color: #4A3D6E;
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <div
          ref={header.ref}
          className="text-center mb-14"
          style={{ perspective: '600px' }}
        >
          <div
            className="inline-block px-5 py-1.5 border border-[#5B3AE8]/20 rounded-full mb-6"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'testi-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            <span
              className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#5B3AE8]"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              お客様の声
            </span>
          </div>

          {/* Overall rating */}
          <div
            className="flex items-center justify-center gap-3 mt-4"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'testi-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <i key={i} className="ri-star-fill text-[#FBBF24] text-sm"></i>
              ))}
            </div>
            <span
              className="text-lg font-bold text-[#1A1A2E]"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              4.9
            </span>
            <span className="text-[11px] text-[#8A7DA8] font-medium">/ 3,500+ reviews</span>
          </div>
        </div>

        {/* Review cards grid */}
        <div ref={grid.ref} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testi-card group bg-white rounded-2xl p-6 border border-[#E8E4F3]"
              style={{
                opacity: grid.visible ? 1 : 0,
                animation: grid.visible
                  ? `testi-scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) ${0.06 + i * 0.09}s forwards`
                  : 'none',
                animationFillMode: 'both',
              }}
            >
              {/* Badge + result + rating */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="testi-badge w-8 h-8 rounded-lg flex items-center justify-center border border-[#E0DBF5] bg-[#F3F0FF] transition-all duration-300"
                  >
                    <i className="ri-verified-badge-fill text-sm text-[#5B3AE8] transition-colors duration-300"></i>
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-[#5B3AE8] tracking-wide block">{t.result}</span>
                    <div className="testi-stars flex gap-0.5 mt-0.5">
                      {[...Array(t.rating)].map((_, j) => (
                        <i key={j} className="ri-star-fill text-[#FBBF24] text-[9px]"></i>
                      ))}
                    </div>
                  </div>
                </div>
                <i className="testi-quote ri-double-quotes-r text-xl text-[#E0DBF5] transition-all duration-300"></i>
              </div>

              {/* Comment */}
              <p className="testi-comment text-[12px] text-[#8A7DA8] leading-relaxed font-medium transition-colors duration-300">
                {t.comment}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
