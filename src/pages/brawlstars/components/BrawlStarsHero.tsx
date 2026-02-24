
export default function BrawlStarsHero() {
  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Brawl%20Stars%20epic%20battle%20arena%20with%20colorful%20cartoon%20characters%20fighting%2C%20vibrant%20game%20environment%20with%20power-ups%20and%20trophies%2C%20professional%20mobile%20gaming%20championship%20atmosphere%2C%20dynamic%20action%20scene%20with%20brawlers%20in%20combat&width=1920&height=1080&seq=brawlstars-hero&orientation=landscape')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="mb-8">
          <span className="inline-block bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-6 py-2 rounded-full font-bold text-sm mb-6">
            <i className="ri-fire-line mr-2"></i>
            Brawl Stars専門代行サービス
          </span>
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
            Brawl Stars
          </span>
          <br />
          プロ代行サービス
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
          トロフィー上げ・ブローラー解放・ランクアップを
          <br />
          プロのプレイヤーが安全・確実に代行します
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button 
            onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-full font-bold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 whitespace-nowrap"
          >
            <i className="ri-shopping-cart-line mr-2"></i>
            今すぐ注文する
          </button>
          <button 
            onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all duration-300 whitespace-nowrap"
          >
            <i className="ri-price-tag-3-line mr-2"></i>
            料金を見る
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">1000+</div>
            <div className="text-gray-300">完了実績</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">24時間</div>
            <div className="text-gray-300">サポート</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">100%</div>
            <div className="text-gray-300">安全保証</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">最速</div>
            <div className="text-gray-300">完了時間</div>
          </div>
        </div>
      </div>
    </section>
  );
}
