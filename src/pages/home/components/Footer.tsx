import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-[#222] bg-[#111]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <img
                src="/logo-white.png"
                alt="げむ助"
                className="h-16 w-auto"
              />
            </div>
            <p className="text-sm text-[#888] leading-relaxed mb-6 max-w-sm font-medium">
              プロの代行者による安全・確実なゲーム代行サービス。
            </p>
            <div className="flex gap-3">
              <a
                href="https://x.com/nxpyzo"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-[#333] rounded-lg flex items-center justify-center text-[#555] hover:text-white hover:border-[#555] transition-colors"
              >
                <i className="ri-twitter-x-fill text-sm"></i>
              </a>
            </div>
          </div>

          {/* Service & Legal — スマホでは横並び */}
          <div className="grid grid-cols-2 md:contents gap-8">
            <div>
              <h3
                className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#666] mb-5"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                サービス
              </h3>
              <ul className="space-y-3">
                <li><Link to="/games" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">対応ゲーム</Link></li>
                <li><Link to="/order/new" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">依頼する</Link></li>
                <li><Link to="/register" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">新規登録</Link></li>
                <li>
                  <a href="mailto:gemusuke.official@gmail.com" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 cursor-pointer font-medium">
                    お問い合わせ
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3
                className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#666] mb-5"
                style={{ fontFamily: '"Orbitron", sans-serif' }}
              >
                法的情報
              </h3>
              <ul className="space-y-3">
                <li><Link to="/legal/terms" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">利用規約</Link></li>
                <li><Link to="/legal/privacy" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">プライバシーポリシー</Link></li>
                <li><Link to="/legal/compliance" className="text-[12px] text-[#888] hover:text-white transition-colors duration-300 font-medium">特定商取引法に基づく表記</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-[#222] pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-[11px] text-[#666] font-medium">
            &copy; 2026 げむ助. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-[#666]">
            <i className="ri-shield-check-line text-[#444]"></i>
            <span className="font-medium">Powered by Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
