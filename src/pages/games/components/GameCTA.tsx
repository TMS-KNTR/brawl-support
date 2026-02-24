
export default function GameCTA() {
  return (
    <section 
      className="relative py-20 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6)), url('https://readdy.ai/api/search-image?query=Professional%20esports%20gaming%20tournament%20arena%20with%20multiple%20gaming%20setups%2C%20RGB%20lighting%20effects%2C%20competitive%20gaming%20atmosphere%2C%20modern%20gaming%20chairs%20and%20monitors%2C%20purple%20and%20blue%20neon%20lighting%2C%20high-tech%20gaming%20environment&width=1920&height=600&seq=games-cta-bg&orientation=landscape')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
          今すぐ始めよう
        </h2>
        <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
          プロゲーマーによる確実なサービスで、
          あなたの目標を最短で達成しましょう
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-shield-check-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">安全保証</h3>
            <p className="text-gray-300">アカウントBANリスク0%</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-trophy-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">確実な結果</h3>
            <p className="text-gray-300">プロによる代行サービス</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ri-time-line text-white text-2xl"></i>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">24時間対応</h3>
            <p className="text-gray-300">いつでもサポート</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap shadow-lg">
            <i className="ri-gamepad-line mr-2"></i>
            代行を依頼する
          </button>
          <button className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-white/20 transition-all duration-300 whitespace-nowrap border border-white/20">
            <i className="ri-question-line mr-2"></i>
            よくある質問
          </button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-300 mb-4">お急ぎの方はお電話でも受付中</p>
          <div className="flex items-center justify-center">
            <i className="ri-phone-line text-white text-xl mr-2"></i>
            <span className="text-white text-xl font-bold">0120-XXX-XXX</span>
          </div>
        </div>
      </div>
    </section>
  );
}
