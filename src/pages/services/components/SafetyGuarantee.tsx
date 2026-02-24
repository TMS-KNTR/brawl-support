
export default function SafetyGuarantee() {
  const guarantees = [
    {
      icon: 'ri-lock-line',
      title: 'アカウント情報の暗号化',
      description: '最新の暗号化技術でアカウント情報を保護。第三者による不正アクセスを完全に防止します。'
    },
    {
      icon: 'ri-eye-off-line',
      title: '完全匿名システム',
      description: 'お客様の個人情報は匿名化され、代行スタッフには一切開示されません。'
    },
    {
      icon: 'ri-shield-check-line',
      title: 'BANリスク0%',
      description: '正規の手法のみを使用し、チート等は一切使用しません。BANリスクは完全に0%です。'
    },
    {
      icon: 'ri-money-dollar-circle-line',
      title: '全額返金保証',
      description: '万が一目標が達成できない場合や、ご満足いただけない場合は全額返金いたします。'
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            安全性への取り組み
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            お客様の大切なアカウントと個人情報を守るため、
            業界最高水準のセキュリティ対策を実施しています。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {guarantees.map((guarantee, index) => (
            <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mb-6">
                <i className={`${guarantee.icon} text-2xl text-white`}></i>
              </div>
              <h3 className="text-xl font-bold mb-4">{guarantee.title}</h3>
              <p className="text-gray-300 leading-relaxed">{guarantee.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <i className="ri-alarm-warning-line text-3xl text-white"></i>
            </div>
          </div>
          
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            重要なお約束
          </h3>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">0%</div>
              <div className="text-sm">BANリスク</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">100%</div>
              <div className="text-sm">情報保護</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-3xl font-bold mb-2">24時間</div>
              <div className="text-sm">監視体制</div>
            </div>
          </div>

          <p className="text-xl text-red-100 mb-8 max-w-3xl mx-auto">
            私たちは、チートツールやボット等の不正な手段は一切使用しません。
            すべて人の手による正規のプレイで目標を達成します。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-white text-red-600 rounded-full font-bold text-lg hover:bg-gray-100 transition-all duration-300 whitespace-nowrap">
              <i className="ri-file-text-line mr-2"></i>
              利用規約を確認
            </button>
            <button className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white rounded-full font-bold text-lg hover:bg-white/30 transition-all duration-300 border border-white/30 whitespace-nowrap">
              <i className="ri-shield-check-line mr-2"></i>
              セキュリティ詳細
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}