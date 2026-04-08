import { Helmet } from 'react-helmet-async';
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

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

export default function GamesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const header = useReveal(0.3);
  const card = useReveal(0.15);
  const cta = useReveal(0.15);

  return (
    <div
      className="min-h-screen bg-white text-[#1E293B] overflow-x-hidden"
      style={{ fontFamily: '"Rajdhani", sans-serif' }}
    >
      <Helmet>
        <title>対応ゲーム | げむ助 - ブロスタ代行サービス</title>
        <meta name="description" content="げむ助が対応しているゲームタイトル一覧。Brawl Stars（ブロスタ）のトロフィー上げ・ランク上げ代行に対応中。対応タイトルは順次拡大予定。" />
        <meta property="og:title" content="対応ゲーム | げむ助" />
        <meta property="og:description" content="げむ助が対応しているゲームタイトル一覧。ブロスタの代行サービスを提供中。" />
        <meta property="og:url" content="https://gemusuke.com/games" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:image" content="https://gemusuke.com/og-image.png" />
        <link rel="canonical" href="https://gemusuke.com/games" />
      </Helmet>
      <Header />

      <style>{`
        @keyframes games-fadeUp {
          from { opacity: 1; }
          to   { opacity: 1; }
        }
        @keyframes games-headerIn {
          from { opacity: 0; transform: translateY(24px) rotateX(40deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes games-scaleIn {
          from { opacity: 1; }
          to   { opacity: 1; }
        }
        @keyframes games-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes games-glow {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        .games-card {
          transition: transform 0.5s cubic-bezier(0.22,1,0.36,1), box-shadow 0.5s ease;
        }
        .games-card:hover {
          transform: translateY(-8px);
          box-shadow:
            0 24px 48px rgba(18,8,42,0.3),
            0 0 40px rgba(91,58,232,0.15);
        }
        .games-card:hover .games-card-img {
          transform: scale(1.05);
        }
        .games-card:hover .games-card-accent {
          opacity: 1;
          animation: games-shimmer 1s ease forwards;
        }
        .games-card:hover .games-card-badge {
          background: #5B3AE8;
        }
        .games-coming-card {
          transition: transform 0.4s cubic-bezier(0.22,1,0.36,1), border-color 0.3s ease;
        }
        .games-coming-card:hover {
          transform: translateY(-4px);
          border-color: rgba(91,58,232,0.3);
        }
        .games-cta-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.35s cubic-bezier(0.22,1,0.36,1);
        }
        .games-cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            105deg, transparent 35%,
            rgba(255,255,255,0.18) 45%,
            rgba(255,255,255,0.3) 50%,
            rgba(255,255,255,0.18) 55%,
            transparent 65%
          );
          background-size: 200% 100%;
          background-position: -200% center;
        }
        .games-cta-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(91,58,232,0.5), 0 0 20px rgba(91,58,232,0.2);
        }
        .games-cta-btn:hover::after {
          animation: games-shimmer 0.8s ease forwards;
        }
        @keyframes games-float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%      { transform: translate(15px, -20px) rotate(90deg); }
          50%      { transform: translate(-10px, -35px) rotate(180deg); }
          75%      { transform: translate(-20px, -10px) rotate(270deg); }
        }
        @keyframes games-float2 {
          0%, 100% { transform: translate(0, 0) rotate(45deg); }
          33%      { transform: translate(-20px, 15px) rotate(135deg); }
          66%      { transform: translate(10px, -25px) rotate(225deg); }
        }
        @keyframes games-float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(20px, 20px) rotate(180deg); }
        }
        @keyframes games-drift1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50%      { transform: translate(30px, -40px); opacity: 0.6; }
        }
        @keyframes games-drift2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50%      { transform: translate(-25px, 30px); opacity: 0.5; }
        }
        @keyframes games-drift3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50%      { transform: translate(15px, 25px); opacity: 0.15; }
        }
        .games-geo-shape {
          border: 1px solid rgba(91,58,232,0.12);
          position: absolute;
          pointer-events: none;
        }
        .games-dot {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(139,122,255,0.4);
          pointer-events: none;
        }
      `}</style>

      {/* ===== Hero ===== */}
      <section className="relative pt-[72px] overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[#080810]" />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(91,58,232,0.12) 0%, transparent 70%)',
              animation: 'games-glow 5s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <div className="max-w-3xl mx-auto text-center" style={{ perspective: '800px' }}>
            <p
              className="text-[11px] font-bold tracking-[0.3em] uppercase text-[#8B7AFF] mb-6"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                animation: 'games-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) both',
              }}
            >
              Games
            </p>
            <h1
              className="text-[clamp(1.8rem,5vw,3.5rem)] font-extrabold leading-[1.1] text-white mb-5"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                perspective: '800px',
                animation: 'games-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.12s both',
              }}
            >
              対応ゲーム
            </h1>
            <p
              className="text-[15px] text-[#9090B0] leading-relaxed max-w-md mx-auto font-medium"
              style={{
                animation: 'games-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.25s both',
              }}
            >
              プロの代行者が対応可能なゲームタイトル一覧です。
              <br />
              対応タイトルは順次追加予定。
            </p>
          </div>
        </div>

      </section>

      {/* ===== Game Cards ===== */}
      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
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
                animation: header.visible ? 'games-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
                animationFillMode: 'both',
              }}
            >
              Available Now
            </span>
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-wider mb-4"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                opacity: header.visible ? 1 : 0,
                animation: header.visible ? 'games-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s forwards' : 'none',
                animationFillMode: 'both',
              }}
            >
              対応中のゲーム
            </h2>
            <p
              className="text-[13px] text-[#7C6F99] max-w-md mx-auto leading-relaxed font-medium"
              style={{
                opacity: header.visible ? 1 : 0,
                animation: header.visible ? 'games-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s forwards' : 'none',
                animationFillMode: 'both',
              }}
            >
              条件を入力するだけで料金が自動計算されます。
            </p>
          </div>

          {/* Brawl Stars Card */}
          <div
            ref={card.ref}
            className="max-w-lg mx-auto mb-16"
            style={{
              opacity: card.visible ? 1 : 0,
              animation: card.visible ? 'games-scaleIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.1s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            <div
              className="games-card group relative rounded-2xl overflow-hidden cursor-pointer"
              style={{
                background: 'linear-gradient(145deg, #1A1A2E 0%, #12082A 60%, #1A0E3A 100%)',
              }}
              onClick={() => navigate(user ? '/order/new' : '/register')}
            >
              {/* Accent shimmer line */}
              <div
                className="games-card-accent absolute top-0 left-0 right-0 h-[2px] opacity-0 z-10"
                style={{
                  background: 'linear-gradient(105deg, transparent 30%, rgba(139,122,255,0.6) 45%, rgba(196,181,253,0.8) 50%, rgba(139,122,255,0.6) 55%, transparent 70%)',
                  backgroundSize: '200% 100%',
                }}
              />

              {/* Image */}
              <div className="relative h-52 sm:h-64 overflow-hidden">
                <img
                  src="/brawl-stars.webp"
                  alt="Brawl Stars"
                  className="games-card-img w-full h-full object-cover transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#12082A] via-[#12082A]/30 to-transparent" />

                {/* Badge */}
                <div
                  className="games-card-badge absolute top-4 left-4 px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase text-white bg-[#5B3AE8]/80 transition-colors duration-300"
                  style={{ fontFamily: '"Orbitron", sans-serif' }}
                >
                  対応中
                </div>
              </div>

              {/* Content */}
              <div className="relative p-6">
                <div
                  className="absolute inset-0 opacity-40 pointer-events-none"
                  style={{
                    background: 'radial-gradient(ellipse 70% 60% at 50% 80%, rgba(91,58,232,0.15) 0%, transparent 70%)',
                  }}
                />

                <div className="relative z-10">
                  <h3
                    className="text-xl sm:text-2xl font-extrabold text-white tracking-wider mb-2"
                    style={{ fontFamily: '"Orbitron", sans-serif' }}
                  >
                    Brawl Stars
                  </h3>
                  <p className="text-[13px] text-[#9890B8] leading-relaxed font-medium mb-5">
                    トロフィー上げ、ランク上げなど、
                    Brawl Starsの代行サービスを提供。
                  </p>

                  {/* Service tags */}
                  <div className="flex flex-wrap gap-2 mb-5">
                    {['トロフィー上げ', 'ランク上げ'].map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-[#8B7AFF] bg-[#5B3AE8]/10 rounded border border-[#5B3AE8]/15"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div className="flex items-center justify-end">
                    <span
                      className="text-[12px] font-bold tracking-wider text-[#8B7AFF] group-hover:text-white transition-colors duration-300"
                      style={{ fontFamily: '"Orbitron", sans-serif' }}
                    >
                      依頼する
                      <i className="ri-arrow-right-line ml-1 transition-transform duration-300 inline-block group-hover:translate-x-1"></i>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div
            className="max-w-lg mx-auto"
            style={{
              opacity: card.visible ? 1 : 0,
              animation: card.visible ? 'games-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            <div className="text-center mb-6">
              <span
                className="inline-block text-[10px] font-bold tracking-[0.25em] uppercase text-[#9CA3AF]"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                Coming Soon
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'ri-crosshair-2-line', label: 'FPS / シューター' },
                { icon: 'ri-sword-line', label: 'MOBA / ストラテジー' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="games-coming-card rounded-xl border border-dashed border-[#E0DCF0] p-5 text-center"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#F8F6FF] flex items-center justify-center mx-auto mb-3">
                    <i className={`${item.icon} text-lg text-[#C4B5FD]`}></i>
                  </div>
                  <p className="text-[12px] font-bold text-[#A8A0C0] tracking-wide">
                    {item.label}
                  </p>
                  <p className="text-[10px] text-[#C8C0DC] mt-1 font-medium">準備中</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(160deg, #1A1A2E 0%, #12082A 40%, #0E0828 70%, #1A0E3A 100%)'
        }} />
        <div className="absolute inset-0" style={{
          background: `
            radial-gradient(ellipse 50% 60% at 25% 60%, rgba(91,58,232,0.1) 0%, transparent 60%),
            radial-gradient(ellipse 40% 50% at 75% 35%, rgba(120,70,240,0.08) 0%, transparent 55%)
          `
        }} />
        <div
          className="absolute left-1/2 top-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(circle, rgba(91,58,232,0.2) 0%, rgba(91,58,232,0.05) 40%, transparent 70%)',
            animation: 'games-glow 6s ease-in-out infinite',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* Floating geometric shapes — matches home CTA */}
        {/* Diamonds */}
        <div className="games-geo-shape w-8 h-8 rotate-45 rounded-sm" style={{ top: '18%', left: '12%', animation: 'games-float1 18s ease-in-out infinite' }} />
        <div className="games-geo-shape w-5 h-5 rotate-45 rounded-sm" style={{ bottom: '22%', left: '20%', animation: 'games-float3 15s ease-in-out infinite' }} />
        <div className="games-geo-shape w-6 h-6 rotate-45 rounded-sm" style={{ top: '12%', right: '22%', animation: 'games-float2 16s ease-in-out infinite 2s' }} />
        <div className="games-geo-shape w-4 h-4 rotate-45 rounded-sm" style={{ bottom: '15%', right: '8%', animation: 'games-float1 14s ease-in-out infinite 4s' }} />
        <div className="games-geo-shape w-7 h-7 rotate-45 rounded-sm" style={{ top: '55%', left: '5%', animation: 'games-float3 19s ease-in-out infinite 1s' }} />

        {/* Hexagons / Rounded squares */}
        <div className="games-geo-shape w-12 h-12 rounded-lg" style={{ top: '25%', right: '10%', animation: 'games-float2 22s ease-in-out infinite', borderRadius: '30%' }} />
        <div className="games-geo-shape w-9 h-9 rounded-lg" style={{ bottom: '18%', left: '35%', animation: 'games-float1 20s ease-in-out infinite 3s', borderRadius: '30%' }} />
        <div className="games-geo-shape w-10 h-10 rounded-lg" style={{ top: '60%', right: '25%', animation: 'games-float3 17s ease-in-out infinite 6s', borderRadius: '30%' }} />

        {/* Circles */}
        <div className="games-geo-shape w-6 h-6 rounded-full" style={{ bottom: '30%', right: '15%', animation: 'games-float1 20s ease-in-out infinite 3s' }} />
        <div className="games-geo-shape w-4 h-4 rounded-full" style={{ top: '15%', left: '28%', animation: 'games-float2 13s ease-in-out infinite 1s' }} />
        <div className="games-geo-shape w-5 h-5 rounded-full" style={{ bottom: '40%', left: '8%', animation: 'games-float3 16s ease-in-out infinite 7s' }} />
        <div className="games-geo-shape w-3 h-3 rounded-full" style={{ top: '70%', right: '5%', animation: 'games-float1 11s ease-in-out infinite 2s' }} />

        {/* Large rings */}
        <div className="games-geo-shape w-16 h-16 rounded-full" style={{ top: '40%', left: '6%', animation: 'games-float2 25s ease-in-out infinite 5s', borderColor: 'rgba(91,58,232,0.06)' }} />
        <div className="games-geo-shape w-20 h-20 rounded-full" style={{ bottom: '10%', right: '6%', animation: 'games-float1 28s ease-in-out infinite 8s', borderColor: 'rgba(91,58,232,0.05)' }} />
        <div className="games-geo-shape w-14 h-14 rounded-full" style={{ top: '8%', right: '40%', animation: 'games-float3 23s ease-in-out infinite 3s', borderColor: 'rgba(91,58,232,0.05)' }} />

        {/* Drifting particles */}
        <div className="games-dot" style={{ top: '20%', left: '30%', animation: 'games-drift1 8s ease-in-out infinite' }} />
        <div className="games-dot" style={{ top: '60%', left: '55%', animation: 'games-drift2 10s ease-in-out infinite 2s' }} />
        <div className="games-dot" style={{ top: '35%', right: '25%', animation: 'games-drift3 7s ease-in-out infinite 1s' }} />
        <div className="games-dot" style={{ top: '70%', left: '20%', animation: 'games-drift1 9s ease-in-out infinite 4s' }} />
        <div className="games-dot" style={{ top: '15%', right: '35%', animation: 'games-drift2 11s ease-in-out infinite 3s' }} />
        <div className="games-dot" style={{ top: '50%', left: '75%', animation: 'games-drift3 8s ease-in-out infinite 6s' }} />
        <div className="games-dot" style={{ top: '80%', left: '45%', animation: 'games-drift1 12s ease-in-out infinite 2s' }} />
        <div className="games-dot" style={{ top: '45%', left: '10%', animation: 'games-drift2 9s ease-in-out infinite 5s' }} />
        <div className="games-dot" style={{ top: '10%', left: '50%', animation: 'games-drift3 10s ease-in-out infinite 1s' }} />
        <div className="games-dot" style={{ top: '75%', right: '20%', animation: 'games-drift1 7s ease-in-out infinite 3s' }} />
        <div className="games-dot" style={{ top: '30%', left: '15%', animation: 'games-drift2 8s ease-in-out infinite 7s' }} />
        <div className="games-dot" style={{ top: '55%', right: '10%', animation: 'games-drift3 11s ease-in-out infinite 4s' }} />
        <div className="games-dot" style={{ top: '85%', left: '65%', animation: 'games-drift1 9s ease-in-out infinite 6s' }} />
        <div className="games-dot" style={{ top: '25%', right: '45%', animation: 'games-drift2 13s ease-in-out infinite 8s' }} />
        <div className="games-dot" style={{ top: '65%', left: '40%', animation: 'games-drift3 6s ease-in-out infinite 2s' }} />
        <div className="games-dot" style={{ top: '40%', right: '30%', animation: 'games-drift1 10s ease-in-out infinite 5s' }} />

        <div ref={cta.ref} className="relative z-10 py-24 sm:py-28 text-center max-w-2xl mx-auto px-6 lg:px-8" style={{ perspective: '800px' }}>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-white tracking-wider mb-5"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              textShadow: '0 0 40px rgba(91,58,232,0.3)',
              opacity: cta.visible ? 1 : 0,
              animation: cta.visible ? 'games-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            さっそく始めよう
          </h2>
          <p
            className="text-[14px] text-[#9890B8] mb-10 max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: cta.visible ? 1 : 0,
              animation: cta.visible ? 'games-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.15s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            無料登録ですぐに依頼可能。安全な決済と匿名チャットで安心。
          </p>
          <div
            style={{
            }}
          >
            <button
              onClick={() => navigate(user ? '/order/new' : '/register')}
              className="games-cta-btn px-10 py-4 bg-[#5B3AE8] hover:bg-[#4F2FD8] text-white text-[12px] font-bold tracking-[0.1em] uppercase rounded-lg cursor-pointer"
              style={{ fontFamily: '"Orbitron", sans-serif' }}
            >
              無料で始める
              <i className="ri-arrow-right-line text-sm ml-2"></i>
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
