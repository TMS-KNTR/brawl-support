
export default function GameHero() {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Professional%20gaming%20setup%20with%20multiple%20monitors%20showing%20various%20popular%20competitive%20games%20like%20Valorant%20Apex%20Legends%20League%20of%20Legends%2C%20RGB%20gaming%20keyboard%20and%20mouse%2C%20high-end%20gaming%20chair%2C%20neon%20lighting%20effects%2C%20modern%20gaming%20room%20with%20purple%20and%20blue%20ambient%20lighting%2C%20esports%20tournament%20atmosphere&width=1920&height=1080&seq=games-hero-bg&orientation=landscape')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
            対応ゲーム
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              完全網羅
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-200 mb-12 leading-relaxed">
            人気の競技ゲームから最新タイトルまで、プロゲーマーが
            <br className="hidden md:block" />
            あなたの目標達成をサポートします
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap shadow-lg">
              <i className="ri-gamepad-line mr-2"></i>
              ゲーム一覧を見る
            </button>
            <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 whitespace-nowrap border border-white/20">
              <i className="ri-message-3-line mr-2"></i>
              カスタム相談
            </button>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">50+</div>
              <div className="text-gray-300">対応ゲーム</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">24h</div>
              <div className="text-gray-300">サポート</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">99%</div>
              <div className="text-gray-300">成功率</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">1000+</div>
              <div className="text-gray-300">実績</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <i className="ri-arrow-down-line text-white text-2xl"></i>
      </div>
    </section>
  );
}
