
export default function ProcessFlow() {
  const steps = [
    {
      number: '01',
      title: 'お申し込み',
      description: 'ゲームタイトルと目標を選択してお申し込み。簡単な入力フォームで完了します。',
      icon: 'ri-edit-line',
      color: 'from-blue-500 to-cyan-600'
    },
    {
      number: '02',
      title: '料金お支払い',
      description: '安全な決済システムで料金をお支払い。各種クレジットカードに対応しています。',
      icon: 'ri-secure-payment-line',
      color: 'from-green-500 to-emerald-600'
    },
    {
      number: '03',
      title: 'アカウント情報',
      description: '専用の暗号化システムでアカウント情報を安全に共有。完全匿名で管理されます。',
      icon: 'ri-shield-keyhole-line',
      color: 'from-purple-500 to-pink-600'
    },
    {
      number: '04',
      title: '代行開始',
      description: 'プロゲーマーが代行を開始。専用チャットで進捗状況をリアルタイムで確認できます。',
      icon: 'ri-play-circle-line',
      color: 'from-orange-500 to-red-600'
    },
    {
      number: '05',
      title: '進捗報告',
      description: '代行中の詳細な進捗レポートを定期的に受け取り。いつでも現在の状況を把握できます。',
      icon: 'ri-bar-chart-line',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      number: '06',
      title: '完了・お渡し',
      description: '目標達成後、アカウントを安全にお返し。満足いただけない場合は全額返金いたします。',
      icon: 'ri-trophy-line',
      color: 'from-yellow-500 to-orange-600'
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            ご利用の流れ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            シンプルで安全な6ステップで、あなたの目標を確実に達成します。
            初めての方でも安心してご利用いただけます。
          </p>
        </div>

        <div className="relative">
          {/* Connection Lines */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-purple-200 to-orange-200"></div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Step Number Circle */}
                <div className={`w-16 h-16 bg-gradient-to-r ${step.color} rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 shadow-lg`}>
                  <span className="text-white font-bold text-lg">{step.number}</span>
                </div>

                {/* Content Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center group">
                  <div className={`w-12 h-12 bg-gradient-to-r ${step.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <i className={`${step.icon} text-xl text-white`}></i>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Mobile Connection Line */}
                {index < steps.length - 1 && (
                  <div className="lg:hidden flex justify-center mt-8 mb-8">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-gray-300 to-gray-200"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-8 md:p-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              今すぐ始めませんか？
            </h3>
            <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
              簡単な手続きで、プロによる高品質な代行サービスをご利用いただけます。
              まずは無料相談からお気軽にどうぞ。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-bold text-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 whitespace-nowrap">
                <i className="ri-rocket-line mr-2"></i>
                今すぐ申し込む
              </button>
              <button className="px-8 py-4 bg-white text-gray-700 rounded-full font-bold text-lg hover:bg-gray-50 transition-all duration-300 border border-gray-300 whitespace-nowrap">
                <i className="ri-calculator-line mr-2"></i>
                料金を計算する
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}