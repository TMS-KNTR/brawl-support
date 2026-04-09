
export default function GameFeatures() {
  const features = [
    {
      icon: 'ri-shield-check-line',
      title: 'アカウント安全保証',
      description: 'VPN・プロキシ使用でアカウントを完全保護。安全性を最大限に確保。',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: 'ri-time-line',
      title: '24時間対応',
      description: '深夜・早朝問わず、いつでもサービス開始可能。リアルタイム進捗報告。',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: 'ri-trophy-line',
      title: 'プロゲーマー対応',
      description: '各ゲームのトップランカーが直接代行。確実な結果をお約束。',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: 'ri-speed-up-line',
      title: '最速完了',
      description: '業界最速の完了スピード。効率的なプレイで時間を大幅短縮。',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: 'ri-customer-service-line',
      title: 'チャットサポート',
      description: '専用チャットで進捗確認・質問対応。安心のサポート体制。',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      icon: 'ri-money-dollar-circle-line',
      title: '30日間返金保証',
      description: '購入後30日以内に目標未達成の場合は全額返金。リスクゼロでご利用いただけます。',
      color: 'from-red-500 to-pink-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            なぜ選ばれるのか
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            業界トップクラスの品質とサービスで、
            お客様の満足度99%を実現しています。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200 h-full">
                <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <i className={`${feature.icon} text-white text-2xl`}></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
            安心・安全・確実な代行サービス
          </h3>
          <p className="text-purple-100 text-lg mb-8 max-w-2xl mx-auto">
            厳選されたプロゲーマーによる高品質なサービスで、
            あなたのゲーミングライフをサポートします。
          </p>
          <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 whitespace-nowrap">
            <i className="ri-play-circle-line mr-2"></i>
            今すぐ始める
          </button>
        </div>
      </div>
    </section>
  );
}
