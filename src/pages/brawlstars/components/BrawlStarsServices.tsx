
export default function BrawlStarsServices() {
  const services = [
    {
      icon: 'ri-trophy-line',
      title: 'トロフィー上げ',
      description: '目標トロフィー数まで確実にランクアップ',
      features: [
        '現在のトロフィー数から目標まで',
        '安全なプレイスタイル',
        '進捗リアルタイム報告',
        'アカウント保護完備'
      ],
      price: '¥100/トロフィー',
      popular: true
    },
    {
      icon: 'ri-user-star-line',
      title: 'ブローラー解放',
      description: '新しいブローラーの解放とレベルアップ',
      features: [
        '指定ブローラーの解放',
        'レベル上げ代行',
        'スキン獲得サポート',
        'ギア装備最適化'
      ],
      price: '¥2,000〜',
      popular: false
    },
    {
      icon: 'ri-medal-line',
      title: 'ランクアップ',
      description: 'ブローラーのランク上げとマスタリー',
      features: [
        'ランク25〜35達成',
        'マスタリーポイント獲得',
        '最適な戦略でプレイ',
        '負け数最小化'
      ],
      price: '¥500/ランク',
      popular: false
    },
    {
      icon: 'ri-gift-line',
      title: 'シーズン報酬',
      description: 'シーズンパス完走とボックス開封',
      features: [
        'シーズンパス完走',
        'ボックス最適開封',
        'イベント報酬獲得',
        'コイン・ジェム効率化'
      ],
      price: '¥3,000〜',
      popular: false
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            Brawl Stars代行サービス一覧
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            プロのプレイヤーがあなたの目標達成をサポート。
            安全・確実・最速でゲーム進行をお手伝いします。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group border border-gray-100"
            >
              {service.popular && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-center py-2 font-bold text-sm">
                  <i className="ri-fire-line mr-1"></i>
                  人気No.1
                </div>
              )}
              
              <div className="p-6">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${service.icon} text-2xl text-white`}></i>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 mb-4">{service.description}</p>
                
                <div className="space-y-2 mb-6">
                  {service.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-check-line text-white text-xs"></i>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t pt-4">
                  <div className="text-2xl font-bold text-gray-900 mb-4">{service.price}</div>
                  <button 
                    onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300 whitespace-nowrap"
                  >
                    <i className="ri-shopping-cart-line mr-2"></i>
                    注文する
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
