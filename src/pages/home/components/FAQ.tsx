import { useEffect, useRef, useState, useCallback } from 'react';

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

/* ── Smooth height transition for accordion ── */
function useAccordionHeight(isOpen: boolean) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  const measure = useCallback(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, []);

  useEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  return { contentRef, height: isOpen ? height : 0 };
}

/* ── Single FAQ Item ── */
function FAQItem({
  q,
  a,
  icon,
  isOpen,
  onToggle,
  index,
  visible,
}: {
  q: string;
  a: string;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  visible: boolean;
}) {
  const { contentRef, height } = useAccordionHeight(isOpen);
  const delay = 0.06 + index * 0.08;

  return (
    <div
      className={`faq-item group rounded-2xl border overflow-hidden transition-all duration-400 ${
        isOpen
          ? 'border-[#5B3AE8]/30 bg-white shadow-lg shadow-[#5B3AE8]/[0.06]'
          : 'border-[#E0DBF5] bg-white/70 hover:border-[#C4B5FD] hover:bg-white hover:shadow-md hover:shadow-[#5B3AE8]/[0.03]'
      }`}
      style={{
        opacity: visible ? 1 : 0,
        animation: visible
          ? `faq-slideIn 0.55s cubic-bezier(0.22,1,0.36,1) ${delay}s forwards`
          : 'none',
        animationFillMode: 'both',
      }}
    >
      {/* Purple accent bar on left when open */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl transition-all duration-400"
        style={{
          background: 'linear-gradient(to bottom, #5B3AE8, #8B7AFF)',
          opacity: isOpen ? 1 : 0,
          transform: isOpen ? 'scaleY(1)' : 'scaleY(0.3)',
        }}
      />

      {/* Question button */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 px-6 py-5 text-left cursor-pointer relative"
      >
        {/* Icon */}
        <div
          className={`faq-icon-box w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
            isOpen
              ? 'bg-[#5B3AE8] shadow-md shadow-[#5B3AE8]/25'
              : 'bg-[#F3F0FF] group-hover:bg-[#EDE9FE]'
          }`}
        >
          <i
            className={`${icon} text-sm transition-all duration-300 ${
              isOpen ? 'text-white' : 'text-[#5B3AE8]'
            }`}
          ></i>
        </div>

        {/* Question text */}
        <span
          className={`text-[14px] font-bold tracking-wide flex-1 transition-colors duration-300 ${
            isOpen ? 'text-[#1A1A2E]' : 'text-[#3D3560] group-hover:text-[#1A1A2E]'
          }`}
          style={{ fontFamily: '"Rajdhani", sans-serif' }}
        >
          {q}
        </span>

        {/* Toggle indicator */}
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-400 ${
            isOpen
              ? 'bg-[#F3F0FF] rotate-180'
              : 'bg-[#F8F6FF] group-hover:bg-[#F3F0FF]'
          }`}
        >
          <i
            className={`ri-arrow-down-s-line text-base transition-all duration-300 ${
              isOpen ? 'text-[#5B3AE8]' : 'text-[#9890B8] group-hover:text-[#5B3AE8]'
            }`}
          ></i>
        </div>
      </button>

      {/* Answer (animated height) */}
      <div
        className="overflow-hidden transition-all duration-400"
        style={{
          maxHeight: `${height}px`,
          opacity: isOpen ? 1 : 0,
          transition: 'max-height 0.4s cubic-bezier(0.22,1,0.36,1), opacity 0.3s ease',
        }}
      >
        <div ref={contentRef} className="px-6 pb-5 pl-[4.25rem]">
          <p className="text-[12.5px] text-[#6E5FA0] leading-[1.8] font-medium">
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const header = useReveal(0.3);
  const list = useReveal(0.1);

  const faqs = [
    {
      icon: 'ri-shield-check-line',
      q: 'アカウント情報は安全ですか？',
      a: 'はい。アカウント情報は暗号化された専用チャットのみでやり取りされ、サーバーに保存されません。代行完了後はチャット履歴も削除可能です。万が一の問題にも運営が迅速に対応いたします。',
    },
    {
      icon: 'ri-refund-line',
      q: '目標が達成できなかった場合、返金はできますか？',
      a: '30日間の返金保証があります。購入後30日以内に依頼した目標が達成されなかった場合、お支払い金額を全額返金いたします。代行完了が確認されるまで代金は安全に保管されます。',
    },
    {
      icon: 'ri-bank-card-line',
      q: 'どのような支払い方法に対応していますか？',
      a: 'クレジットカード決済・コンビニ決済・銀行振込に対応しています。すべての決済は安全に処理されます。',
    },
    {
      icon: 'ri-time-line',
      q: '依頼からどのくらいで完了しますか？',
      a: '依頼内容により異なりますが、多くの場合24〜72時間以内に完了します。受注後はチャットでリアルタイムに進捗が共有されるため、状況をいつでも確認できます。',
    },
    {
      icon: 'ri-spy-line',
      q: '個人情報は必要ですか？',
      a: '一切不要です。ユーザー間のやり取りはすべて匿名チャットで行われ、本名・住所・電話番号などの個人情報を公開する必要はありません。',
    },
    {
      icon: 'ri-user-line',
      q: '依頼後にアカウントは使えますか？',
      a: '代行期間中はアカウントをご利用いただけません。作業完了までアカウントの使用はお控えください。完了後は通常通りご利用いただけます。',
    },
  ];

  return (
    <section id="faq" className="py-24 bg-[#F8F6FF] overflow-hidden">
      <style>{`
        @keyframes faq-fadeUp {
          from { opacity: 0; transform: translateY(24px) rotateX(40deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes faq-headerIn {
          from { opacity: 0; transform: translateY(24px) rotateX(40deg); }
          to   { opacity: 1; transform: translateY(0) rotateX(0); }
        }
        @keyframes faq-slideIn {
          from { opacity: 1; }
          to   { opacity: 1; }
        }
        .faq-item {
          position: relative;
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 lg:px-8">
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
              animation: header.visible ? 'faq-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            FAQ
          </span>
          <h2
            className="text-2xl sm:text-3xl font-extrabold text-[#1A1A2E] tracking-wider mb-4"
            style={{
              fontFamily: '"Orbitron", sans-serif',
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'faq-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.12s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            よくある質問
          </h2>
          <p
            className="text-[13px] text-[#7C6F99] max-w-md mx-auto leading-relaxed font-medium"
            style={{
              opacity: header.visible ? 1 : 0,
              animation: header.visible ? 'faq-headerIn 0.7s cubic-bezier(0.22,1,0.36,1) 0.25s forwards' : 'none',
              animationFillMode: 'both',
            }}
          >
            初めての方が気になるポイントをまとめました。
          </p>
        </div>

        {/* FAQ list */}
        <div ref={list.ref} className="space-y-3">
          {faqs.map((faq, i) => (
            <FAQItem
              key={i}
              q={faq.q}
              a={faq.a}
              icon={faq.icon}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
              index={i}
              visible={list.visible}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
