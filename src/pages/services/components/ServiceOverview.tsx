
export default function ServiceOverview() {
  const services = [
    {
      id: 'gachi-battle',
      title: 'ガチバトル',
      subtitle: '本気の勝負をプロが代行',
      description: 'ランク戦やコンペティティブモードで勝利を重ね、あなたの理想のランクまで確実に押し上げます。プロの戦略と技術で、効率的にランクアップを実現。',
      features: [
        '高勝率でのランクアップ保証',
        '戦略的なチーム連携',
        '最新メタの完全理解',
        '24時間以内の開始対応'
      ],
      price: '¥3,000〜',
      duration: '1試合〜',
      image: 'https://readdy.ai/api/search-image?query=Intense%20competitive%20gaming%20scene%20with%20professional%20esports%20player%20focused%20on%20screen%20showing%20ranked%20match%20in%20Valorant%20or%20Apex%20Legends%2C%20dramatic%20lighting%20with%20purple%20and%20blue%20tones%2C%20gaming%20headset%2C%20mechanical%20keyboard%2C%20concentrated%20expression%2C%20victory%20celebration%20background&width=600&height=400&seq=gachi-battle&orientation=landscape',
      gradient: 'from-red-500 to-pink-600',
      bgGradient: 'from-red-50 to-pink-50'
    },
    {
      id: 'trophy-boost',
      title: 'トロ上げ',
      subtitle: 'トロフィー・実績解除の専門家',
      description: '難易度の高いトロフィーや実績を効率的に解除。時間のかかる作業系から高難易度のスキル系まで、あらゆるトロフィーに対応します。',
      features: [
        '100%解除保証',
        '最短ルートでの攻略',
        '進捗状況のリアルタイム報告',
        '複数ゲーム同時対応可能'
      ],
      price: '¥1,500〜',
      duration: '1個〜',
      image: 'https://readdy.ai/api/search-image?query=Gaming%20achievement%20unlock%20screen%20with%20golden%20trophy%20icons%20and%20completion%20badges%2C%20PlayStation%20or%20Xbox%20achievement%20interface%2C%20celebratory%20effects%20with%20sparkles%20and%20confetti%2C%20gaming%20controller%20in%20foreground%2C%20warm%20golden%20lighting&width=600&height=400&seq=trophy-boost&orientation=landscape',
      gradient: 'from-yellow-500 to-orange-600',
      bgGradient: 'from-yellow-50 to-orange-50'
    },
    {
      id: 'top-ranker',
      title: 'トップランカー',
      subtitle: '最高峰への挑戦',
      description: 'プレデター、イモータル、チャレンジャーなど、各ゲームの最高ランクを目指します。トップ1%の世界を体験し、真のエリートプレイヤーの証を手に入れましょう。',
      features: [
        '最高ランク到達保証',
        '元プロゲーマーによる代行',
        '専用チームでの集中対応',
        'VIP待遇での優先サポート'
      ],
      price: '¥15,000〜',
      duration: '1週間〜',
      image: 'https://readdy.ai/api/search-image?query=Elite%20gaming%20rank%20display%20showing%20highest%20tier%20like%20Predator%20or%20Immortal%20rank%20with%20glowing%20effects%2C%20premium%20gaming%20setup%20with%20multiple%20monitors%2C%20professional%20esports%20environment%2C%20golden%20and%20diamond%20rank%20badges%2C%20luxurious%20gaming%20chair&width=600&height=400&seq=top-ranker&orientation=landscape',
      gradient: 'from-purple-600 to-indigo-700',
      bgGradient: 'from-purple-50 to-indigo-50'
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            選べる3つの
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              プレミアムサービス
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            あなたの目標に合わせて最適なサービスをお選びください。
            すべてのサービスで満足度保証と安全性を約束します。
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <div 
              key={service.id}
              className={`relative bg-gradient-to-br ${service.bgGradient} rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group`}
            >
              {/* 人気バッジ */}
              {index === 0 && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                    <i className="ri-fire-line mr-1"></i>
                    人気No.1
                  </span>
                </div>
              )}

              {/* サービス画像 */}
              <div className="relative mb-6 rounded-2xl overflow-hidden">
                <img 
                  src={service.image}
                  alt={service.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className={`absolute inset-0 bg-gradient-to-t ${service.gradient} opacity-20 group-hover:opacity-30 transition-opacity duration-300`}></div>
              </div>

              {/* サービス情報 */}
              <div className="space-y-4">
                <div>
                  <h3 className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r ${service.gradient} mb-2`}>
                    {service.title}
                  </h3>
                  <p className="text-gray-600 font-medium">{service.subtitle}</p>
                </div>

                <p className="text-gray-700 leading-relaxed">
                  {service.description}
                </p>

                {/* 特徴リスト */}
                <div className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-700">
                      <i className="ri-check-line text-green-500 mr-2 font-bold"></i>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* 料金情報 */}
                <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">{service.price}</span>
                    <span className="text-gray-600 ml-1">/ {service.duration}</span>
                  </div>
                  <button className={`px-6 py-3 bg-gradient-to-r ${service.gradient} text-white rounded-full font-bold hover:shadow-lg transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}>
                    <i className="ri-arrow-right-line mr-1"></i>
                    詳細を見る
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 比較表 */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            サービス比較表
          </h3>
          
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-bold">項目</th>
                    <th className="px-6 py-4 text-center font-bold">ガチバトル</th>
                    <th className="px-6 py-4 text-center font-bold">トロ上げ</th>
                    <th className="px-6 py-4 text-center font-bold">トップランカー</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">対応ゲーム</td>
                    <td className="px-6 py-4 text-center">FPS・MOBA</td>
                    <td className="px-6 py-4 text-center">全ジャンル</td>
                    <td className="px-6 py-4 text-center">競技性ゲーム</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">所要時間</td>
                    <td className="px-6 py-4 text-center">1-3日</td>
                    <td className="px-6 py-4 text-center">数時間-1週間</td>
                    <td className="px-6 py-4 text-center">1-4週間</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">難易度</td>
                    <td className="px-6 py-4 text-center">★★★☆☆</td>
                    <td className="px-6 py-4 text-center">★★☆☆☆</td>
                    <td className="px-6 py-4 text-center">★★★★★</td>
                  </tr>
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">保証</td>
                    <td className="px-6 py-4 text-center">
                      <i className="ri-check-line text-green-500"></i>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <i className="ri-check-line text-green-500"></i>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <i className="ri-check-line text-green-500"></i>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
