export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'サービスを選択',
      description: 'ランク上げ、アイテム収集、ミッション攻略など、お好きなサービスを選択します。',
      icon: 'ri-search-line'
    },
    {
      number: '02',
      title: '依頼内容を入力',
      description: '目標ランク、希望納期、予算などの詳細を入力。自動で料金が計算されます。',
      icon: 'ri-edit-line'
    },
    {
      number: '03',
      title: 'プロを選択',
      description: 'レビューや実績を確認して、信頼できるプロゲーマーを選択します。',
      icon: 'ri-user-star-line'
    },
    {
      number: '04',
      title: '安全に決済',
      description: 'クレジットカードやコンビニ払いなど、お好きな方法で安全に決済できます。',
      icon: 'ri-secure-payment-line'
    },
    {
      number: '05',
      title: '進捗を確認',
      description: 'チャットで進捗をリアルタイムに確認。質問や要望もいつでも伝えられます。',
      icon: 'ri-chat-check-line'
    },
    {
      number: '06',
      title: '完了・評価',
      description: '目標達成後、サービスを評価。満足できなければ返金保証もあります。',
      icon: 'ri-checkbox-circle-line'
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            <span className="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">簡単3ステップ</span>で始められる
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            初めての方でも安心。わずか数分で依頼完了
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all h-full">
                <div className="flex items-start mb-6">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-pink-500 rounded-2xl flex items-center justify-center">
                      <i className={`${step.icon} text-2xl text-white`}></i>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-5xl font-bold text-gray-100 leading-none">{step.number}</div>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <i className="ri-arrow-right-line text-3xl text-purple-300"></i>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-lg font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all whitespace-nowrap cursor-pointer">
            今すぐ無料登録
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
