
export default function ServiceCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            あなたの目標を
            <span className="block text-yellow-300">今すぐ現実に</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-purple-100 mb-12 leading-relaxed">
            時間をかけずに憧れのランクや実績を手に入れませんか？
            プロによる確実で安全な代行サービスで、ゲームライフをもっと楽しく。
          </p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">最短24時間</div>
              <div className="text-purple-200">スピード完了</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">98%</div>
              <div className="text-purple-200">成功率</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="text-3xl font-bold text-white mb-2">100%</div>
              <div className="text-purple-200">安全保証</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button className="px-10 py-5 bg-white text-purple-600 rounded-full font-bold text-xl hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg whitespace-nowrap">
              <i className="ri-rocket-line mr-3"></i>
              今すぐ申し込む
            </button>
            <button className="px-10 py-5 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold text-xl hover:bg-white/30 transition-all duration-300 border-2 border-white/30 whitespace-nowrap">
              <i className="ri-phone-line mr-3"></i>
              無料相談予約
            </button>
          </div>

          <div className="mt-12 text-center">
            <p className="text-purple-200 mb-4">
              <i className="ri-time-line mr-2"></i>
              今なら初回利用20%OFF キャンペーン実施中！
            </p>
            <div className="flex items-center justify-center space-x-6 text-purple-200">
              <div className="flex items-center">
                <i className="ri-shield-check-line mr-2"></i>
                <span>安全保証</span>
              </div>
              <div className="flex items-center">
                <i className="ri-money-dollar-circle-line mr-2"></i>
                <span>全額返金</span>
              </div>
              <div className="flex items-center">
                <i className="ri-customer-service-2-line mr-2"></i>
                <span>24時間サポート</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}