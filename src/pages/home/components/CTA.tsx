import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

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

export default function CTA() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const section = useReveal(0.15);

  return (
    <section className="relative overflow-hidden">
      <style>{`
        @keyframes cta-fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cta-headerIn {
          from { opacity: 0; transform: translateY(18px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cta-orbPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50%      { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes cta-float1 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25%      { transform: translate(15px, -20px) rotate(90deg); }
          50%      { transform: translate(-10px, -35px) rotate(180deg); }
          75%      { transform: translate(-20px, -10px) rotate(270deg); }
        }
        @keyframes cta-float2 {
          0%, 100% { transform: translate(0, 0) rotate(45deg); }
          33%      { transform: translate(-20px, 15px) rotate(135deg); }
          66%      { transform: translate(10px, -25px) rotate(225deg); }
        }
        @keyframes cta-float3 {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          50%      { transform: translate(20px, 20px) rotate(180deg); }
        }
        @keyframes cta-drift1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50%      { transform: translate(30px, -40px); opacity: 0.6; }
        }
        @keyframes cta-drift2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.2; }
          50%      { transform: translate(-25px, 30px); opacity: 0.5; }
        }
        @keyframes cta-drift3 {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50%      { transform: translate(15px, 25px); opacity: 0.15; }
        }
        @keyframes cta-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .cta-btn-primary {
          position: relative;
          overflow: hidden;
          transition: transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease;
        }
        .cta-btn-primary::after {
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
        .cta-btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 35px rgba(91,58,232,0.5), 0 0 20px rgba(91,58,232,0.2);
        }
        .cta-btn-primary:hover::after {
          animation: cta-shimmer 0.8s ease forwards;
        }
        .cta-btn-ghost {
          transition: all 0.3s cubic-bezier(0.22,1,0.36,1);
        }
        .cta-btn-ghost:hover {
          border-color: rgba(139,122,255,0.5);
          color: #C4B5FD;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(91,58,232,0.15);
        }
        .cta-geo-shape {
          border: 1px solid rgba(91,58,232,0.12);
          position: absolute;
          pointer-events: none;
        }
        .cta-dot {
          position: absolute;
          width: 2px;
          height: 2px;
          border-radius: 50%;
          background: rgba(139,122,255,0.4);
          pointer-events: none;
        }
      `}</style>

      {/* ── Dark cosmic background ── */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(160deg, #1A1A2E 0%, #12082A 40%, #0E0828 70%, #1A0E3A 100%)'
      }} />

      {/* ── Nebula overlays ── */}
      <div className="absolute inset-0" style={{
        background: `
          radial-gradient(ellipse 50% 60% at 25% 60%, rgba(91,58,232,0.1) 0%, transparent 60%),
          radial-gradient(ellipse 40% 50% at 75% 35%, rgba(120,70,240,0.08) 0%, transparent 55%)
        `
      }} />

      {/* ── Glowing orb behind heading ── */}
      <div
        className="absolute left-1/2 top-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(91,58,232,0.2) 0%, rgba(91,58,232,0.05) 40%, transparent 70%)',
          animation: 'cta-orbPulse 6s ease-in-out infinite',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Floating geometric shapes ── */}
      {/* Diamonds */}
      <div className="cta-geo-shape w-8 h-8 rotate-45 rounded-sm" style={{ top: '18%', left: '12%', animation: 'cta-float1 18s ease-in-out infinite' }} />
      <div className="cta-geo-shape w-5 h-5 rotate-45 rounded-sm" style={{ bottom: '22%', left: '20%', animation: 'cta-float3 15s ease-in-out infinite' }} />
      <div className="cta-geo-shape w-6 h-6 rotate-45 rounded-sm" style={{ top: '12%', right: '22%', animation: 'cta-float2 16s ease-in-out infinite 2s' }} />
      <div className="cta-geo-shape w-4 h-4 rotate-45 rounded-sm" style={{ bottom: '15%', right: '8%', animation: 'cta-float1 14s ease-in-out infinite 4s' }} />
      <div className="cta-geo-shape w-7 h-7 rotate-45 rounded-sm" style={{ top: '55%', left: '5%', animation: 'cta-float3 19s ease-in-out infinite 1s' }} />

      {/* Hexagons / Rounded squares */}
      <div className="cta-geo-shape w-12 h-12 rounded-lg" style={{ top: '25%', right: '10%', animation: 'cta-float2 22s ease-in-out infinite', borderRadius: '30%' }} />
      <div className="cta-geo-shape w-9 h-9 rounded-lg" style={{ bottom: '18%', left: '35%', animation: 'cta-float1 20s ease-in-out infinite 3s', borderRadius: '30%' }} />
      <div className="cta-geo-shape w-10 h-10 rounded-lg" style={{ top: '60%', right: '25%', animation: 'cta-float3 17s ease-in-out infinite 6s', borderRadius: '30%' }} />

      {/* Circles */}
      <div className="cta-geo-shape w-6 h-6 rounded-full" style={{ bottom: '30%', right: '15%', animation: 'cta-float1 20s ease-in-out infinite 3s' }} />
      <div className="cta-geo-shape w-4 h-4 rounded-full" style={{ top: '15%', left: '28%', animation: 'cta-float2 13s ease-in-out infinite 1s' }} />
      <div className="cta-geo-shape w-5 h-5 rounded-full" style={{ bottom: '40%', left: '8%', animation: 'cta-float3 16s ease-in-out infinite 7s' }} />
      <div className="cta-geo-shape w-3 h-3 rounded-full" style={{ top: '70%', right: '5%', animation: 'cta-float1 11s ease-in-out infinite 2s' }} />

      {/* Large rings */}
      <div className="cta-geo-shape w-16 h-16 rounded-full" style={{ top: '40%', left: '6%', animation: 'cta-float2 25s ease-in-out infinite 5s', borderColor: 'rgba(91,58,232,0.06)' }} />
      <div className="cta-geo-shape w-20 h-20 rounded-full" style={{ bottom: '10%', right: '6%', animation: 'cta-float1 28s ease-in-out infinite 8s', borderColor: 'rgba(91,58,232,0.05)' }} />
      <div className="cta-geo-shape w-14 h-14 rounded-full" style={{ top: '8%', right: '40%', animation: 'cta-float3 23s ease-in-out infinite 3s', borderColor: 'rgba(91,58,232,0.05)' }} />

      {/* ── Drifting particles ── */}
      <div className="cta-dot" style={{ top: '20%', left: '30%', animation: 'cta-drift1 8s ease-in-out infinite' }} />
      <div className="cta-dot" style={{ top: '60%', left: '55%', animation: 'cta-drift2 10s ease-in-out infinite 2s' }} />
      <div className="cta-dot" style={{ top: '35%', right: '25%', animation: 'cta-drift3 7s ease-in-out infinite 1s' }} />
      <div className="cta-dot" style={{ top: '70%', left: '20%', animation: 'cta-drift1 9s ease-in-out infinite 4s' }} />
      <div className="cta-dot" style={{ top: '15%', right: '35%', animation: 'cta-drift2 11s ease-in-out infinite 3s' }} />
      <div className="cta-dot" style={{ top: '50%', left: '75%', animation: 'cta-drift3 8s ease-in-out infinite 6s' }} />
      <div className="cta-dot" style={{ top: '80%', left: '45%', animation: 'cta-drift1 12s ease-in-out infinite 2s' }} />
      <div className="cta-dot" style={{ top: '45%', left: '10%', animation: 'cta-drift2 9s ease-in-out infinite 5s' }} />
      <div className="cta-dot" style={{ top: '10%', left: '50%', animation: 'cta-drift3 10s ease-in-out infinite 1s' }} />
      <div className="cta-dot" style={{ top: '75%', right: '20%', animation: 'cta-drift1 7s ease-in-out infinite 3s' }} />
      <div className="cta-dot" style={{ top: '30%', left: '15%', animation: 'cta-drift2 8s ease-in-out infinite 7s' }} />
      <div className="cta-dot" style={{ top: '55%', right: '10%', animation: 'cta-drift3 11s ease-in-out infinite 4s' }} />
      <div className="cta-dot" style={{ top: '85%', left: '65%', animation: 'cta-drift1 9s ease-in-out infinite 6s' }} />
      <div className="cta-dot" style={{ top: '25%', right: '45%', animation: 'cta-drift2 13s ease-in-out infinite 8s' }} />
      <div className="cta-dot" style={{ top: '65%', left: '40%', animation: 'cta-drift3 6s ease-in-out infinite 2s' }} />
      <div className="cta-dot" style={{ top: '40%', right: '30%', animation: 'cta-drift1 10s ease-in-out infinite 5s' }} />

      {/* ── Content ── */}
      <div ref={section.ref} className="relative z-10 py-28 sm:py-36 text-center max-w-3xl mx-auto px-6 lg:px-8">
        <p
          className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#8B7AFF]/60 mb-6"
          style={{
            fontFamily: '"Orbitron", sans-serif',
            opacity: section.visible ? 1 : 0,
            animation: section.visible ? 'cta-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          Get Started
        </p>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-wider mb-5"
          style={{
            fontFamily: '"Orbitron", sans-serif',
            textShadow: '0 0 40px rgba(91,58,232,0.3), 0 0 80px rgba(91,58,232,0.1)',
            opacity: section.visible ? 1 : 0,
            animation: section.visible ? 'cta-headerIn 0.8s cubic-bezier(0.22,1,0.36,1) 0.1s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          今すぐ始めよう
        </h2>

        <p
          className="text-[14px] text-[#9890B8] mb-12 max-w-md mx-auto leading-relaxed font-medium"
          style={{
            opacity: section.visible ? 1 : 0,
            animation: section.visible ? 'cta-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          無料登録ですぐに依頼可能。安全な決済と匿名チャットで、安心してご利用いただけます。
        </p>

        {/* Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12"
          style={{
            opacity: section.visible ? 1 : 0,
            animation: section.visible ? 'cta-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.3s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          <button
            onClick={() => navigate(user ? '/order/new' : '/register')}
            className="cta-btn-primary w-full sm:w-auto px-10 py-4 bg-[#5B3AE8] hover:bg-[#4F2FD8] text-white text-[12px] font-bold tracking-[0.1em] uppercase rounded-lg cursor-pointer"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            無料で始める
            <i className="ri-arrow-right-line text-sm ml-2"></i>
          </button>
          <button
            onClick={() => navigate('/games')}
            className="cta-btn-ghost w-full sm:w-auto px-10 py-4 text-[12px] font-bold tracking-[0.1em] uppercase text-[#8B7AFF]/70 border border-[#2A2A45] rounded-lg cursor-pointer"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            ゲームを見る
          </button>
        </div>

        {/* Trust signals */}
        <div
          className="flex flex-wrap items-center justify-center gap-8"
          style={{
            opacity: section.visible ? 1 : 0,
            animation: section.visible ? 'cta-fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) 0.45s forwards' : 'none',
            animationFillMode: 'both',
          }}
        >
          {[
            { icon: 'ri-price-tag-3-line', text: '登録無料' },
            { icon: 'ri-refund-line', text: '全額返金保証' },
            { icon: 'ri-time-line', text: '24時間対応' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <i className={`${item.icon} text-xs text-[#5B3AE8]/50`}></i>
              <span className="text-[11px] text-[#605880] font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
