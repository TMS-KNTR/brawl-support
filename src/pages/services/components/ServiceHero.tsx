
export default function ServiceHero() {
  return (
    <section 
      className="relative py-20 lg:py-32 overflow-hidden"
      style={{
        backgroundImage: `url('https://readdy.ai/api/search-image?query=Professional%20gaming%20setup%20with%20multiple%20monitors%20displaying%20competitive%20games%20like%20Valorant%20and%20Apex%20Legends%2C%20modern%20gaming%20chair%2C%20RGB%20lighting%2C%20clean%20minimalist%20background%20with%20purple%20and%20pink%20gradient%20lighting%20effects%2C%20high-tech%20gaming%20environment%2C%20esports%20atmosphere%2C%204K%20resolution&width=1920&height=800&seq=service-hero&orientation=landscape')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-purple-900/90 via-purple-800/80 to-pink-900/90"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            プロによる
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              ゲーム代行サービス
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            あなたの時間を有効活用しながら、憧れのランクや実績を手に入れませんか？
            経験豊富なプロゲーマーが、安全かつ確実にあなたの目標を達成します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-bold text-lg hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap">
              <i className="ri-play-circle-line mr-2"></i>
              サービスを見る
            </button>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 whitespace-nowrap">
              <i className="ri-phone-line mr-2"></i>
              無料相談
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}