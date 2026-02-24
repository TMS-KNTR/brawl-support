
export default function ServiceFeatures() {
  const features = [
    {
      icon: 'ri-shield-check-line',
      title: '100%安全保証',
      description: 'アカウント情報は厳重に管理され、代行中も完全に安全です。万が一の場合は全額補償いたします。',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: 'ri-time-line',
      title: '最速24時間完了',
      description: '経験豊富なプロゲーマーによる効率的な代行で、最短24時間での目標達成が可能です。',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      icon: 'ri-message-3-line',
      title: 'リアルタイム報告',
      description: '専用チャットで代行の進捗状況をリアルタイムで確認できます。いつでも安心してお任せください。',
      color: 'from-purple-500 to-pink-600'
    },
    {
      icon: 'ri-medal-line',
      title: 'プロ認定スタッフ',
      description: '全スタッフが各ゲームで最高ランクを達成した実力者。確実な結果をお約束します。',
      color: 'from-yellow-500 to-orange-600'
    },
    {
      icon: 'ri-money-dollar-circle-line',
      title: '満足保証制度',
      description: '目標が達成できなかった場合は全額返金。お客様のリスクを最小限に抑えます。',
      color: 'from-red-500 to-pink-600'
    },
    {
      icon: 'ri-customer-service-2-line',
      title: '24時間サポート',
      description: '代行中の疑問や不安にも24時間体制でサポート。いつでもお気軽にご相談ください。',
      color: 'from-indigo-500 to-purple-600'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            安心・安全の代行サービス
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            お客様に安心してご利用いただけるよう、徹底した品質管理と
            充実したサポート体制を整えています。
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <i className={`${feature.icon} text-2xl text-white`}></i>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
            まだ不安がありますか？
          </h3>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            無料相談で詳しいサービス内容をご説明いたします。
            お気軽にお問い合わせください。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-purple-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 whitespace-nowrap">
              <i className="ri-phone-line mr-2"></i>
              無料相談を予約
            </button>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 whitespace-nowrap">
              <i className="ri-question-line mr-2"></i>
              よくある質問
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}