
export default function GamePricing() {
  const pricingTiers = [
    {
      name: 'ベーシック',
      description: '基本的な代行サービス',
      price: '¥2,000',
      period: '〜',
      features: [
        'ランクアップ代行',
        '基本的な進捗報告',
        'チャットサポート',
        '7日間保証'
      ],
      color: 'from-gray-500 to-gray-600',
      popular: false
    },
    {
      name: 'プレミアム',
      description: '最も人気のプラン',
      price: '¥4,000',
      period: '〜',
      features: [
        'ランクアップ代行',
        'アイテム・スキン獲得',
        'リアルタイム進捗報告',
        'チャットサポート',
        '14日間保証',
        '優先対応'
      ],
      color: 'from-purple-600 to-pink-600',
      popular: true
    },
    {
      name: 'エキスパート',
      description: 'プロ仕様の完全サービス',
      price: '¥8,000',
      period: '〜',
      features: [
        '全サービス対応',
        'トップランカー対応',
        '24時間サポート',
        'カスタムプラン',
        '30日間保証',
        '最優先対応',
        '専属担当者'
      ],
      color: 'from-yellow-500 to-orange-600',
      popular: false
    }
  ];

  const gameSpecificPricing = [
    {
      game: 'Valorant',
      services: [
        { name: 'アイアン → ブロンズ', price: '¥3,000' },
        { name: 'ブロンズ → シルバー', price: '¥4,500' },
        { name: 'シルバー → ゴールド', price: '¥6,000' },
        { name: 'ゴールド → プラチナ', price: '¥8,500' },
        { name: 'プラチナ → ダイヤ', price: '¥12,000' },
        { name: 'ダイヤ → イモータル', price: '¥18,000' }
      ]
    },
    {
      game: 'Apex Legends',
      services: [
        { name: 'ブロンズ → シルバー', price: '¥2,500' },
        { name: 'シルバー → ゴールド', price: '¥4,000' },
        { name: 'ゴールド → プラチナ', price: '¥6,500' },
        { name: 'プラチナ → ダイヤ', price: '¥10,000' },
        { name: 'ダイヤ → マスター', price: '¥15,000' },
        { name: 'マスター → プレデター', price: '¥25,000' }
      ]
    },
    {
      game: 'League of Legends',
      services: [
        { name: 'アイアン → ブロンズ', price: '¥4,000' },
        { name: 'ブロンズ → シルバー', price: '¥5,500' },
        { name: 'シルバー → ゴールド', price: '¥7,500' },
        { name: 'ゴールド → プラチナ', price: '¥10,000' },
        { name: 'プラチナ → ダイヤ', price: '¥15,000' },
        { name: 'ダイヤ → マスター', price: '¥22,000' }
      ]
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            料金プラン
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            お客様のニーズに合わせた柔軟な料金設定。
            明確な価格で安心してご利用いただけます。
          </p>
        </div>

        {/* プラン比較 */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {pricingTiers.map((tier, index) => (
            <div key={index} className={`relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${tier.popular ? 'ring-2 ring-purple-500 scale-105' : ''}`}>
              {tier.popular && (
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center py-2 font-bold text-sm">
                  <i className="ri-star-line mr-1"></i>
                  最人気
                </div>
              )}
              
              <div className="p-8">
                <div className={`w-16 h-16 bg-gradient-to-r ${tier.color} rounded-2xl flex items-center justify-center mb-6 mx-auto`}>
                  <i className="ri-gamepad-line text-white text-2xl"></i>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
                  {tier.name}
                </h3>
                <p className="text-gray-600 text-center mb-6">
                  {tier.description}
                </p>
                
                <div className="text-center mb-8">
                  <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                  <span className="text-gray-600 ml-1">{tier.period}</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button className={`w-full py-3 bg-gradient-to-r ${tier.color} text-white rounded-xl font-bold hover:opacity-90 transition-all duration-300 whitespace-nowrap`}>
                  <i className="ri-shopping-cart-line mr-2"></i>
                  プランを選択
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ゲーム別料金表 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            ゲーム別料金表
          </h3>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {gameSpecificPricing.map((gameData, index) => (
              <div key={index} className="border border-gray-200 rounded-xl p-6">
                <h4 className="text-xl font-bold text-gray-900 mb-4 text-center">
                  {gameData.game}
                </h4>
                
                <div className="space-y-3">
                  {gameData.services.map((service, serviceIndex) => (
                    <div key={serviceIndex} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <span className="text-gray-700 text-sm">{service.name}</span>
                      <span className="font-bold text-purple-600">{service.price}</span>
                    </div>
                  ))}
                </div>
                
                <button className="w-full mt-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap">
                  <i className="ri-calculator-line mr-2"></i>
                  見積もり依頼
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">
            上記以外のランクやサービスについてもお気軽にお問い合わせください
          </p>
          <button className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all duration-300 whitespace-nowrap">
            <i className="ri-message-3-line mr-2"></i>
            カスタム見積もり
          </button>
        </div>
      </div>
    </section>
  );
}
