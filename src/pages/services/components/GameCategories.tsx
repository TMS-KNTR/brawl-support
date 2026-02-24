
export default function GameCategories() {
  const games = [
    {
      name: 'Brawl Stars',
      description: 'トロフィー上げ・ブローラー解放代行',
      features: ['トロフィー上げ', 'ブローラー解放', 'ランクアップ'],
      price: '¥2,000〜',
      image: 'https://readdy.ai/api/search-image?query=Brawl%20Stars%20mobile%20game%20interface%20showing%20colorful%20cartoon%20characters%20in%20battle%20arena%2C%20competitive%20trophy%20pushing%20gameplay%2C%20vibrant%20game%20graphics%20with%20brawlers%20and%20power-ups%2C%20professional%20mobile%20gaming%20setup&width=400&height=300&seq=brawlstars-service&orientation=landscape',
      popular: true,
      available: true
    },
    {
      name: 'Valorant',
      description: 'ランク上げ・アンロック代行',
      features: ['近日対応予定'],
      price: 'Coming Soon...',
      image: 'https://readdy.ai/api/search-image?query=Valorant%20game%20interface%20showing%20competitive%20ranked%20gameplay%2C%20tactical%20FPS%20game%20screen%20with%20agents%20and%20weapons%2C%20modern%20gaming%20UI%20with%20purple%20and%20pink%20accents%2C%20professional%20esports%20gaming%20setup%2C%20high-quality%20game%20graphics&width=400&height=300&seq=valorant-service&orientation=landscape',
      popular: false,
      available: false
    },
    {
      name: 'Apex Legends',
      description: 'ランク・バッジ獲得代行',
      features: ['近日対応予定'],
      price: 'Coming Soon...',
      image: 'https://readdy.ai/api/search-image?query=Apex%20Legends%20battle%20royale%20gameplay%20showing%20ranked%20interface%2C%20futuristic%20battle%20arena%20with%20legends%20characters%2C%20competitive%20gaming%20screen%20with%20ranking%20system%2C%20professional%20gaming%20setup%20with%20colorful%20UI%20elements&width=400&height=300&seq=apex-service&orientation=landscape',
      available: false
    },
    {
      name: 'League of Legends',
      description: 'ランク・チャンピオン習得',
      features: ['近日対応予定'],
      price: 'Coming Soon...',
      image: 'https://readdy.ai/api/search-image?query=League%20of%20Legends%20MOBA%20game%20interface%20showing%20ranked%20gameplay%2C%20fantasy%20champions%20and%20magical%20abilities%2C%20competitive%20gaming%20screen%20with%20detailed%20UI%2C%20professional%20esports%20gaming%20environment&width=400&height=300&seq=lol-service&orientation=landscape',
      available: false
    },
    {
      name: 'Overwatch 2',
      description: 'ランク・ヒーロー解放',
      features: ['近日対応予定'],
      price: 'Coming Soon...',
      image: 'https://readdy.ai/api/search-image?query=Overwatch%202%20hero%20shooter%20gameplay%20showing%20competitive%20interface%2C%20futuristic%20heroes%20with%20unique%20abilities%2C%20team-based%20FPS%20game%20screen%2C%20professional%20gaming%20setup%20with%20vibrant%20game%20graphics&width=400&height=300&seq=overwatch-service&orientation=landscape',
      available: false
    },
    {
      name: 'Fortnite',
      description: 'ビクロイ・レベル上げ代行',
      features: ['近日対応予定'],
      price: 'Coming Soon...',
      image: 'https://readdy.ai/api/search-image?query=Fortnite%20battle%20royale%20game%20showing%20victory%20royale%20screen%2C%20colorful%20cartoon-style%20graphics%20with%20building%20mechanics%2C%20competitive%20gaming%20interface%2C%20professional%20gaming%20setup%20with%20bright%20game%20visuals&width=400&height=300&seq=fortnite-service&orientation=landscape',
      available: false
    }
  ];

  const handleGameClick = (game: any) => {
    if (game.available) {
      window.REACT_APP_NAVIGATE('/games/brawl-stars');
    }
  };

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            対応ゲーム一覧
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            現在はBrawl Starsに特化したプロの代行サービスを提供しています。
            その他のゲームも順次対応予定です。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.map((game, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group ${
                game.available ? 'cursor-pointer' : 'opacity-60'
              }`}
              onClick={() => handleGameClick(game)}
            >
              {game.popular && game.available && (
                <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white text-center py-2 font-bold text-sm">
                  <i className="ri-fire-line mr-1"></i>
                  対応中
                </div>
              )}
              
              {!game.available && (
                <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-center py-2 font-bold text-sm">
                  <i className="ri-time-line mr-1"></i>
                  Coming Soon...
                </div>
              )}
              
              <div className="relative overflow-hidden">
                <img 
                  src={game.image}
                  alt={game.name}
                  className={`w-full h-48 object-cover transition-transform duration-300 ${
                    game.available ? 'group-hover:scale-110' : 'grayscale'
                  }`}
                />
                <div className={`absolute top-4 right-4 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold ${
                  game.available ? 'bg-white/90 text-gray-900' : 'bg-gray-500/90 text-white'
                }`}>
                  {game.price}
                </div>
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{game.name}</h3>
                <p className="text-gray-600 mb-4">{game.description}</p>
                
                <div className="space-y-2 mb-6">
                  {game.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-3 ${
                        game.available ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                        <i className={`text-white text-xs ${
                          game.available ? 'ri-check-line' : 'ri-time-line'
                        }`}></i>
                      </div>
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`w-full py-3 rounded-xl font-bold transition-all duration-300 whitespace-nowrap ${
                    game.available 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={!game.available}
                >
                  {game.available ? (
                    <>
                      <i className="ri-shopping-cart-line mr-2"></i>
                      詳細を見る
                    </>
                  ) : (
                    <>
                      <i className="ri-lock-line mr-2"></i>
                      準備中
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-6">現在はBrawl Starsに特化してサービスを提供中</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.REACT_APP_NAVIGATE('/games/brawl-stars')}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap"
            >
              <i className="ri-gamepad-line mr-2"></i>
              Brawl Stars代行を見る
            </button>
            <button className="px-8 py-4 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-all duration-300 whitespace-nowrap">
              <i className="ri-message-3-line mr-2"></i>
              その他ゲームをリクエスト
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
