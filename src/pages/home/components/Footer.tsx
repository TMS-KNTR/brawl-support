import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-500 rounded-lg flex items-center justify-center">
                <i className="ri-gamepad-fill text-white text-xl"></i>
              </div>
              <span className="text-2xl font-bold text-white" style={{ fontFamily: '"Pacifico", serif' }}>げむ助</span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-6">
              プロゲーマーによる安全・確実なゲーム代行サービス
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                <i className="ri-twitter-x-fill text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                <i className="ri-discord-fill text-lg"></i>
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer">
                <i className="ri-youtube-fill text-lg"></i>
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">サポート</h3>
            <ul className="space-y-3">
              <li><a href="mailto:gemusuke.official@gmail.com" className="hover:text-purple-400 transition-colors cursor-pointer">お問い合わせ</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-6">法的情報</h3>
            <ul className="space-y-3">
              <li><Link to="/legal/terms" className="hover:text-purple-400 transition-colors">利用規約</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-purple-400 transition-colors">プライバシーポリシー</Link></li>
              <li><Link to="/legal/compliance" className="hover:text-purple-400 transition-colors">特定商取引法に基づく表記</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2026 げむ助. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
