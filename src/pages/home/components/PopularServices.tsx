export default function PopularServices() {
  const services = [
    {
      game: 'Apex Legends',
      image: 'https://readdy.ai/api/search-image?query=Apex%20Legends%20professional%20gameplay%20scene%20with%20vibrant%20action%2C%20dynamic%20combat%20moment%2C%20colorful%20characters%20in%20battle%2C%20futuristic%20arena%20environment%2C%20clean%20simple%20gradient%20background%20from%20purple%20to%20blue%2C%20professional%20esports%20photography%2C%20high%20quality%204k%20resolution%2C%20energetic%20atmosphere&width=600&height=400&seq=game-001&orientation=landscape',
      category: 'ランク上げ',
      price: '¥3,000〜',
      rating: 4.9,
      reviews: 1234,
      popular: true
    },
    {
      game: 'Valorant',
      image: 'https://readdy.ai/api/search-image?query=Valorant%20tactical%20shooter%20gameplay%20with%20agents%20using%20abilities%2C%20vibrant%20neon%20effects%2C%20strategic%20team%20combat%20scene%2C%20modern%20futuristic%20setting%2C%20clean%20gradient%20background%20purple%20to%20pink%2C%20professional%20gaming%20photography%2C%20ultra%20high%20definition%2C%20dynamic%20action&width=600&height=400&seq=game-002&orientation=landscape',
      category: 'ランク上げ',
      price: '¥2,500〜',
      rating: 4.8,
      reviews: 987,
      popular: true
    },
    {
      game: 'League of Legends',
      image: 'https://readdy.ai/api/search-image?query=League%20of%20Legends%20epic%20battle%20scene%20with%20champions%20casting%20spells%2C%20magical%20effects%20and%20abilities%2C%20fantasy%20MOBA%20arena%2C%20vibrant%20colorful%20environment%2C%20clean%20simple%20gradient%20background%2C%20professional%20esports%20moment%2C%204k%20quality%2C%20dramatic%20lighting&width=600&height=400&seq=game-003&orientation=landscape',
      category: 'ランク上げ',
      price: '¥4,000〜',
      rating: 4.9,
      reviews: 2156,
      popular: false
    },
    {
      game: 'Fortnite',
      image: 'https://readdy.ai/api/search-image?query=Fortnite%20battle%20royale%20action%20scene%20with%20building%20mechanics%2C%20colorful%20characters%20in%20combat%2C%20vibrant%20island%20environment%2C%20dynamic%20gameplay%20moment%2C%20clean%20gradient%20background%20blue%20to%20purple%2C%20professional%20gaming%20screenshot%2C%20high%20resolution%2C%20energetic%20atmosphere&width=600&height=400&seq=game-004&orientation=landscape',
      category: 'アイテム収集',
      price: '¥2,000〜',
      rating: 4.7,
      reviews: 856,
      popular: false
    },
    {
      game: 'Genshin Impact',
      image: 'https://readdy.ai/api/search-image?query=Genshin%20Impact%20beautiful%20anime%20style%20characters%20with%20elemental%20powers%2C%20magical%20combat%20effects%2C%20fantasy%20open%20world%20landscape%2C%20vibrant%20colorful%20scenery%2C%20clean%20simple%20gradient%20background%2C%20professional%20game%20photography%2C%204k%20resolution%2C%20stunning%20visual%20effects&width=600&height=400&seq=game-005&orientation=landscape',
      category: 'アイテム収集',
      price: '¥1,500〜',
      rating: 4.8,
      reviews: 1543,
      popular: true
    },
    {
      game: 'Call of Duty',
      image: 'https://readdy.ai/api/search-image?query=Call%20of%20Duty%20modern%20warfare%20intense%20combat%20scene%2C%20tactical%20military%20action%2C%20realistic%20weapons%20and%20equipment%2C%20dynamic%20battlefield%20moment%2C%20clean%20gradient%20background%20dark%20to%20light%2C%20professional%20FPS%20gaming%2C%20ultra%20high%20definition%2C%20cinematic%20quality&width=600&height=400&seq=game-006&orientation=landscape',
      category: 'ランク上げ',
      price: '¥3,500〜',
      rating: 4.7,
      reviews: 743,
      popular: false
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            人気の<span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">ゲーム代行</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            幅広いゲームタイトルに対応。あなたのお気に入りのゲームも見つかります
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-product-shop>
          {services.map((service, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-purple-200 hover:-translate-y-2 cursor-pointer"
            >
              <div className="relative overflow-hidden h-48">
                <img 
                  src={service.image}
                  alt={service.game}
                  className="w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-500"
                />
                {service.popular && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-sm font-semibold rounded-full">
                    人気
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                    {service.category}
                  </span>
                  <div className="flex items-center">
                    <i className="ri-star-fill text-yellow-400 text-sm mr-1"></i>
                    <span className="text-sm font-semibold text-gray-700">{service.rating}</span>
                    <span className="text-sm text-gray-500 ml-1">({service.reviews})</span>
                  </div>
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{service.game}</h3>
                
                <div className="flex items-center justify-between mt-4">
                  <div>
                    <span className="text-sm text-gray-500">料金</span>
                    <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                      {service.price}
                    </div>
                  </div>
                  <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold rounded-full hover:shadow-lg transition-all whitespace-nowrap">
                    依頼する
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-4 bg-white text-gray-700 text-lg font-semibold rounded-full hover:shadow-lg transition-all border-2 border-gray-200 hover:border-purple-300 whitespace-nowrap cursor-pointer">
            すべてのゲームを見る
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
