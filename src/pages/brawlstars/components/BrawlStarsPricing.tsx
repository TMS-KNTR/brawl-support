
import { useState } from 'react';

export default function BrawlStarsPricing() {
  const [selectedService, setSelectedService] = useState('trophy');

  const pricingPlans = {
    trophy: [
      {
        name: 'ライト',
        description: '少しだけトロフィーを上げたい方',
        price: '¥2,000',
        trophies: '500〜1,000',
        features: [
          '500〜1,000トロフィー',
          '1〜3日で完了',
          '進捗報告',
          'アカウント保護'
        ],
        popular: false
      },
      {
        name: 'スタンダード',
        description: '本格的にランクアップしたい方',
        price: '¥5,000',
        trophies: '1,000〜3,000',
        features: [
          '1,000〜3,000トロフィー',
          '3〜7日で完了',
          'リアルタイム進捗',
          '24時間サポート',
          'ボーナス報酬'
        ],
        popular: true
      },
      {
        name: 'プレミアム',
        description: 'トップランカーを目指す方',
        price: '¥10,000',
        trophies: '3,000〜5,000+',
        features: [
          '3,000〜5,000+トロフィー',
          '7〜14日で完了',
          '専属プロプレイヤー',
          '優先サポート',
          '戦略レポート付き',
          '追加ボーナス'
        ],
        popular: false
      }
    ],
    brawler: [
      {
        name: 'ベーシック',
        description: '特定ブローラーの解放',
        price: '¥2,000',
        trophies: '1体解放',
        features: [
          '指定ブローラー1体',
          'レベル1まで',
          '1〜2日で完了',
          'アカウント保護'
        ],
        popular: false
      },
      {
        name: 'アドバンス',
        description: '複数ブローラー + レベル上げ',
        price: '¥6,000',
        trophies: '3体解放 + Lv9',
        features: [
          'ブローラー3体解放',
          'レベル9まで強化',
          'ギア装備',
          '3〜5日で完了',
          '24時間サポート'
        ],
        popular: true
      },
      {
        name: 'コンプリート',
        description: '全ブローラー解放パック',
        price: '¥15,000',
        trophies: '全ブローラー',
        features: [
          '全ブローラー解放',
          'レベル11まで強化',
          'ギア・スターパワー',
          '7〜14日で完了',
          '専属サポート',
          'スキン獲得サポート'
        ],
        popular: false
      }
    ]
  };

  const serviceTypes = [
    { id: 'trophy', name: 'トロフィー上げ', icon: 'ri-trophy-line' },
    { id: 'brawler', name: 'ブローラー解放', icon: 'ri-user-star-line' }
  ];

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            料金プラン
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            あなたの目標に合わせて最適なプランをお選びください。
            全プラン安全保証・進捗報告付きです。
          </p>

          <div className="flex justify-center mb-12">
            <div className="bg-white rounded-full p-1 shadow-lg">
              {serviceTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedService(type.id)}
                  className={`px-6 py-3 rounded-full font-bold transition-all duration-300 whitespace-nowrap ${
                    selectedService === type.id
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <i className={`${type.icon} mr-2`}></i>
                  {type.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans[selectedService as keyof typeof pricingPlans].map((plan, index) => (
            <div 
              key={index}
              className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${
                plan.popular ? 'ring-2 ring-yellow-500 transform scale-105' : ''
              }`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-center py-3 font-bold">
                  <i className="ri-star-line mr-2"></i>
                  最人気プラン
                </div>
              )}
              
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">{plan.price}</div>
                  <div className="text-yellow-600 font-bold">{plan.trophies}</div>
                </div>
                
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <i className="ri-check-line text-white text-sm"></i>
                      </div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <button 
                  onClick={() => document.getElementById('order-form')?.scrollIntoView({ behavior: 'smooth' })}
                  className={`w-full py-4 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                    plan.popular
                      ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  <i className="ri-shopping-cart-line mr-2"></i>
                  このプランを選ぶ
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">カスタムプランをご希望の場合</p>
          <button className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-all duration-300 shadow-lg whitespace-nowrap">
            <i className="ri-message-3-line mr-2"></i>
            カスタム見積もりを依頼
          </button>
        </div>
      </div>
    </section>
  );
}
