
export default function GameList() {
  const gameCategories = [
    {
      category: 'FPS・シューター',
      games: [
        {
          name: 'Valorant',
          description: 'タクティカルFPS',
          services: ['ランクアップ', 'エージェント解放', 'バトルパス進行'],
          price: '¥3,000〜',
          image: 'https://readdy.ai/api/search-image?query=Valorant%20competitive%20gameplay%20interface%20showing%20ranked%20match%20with%20tactical%20agents%2C%20purple%20and%20pink%20UI%20elements%2C%20professional%20esports%20gaming%20screen%2C%20high-quality%20FPS%20game%20graphics%20with%20weapon%20skins%20and%20abilities&width=400&height=300&seq=valorant-detail&orientation=landscape',
          popular: true,
          difficulty: 'エキスパート'
        },
        {
          name: 'Apex Legends',
          description: 'バトルロイヤル',
          services: ['ランクアップ', 'バッジ獲得', 'ダメージバッジ'],
          price: '¥2,500〜',
          image: 'https://readdy.ai/api/search-image?query=Apex%20Legends%20battle%20royale%20ranked%20gameplay%20showing%20legends%20characters%20in%20futuristic%20arena%2C%20competitive%20gaming%20interface%20with%20ranking%20system%2C%20colorful%20UI%20elements%20and%20weapon%20customization&width=400&height=300&seq=apex-detail&orientation=landscape',
          difficulty: 'アドバンス'
        },
        {
          name: 'Overwatch 2',
          description: 'ヒーローシューター',
          services: ['ランクアップ', 'ヒーロー解放', 'コンペ勝利'],
          price: '¥3,500〜',
          image: 'https://readdy.ai/api/search-image?query=Overwatch%202%20hero%20shooter%20competitive%20interface%20showing%20diverse%20heroes%20with%20unique%20abilities%2C%20team-based%20FPS%20gameplay%2C%20vibrant%20game%20graphics%20with%20futuristic%20UI%20design&width=400&height=300&seq=overwatch-detail&orientation=landscape',
          difficulty: 'アドバンス'
        }
      ]
    },
    {
      category: 'MOBA・戦略',
      games: [
        {
          name: 'League of Legends',
          description: 'MOBA',
          services: ['ランクアップ', 'チャンピオン解放', 'スキン獲得'],
          price: '¥4,000〜',
          image: 'https://readdy.ai/api/search-image?query=League%20of%20Legends%20MOBA%20gameplay%20showing%20fantasy%20champions%20with%20magical%20abilities%2C%20competitive%20ranked%20interface%2C%20detailed%20game%20UI%20with%20champion%20selection%20and%20items&width=400&height=300&seq=lol-detail&orientation=landscape',
          difficulty: 'エキスパート'
        },
        {
          name: 'Dota 2',
          description: 'MOBA',
          services: ['ランクアップ', 'アイテム獲得', 'トーナメント'],
          price: '¥4,500〜',
          image: 'https://readdy.ai/api/search-image?query=Dota%202%20MOBA%20strategic%20gameplay%20showing%20heroes%20with%20complex%20abilities%2C%20competitive%20gaming%20interface%2C%20detailed%20fantasy%20game%20graphics%20with%20items%20and%20skill%20trees&width=400&height=300&seq=dota2-detail&orientation=landscape',
          difficulty: 'エキスパート'
        }
      ]
    },
    {
      category: 'バトルロイヤル',
      games: [
        {
          name: 'Fortnite',
          description: 'バトルロイヤル',
          services: ['ビクトリーロイヤル', 'レベル上げ', 'スキン獲得'],
          price: '¥2,000〜',
          image: 'https://readdy.ai/api/search-image?query=Fortnite%20battle%20royale%20victory%20royale%20screen%20showing%20colorful%20cartoon-style%20graphics%2C%20building%20mechanics%20gameplay%2C%20competitive%20gaming%20interface%20with%20bright%20visuals&width=400&height=300&seq=fortnite-detail&orientation=landscape',
          difficulty: 'ベーシック'
        },
        {
          name: 'PUBG',
          description: 'リアル系バトロワ',
          services: ['ランクアップ', 'チキンディナー', 'スキン獲得'],
          price: '¥2,800〜',
          image: 'https://readdy.ai/api/search-image?query=PUBG%20realistic%20battle%20royale%20gameplay%20showing%20tactical%20combat%2C%20military-style%20graphics%2C%20competitive%20gaming%20interface%20with%20weapon%20customization%20and%20ranking%20system&width=400&height=300&seq=pubg-detail&orientation=landscape',
          difficulty: 'アドバンス'
        }
      ]
    },
    {
      category: 'RPG・MMO',
      games: [
        {
          name: 'Final Fantasy XIV',
          description: 'MMORPG',
          services: ['レベル上げ', 'ギル稼ぎ', 'レイド攻略'],
          price: '¥1,500〜',
          image: 'https://readdy.ai/api/search-image?query=Final%20Fantasy%20XIV%20MMORPG%20gameplay%20showing%20fantasy%20characters%20in%20beautiful%20landscapes%2C%20detailed%20RPG%20interface%2C%20magical%20abilities%20and%20epic%20raid%20battles&width=400&height=300&seq=ffxiv-detail&orientation=landscape',
          difficulty: 'ベーシック'
        },
        {
          name: 'Lost Ark',
          description: 'アクションRPG',
          services: ['レベル上げ', 'アイテム強化', 'レイド攻略'],
          price: '¥2,200〜',
          image: 'https://readdy.ai/api/search-image?query=Lost%20Ark%20action%20RPG%20gameplay%20showing%20detailed%20character%20combat%2C%20fantasy%20world%20with%20magical%20effects%2C%20MMORPG%20interface%20with%20skill%20trees%20and%20equipment&width=400&height=300&seq=lostark-detail&orientation=landscape',
          difficulty: 'アドバンス'
        }
      ]
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'ベーシック': return 'bg-green-100 text-green-800';
      case 'アドバンス': return 'bg-yellow-100 text-yellow-800';
      case 'エキスパート': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            ゲームカテゴリー別サービス
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            ジャンル別に最適化されたプロの代行サービスをご提供。
            各ゲームの特性を熟知したエキスパートが対応します。
          </p>
        </div>

        {gameCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-16">
            <div className="flex items-center mb-8">
              <div className="w-1 h-8 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full mr-4"></div>
              <h3 className="text-2xl font-bold text-gray-900">{category.category}</h3>
              <div className="flex-1 h-px bg-gray-200 ml-6"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {category.games.map((game, gameIndex) => (
                <div key={gameIndex} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group">
                  {game.popular && (
                    <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-center py-2 font-bold text-sm">
                      <i className="ri-fire-line mr-1"></i>
                      人気No.1
                    </div>
                  )}
                  
                  <div className="relative overflow-hidden">
                    <img 
                      src={game.image}
                      alt={game.name}
                      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-gray-900">
                      {game.price}
                    </div>
                    <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold ${getDifficultyColor(game.difficulty)}`}>
                      {game.difficulty}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xl font-bold text-gray-900">{game.name}</h4>
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                        {game.description}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      {game.services.map((service, serviceIndex) => (
                        <div key={serviceIndex} className="flex items-center">
                          <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center mr-3">
                            <i className="ri-check-line text-white text-xs"></i>
                          </div>
                          <span className="text-gray-700 text-sm">{service}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap">
                        <i className="ri-shopping-cart-line mr-2"></i>
                        注文する
                      </button>
                      <button className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-300">
                        <i className="ri-information-line"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="text-center mt-16 p-8 bg-white rounded-2xl shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">お探しのゲームが見つかりませんか？</h3>
          <p className="text-gray-600 mb-6">
            上記以外のゲームでも対応可能です。お気軽にご相談ください。
          </p>
          <button className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all duration-300 whitespace-nowrap">
            <i className="ri-message-3-line mr-2"></i>
            カスタム代行を相談する
          </button>
        </div>
      </div>
    </section>
  );
}
