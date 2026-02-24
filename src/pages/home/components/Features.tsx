export default function Features() {
  const features = [
    {
      icon: 'ri-shield-check-fill',
      title: '安全・安心',
      description: 'アカウント情報は厳重に管理。万が一の場合も返金保証付きで安心してご利用いただけます。',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: 'ri-time-fill',
      title: '24時間対応',
      description: 'いつでもどこでも依頼可能。深夜・早朝でもプロゲーマーが迅速に対応します。',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: 'ri-star-fill',
      title: 'プロの技術',
      description: '厳選された経験豊富なプロゲーマーのみが在籍。確実な結果をお約束します。',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: 'ri-money-dollar-circle-fill',
      title: '明確な料金',
      description: '追加料金なし。事前に料金が確定するので、安心してご依頼いただけます。',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: 'ri-chat-3-fill',
      title: 'リアルタイム報告',
      description: 'チャット機能で進捗をリアルタイムに確認。いつでも質問や相談が可能です。',
      color: 'from-indigo-500 to-purple-500'
    },
    {
      icon: 'ri-trophy-fill',
      title: '実績保証',
      description: '目標達成まで徹底サポート。達成できなかった場合は全額返金いたします。',
      color: 'from-yellow-500 to-orange-500'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            選ばれる<span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">6つの理由</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            GameBoostが多くのゲーマーに支持される理由
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent hover:-translate-y-2"
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <i className={`${feature.icon} text-3xl text-white`}></i>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
