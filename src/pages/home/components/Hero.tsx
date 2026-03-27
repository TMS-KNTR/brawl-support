import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';

export default function Hero() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    navigate(user ? '/order/new' : '/register');
  };

  const scrollToHowItWorks = () => {
    const el = document.getElementById('how-it-works');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section className="relative pt-[72px] overflow-hidden">
      <style>{`
        @keyframes hero-fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes hero-glow-pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes hero-line-expand {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes hero-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        @keyframes hero-scan {
          0% { top: -8%; }
          100% { top: 108%; }
        }
        @keyframes hero-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes hero-particle-drift {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-180px) translateX(40px); opacity: 0; }
        }
        .hero-heading-line {
          animation: hero-fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          opacity: 0;
        }
        .hero-subtitle {
          animation: hero-fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.35s forwards;
          opacity: 0;
        }
        .hero-cta-group {
          animation: hero-fadeUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.55s forwards;
          opacity: 0;
        }
        .hero-label {
          animation: hero-fadeIn 0.8s ease 0.1s forwards;
          opacity: 0;
        }
        .hero-btn-primary {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-btn-primary::before {
          content: '';
          position: absolute;
          inset: -1px;
          background: linear-gradient(135deg, #8B7AFF, #5B3AE8, #3D1FA8, #5B3AE8);
          background-size: 300% 300%;
          border-radius: inherit;
          z-index: -1;
          animation: hero-shimmer 4s ease infinite;
        }
        .hero-btn-primary::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(139,122,255,0.15), transparent 60%);
          border-radius: inherit;
          opacity: 0;
          transition: opacity 0.3s;
        }
        .hero-btn-primary:hover::after {
          opacity: 1;
        }
        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 32px rgba(91,58,232,0.5), 0 0 64px rgba(91,58,232,0.2);
        }
        .hero-btn-secondary {
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .hero-btn-secondary::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, #2A2A40, #5B3AE8, #2A2A40);
          background-size: 200% 200%;
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          animation: hero-shimmer 6s ease infinite;
        }
        .hero-btn-secondary:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 24px rgba(91,58,232,0.25);
        }
        .hero-divider {
          animation: hero-line-expand 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s forwards;
          transform: scaleX(0);
        }
      `}</style>

      {/* ===== Background ===== */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[#080810]" />
        <img
          src="/hero-bg.webp"
          alt="げむ助 ゲーム代行サービス"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080810]/40 via-[#080810]/30 to-[#080810]/60" />

        {/* Radial glow behind text */}
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[40%] w-[700px] h-[500px] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse, rgba(91,58,232,0.18) 0%, transparent 70%)',
            animation: 'hero-glow-pulse 5s ease-in-out infinite',
          }}
        />

        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-[1px] pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(139,122,255,0.25) 30%, rgba(139,122,255,0.25) 70%, transparent)',
            animation: 'hero-scan 4s linear infinite',
          }}
        />

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 2 === 0 ? '#8B7AFF' : '#5B3AE8',
              left: `${15 + i * 13}%`,
              bottom: `${10 + (i % 4) * 8}%`,
              animation: `hero-particle-drift ${5 + i * 1.2}s ease-in-out ${i * 0.8}s infinite`,
              filter: 'blur(0.5px)',
            }}
          />
        ))}
      </div>

      {/* ===== Content ===== */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-28 pb-36 lg:pt-36 lg:pb-44">
        <div className="max-w-4xl mx-auto text-center">
          {/* Label */}
          <p
            className="hero-label text-[11px] font-bold tracking-[0.3em] uppercase text-[#8B7AFF] mb-8"
            style={{ fontFamily: '"Orbitron", sans-serif' }}
          >
            Gaming Support Platform
          </p>

          {/* Main heading */}
          <h1 className="mb-7">
            <span
              className="hero-heading-line block text-[clamp(1.75rem,8vw,4.5rem)] font-extrabold leading-[1.1] text-white"
              style={{ fontFamily: '"Orbitron", sans-serif', animationDelay: '0.15s' }}
            >
              ゲームの代行を
            </span>
            <span
              className="hero-heading-line block text-[clamp(1.75rem,8vw,4.5rem)] font-extrabold leading-[1.1] text-white"
              style={{ fontFamily: '"Orbitron", sans-serif', animationDelay: '0.3s' }}
            >
              プロに任せよう
            </span>
          </h1>

          {/* Decorative divider */}
          <div className="flex justify-center mb-7">
            <div
              className="hero-divider h-[1px] w-24"
              style={{
                background: 'linear-gradient(90deg, transparent, #5B3AE8, transparent)',
              }}
            />
          </div>

          {/* Subtitle */}
          <p className="hero-subtitle text-[13px] sm:text-[15px] text-[#9090B0] leading-relaxed max-w-lg mx-auto mb-12 font-medium">
            厳選されたプロプレイヤーがあなたの目標を確実に達成。
            <br />
            安全な決済と匿名チャットで、安心のお取引を提供します。
          </p>

          {/* CTA buttons */}
          <div className="hero-cta-group flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleCTA}
              className="hero-btn-primary w-full sm:w-auto px-10 py-4 bg-[#5B3AE8] text-white text-[13px] font-bold tracking-wider uppercase rounded-md cursor-pointer"
              style={{ fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.1em' }}
            >
              無料で始める
            </button>
            <button
              onClick={scrollToHowItWorks}
              className="hero-btn-secondary w-full sm:w-auto px-10 py-4 text-[13px] font-bold tracking-wider uppercase text-[#9090B0] hover:text-white rounded-md cursor-pointer bg-transparent"
              style={{ fontFamily: '"Orbitron", sans-serif', letterSpacing: '0.1em' }}
            >
              使い方を見る
            </button>
          </div>

        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
