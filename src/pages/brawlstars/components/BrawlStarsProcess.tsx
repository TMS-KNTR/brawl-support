
export default function BrawlStarsProcess() {
  const steps = [
    {
      step: '01',
      title: 'ご注文',
      description: 'フォームから希望するサービスと目標を入力',
      icon: 'ri-shopping-cart-line',
      details: [
        '現在のトロフィー数を入力',
        '目標トロフィー数を設定',
        'ご希望の完了期間を選択',
        '特別な要望があれば記載'
      ]
    },
    {
      step: '02',
      title: 'お支払い',
      description: '安全な決済システムでお支払い完了',
      icon: 'ri-secure-payment-line',
      details: [
        'クレジットカード決済',
        'PayPal対応',
        '銀行振込可能',
        '100%安全保証'
      ]
    },
    {
      step: '03',
      title: 'アカウント連携',
      description: '安全な方法でアカウント情報を共有',
      icon: 'ri-shield-check-line',
      details: [
        'セキュアな情報共有',
        'アカウント保護設定',
        '専用チャットルーム作成',
        '担当プレイヤー決定'
      ]
    },
    {
      step: '04',
      title: '代行開始',
      description: 'プロプレイヤーが代行を開始',
      icon: 'ri-gamepad-line',
      details: [
        'プロプレイヤーがプレイ開始',
        'リアルタイム進捗報告',
        '安全なプレイスタイル',
        '24時間サポート対応'
      ]
    },
    {
      step: '05',
      title: '完了報告',
      description: '目標達成後、詳細レポートをお渡し',
      icon: 'ri-check-double-line',
      details: [
        '目標達成の確認',
        '詳細プレイレポート',
        'アカウント返却',
        '満足度確認'
      ]
    }
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
            サービス利用の流れ
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            簡単5ステップで安全・確実にBrawl Starsの代行サービスをご利用いただけます。
          </p>
        </div>

        <div className="relative">
          {/* 接続線 */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="text-center">
                  {/* ステップ番号 */}
                  <div className="relative z-10 w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-white font-bold text-lg">{step.step}</span>
                  </div>
                  
                  {/* アイコン */}
                  <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <i className={`${step.icon} text-xl text-gray-700`}></i>
                  </div>
                  
                  {/* タイトル */}
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                  
                  {/* 説明 */}
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  
                  {/* 詳細リスト */}
                  <div className="text-left">
                    {step.details.map((detail, detailIndex) => (
                      <div key={detailIndex} className="flex items-center mb-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                        <span className="text-sm text-gray-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">安全保証について</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-shield-check-line text-white text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-gray-900">アカウント保護</div>
                  <div className="text-sm text-gray-600">100%安全保証</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-customer-service-line text-white text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-gray-900">24時間サポート</div>
                  <div className="text-sm text-gray-600">いつでも相談可能</div>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mr-4">
                  <i className="ri-refund-line text-white text-xl"></i>
                </div>
                <div>
                  <div className="font-bold text-gray-900">返金保証</div>
                  <div className="text-sm text-gray-600">満足いただけない場合</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
