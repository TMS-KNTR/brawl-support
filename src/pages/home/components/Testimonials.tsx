export default function Testimonials() {
  const testimonials = [
    {
      name: '田中 健太',
      age: 19,
      game: 'Apex Legends',
      rating: 5,
      comment: '仕事が忙しくてランク上げができなかったけど、プロの方に依頼したら3日でダイヤモンドまで上げてくれました!チャットで進捗も教えてくれて安心でした。',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20male%20gamer%20portrait%2C%20casual%20gaming%20style%2C%20friendly%20smile%2C%20modern%20headphones%2C%20simple%20clean%20gradient%20background%20purple%20to%20blue%2C%20professional%20photography%2C%20high%20quality%2C%20natural%20lighting&width=200&height=200&seq=avatar-001&orientation=squarish',
      date: '2024年1月15日'
    },
    {
      name: '佐藤 美咲',
      age: 17,
      game: 'Genshin Impact',
      rating: 5,
      comment: 'イベント限定アイテムが欲しかったけど時間がなくて...。依頼したら全部集めてくれて本当に助かりました!料金も明確で安心して使えます。',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20female%20gamer%20portrait%2C%20cute%20gaming%20style%2C%20bright%20smile%2C%20gaming%20headset%2C%20simple%20clean%20gradient%20background%20pink%20to%20purple%2C%20professional%20photography%2C%20high%20quality%2C%20soft%20lighting&width=200&height=200&seq=avatar-002&orientation=squarish',
      date: '2024年1月12日'
    },
    {
      name: '山田 翔太',
      age: 22,
      game: 'Valorant',
      rating: 5,
      comment: 'プロの立ち回りを見て勉強したかったので、画面共有しながらやってもらいました。めちゃくちゃ参考になったし、ランクも上がって一石二鳥!',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20male%20esports%20player%20portrait%2C%20professional%20gaming%20style%2C%20confident%20expression%2C%20gaming%20glasses%2C%20simple%20clean%20gradient%20background%20blue%20to%20cyan%2C%20professional%20photography%2C%20high%20quality%2C%20studio%20lighting&width=200&height=200&seq=avatar-003&orientation=squarish',
      date: '2024年1月10日'
    },
    {
      name: '鈴木 あかり',
      age: 20,
      game: 'League of Legends',
      rating: 5,
      comment: '初めて代行サービスを使ったけど、丁寧に対応してくれて不安はすぐになくなりました。目標のゴールドに到達できて嬉しいです!',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20female%20streamer%20portrait%2C%20cheerful%20gaming%20style%2C%20happy%20expression%2C%20colorful%20gaming%20setup%2C%20simple%20clean%20gradient%20background%20purple%20to%20pink%2C%20professional%20photography%2C%20high%20quality%2C%20vibrant%20lighting&width=200&height=200&seq=avatar-004&orientation=squarish',
      date: '2024年1月8日'
    },
    {
      name: '高橋 大輝',
      age: 18,
      game: 'Fortnite',
      rating: 5,
      comment: 'シーズン報酬が欲しかったけど間に合わなそうで焦ってました。依頼したら期限内に達成してくれて本当に感謝!また使います!',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20male%20teenager%20gamer%20portrait%2C%20energetic%20gaming%20style%2C%20excited%20expression%2C%20gaming%20headphones%2C%20simple%20clean%20gradient%20background%20orange%20to%20red%2C%20professional%20photography%2C%20high%20quality%2C%20dynamic%20lighting&width=200&height=200&seq=avatar-005&orientation=squarish',
      date: '2024年1月5日'
    },
    {
      name: '伊藤 さくら',
      age: 21,
      game: 'Call of Duty',
      rating: 5,
      comment: 'FPSが苦手だけどフレンドと一緒にプレイしたくて...。ランク上げてもらったおかげで楽しくプレイできるようになりました!',
      avatar: 'https://readdy.ai/api/search-image?query=Young%20Japanese%20female%20gamer%20portrait%2C%20sweet%20gaming%20style%2C%20gentle%20smile%2C%20pink%20gaming%20headset%2C%20simple%20clean%20gradient%20background%20pink%20to%20lavender%2C%20professional%20photography%2C%20high%20quality%2C%20warm%20lighting&width=200&height=200&seq=avatar-006&orientation=squarish',
      date: '2024年1月3日'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            利用者の<span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">声</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            実際にGameBoostを利用した方々のリアルな感想
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="flex items-center mb-6">
                <img 
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover object-top mr-4"
                />
                <div>
                  <h4 className="text-lg font-bold text-gray-900">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.age}歳 · {testimonial.game}</p>
                </div>
              </div>

              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <i key={i} className="ri-star-fill text-yellow-400 text-lg"></i>
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                {testimonial.comment}
              </p>

              <div className="text-sm text-gray-400">
                {testimonial.date}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 bg-white rounded-full shadow-md">
            <i className="ri-star-fill text-yellow-400 text-2xl mr-2"></i>
            <span className="text-2xl font-bold text-gray-900 mr-2">4.9</span>
            <span className="text-gray-600">/ 5.0 (3,500件以上のレビュー)</span>
          </div>
        </div>
      </div>
    </section>
  );
}
