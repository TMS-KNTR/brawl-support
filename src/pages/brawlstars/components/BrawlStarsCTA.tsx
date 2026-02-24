
export default function BrawlStarsCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-yellow-500 to-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          今すぐBrawl Starsの代行を始めませんか？
        </h2>
        <p className="text-xl mb-8 max-w-3xl mx-auto">
          プロのプレイヤーがあなたの目標達成をサポート。
          安全・確実・最速でトロフィーアップを実現します。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button 
            onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-white text-yellow-600 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 whitespace-nowrap"
          >
            <i className="ri-shopping-cart-line mr-2"></i>
            今すぐ注文する
          </button>
          <button 
            onClick={() => window.REACT_APP_NAVIGATE('/services')}
            className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold hover:bg-white/30 transition-all duration-300 whitespace-nowrap"
          >
            <i className="ri-arrow-left-line mr-2"></i>
            サービス一覧に戻る
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">24時間</div>
            <div className="text-yellow-100">以内に開始</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">100%</div>
            <div className="text-yellow-100">安全保証</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">1000+</div>
            <div className="text-yellow-100">完了実績</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-2">最速</div>
            <div className="text-yellow-100">完了時間</div>
          </div>
        </div>
      </div>
    </section>
  );
}
