export default function CTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
          今すぐゲームライフを<br className="sm:hidden" />レベルアップ
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
          無料登録で500円分のクーポンプレゼント中!<br />
          初めての方でも安心してご利用いただけます
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="w-full sm:w-auto px-8 py-4 bg-white text-purple-600 text-lg font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all whitespace-nowrap cursor-pointer">
            無料で始める
            <i className="ri-arrow-right-line ml-2"></i>
          </button>
          <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-white text-lg font-semibold rounded-full border-2 border-white hover:bg-white/10 transition-all whitespace-nowrap cursor-pointer">
            サービスを見る
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
          <div className="flex items-center">
            <i className="ri-check-line text-2xl mr-2"></i>
            <span>登録無料</span>
          </div>
          <div className="flex items-center">
            <i className="ri-check-line text-2xl mr-2"></i>
            <span>クレジットカード不要</span>
          </div>
          <div className="flex items-center">
            <i className="ri-check-line text-2xl mr-2"></i>
            <span>即日対応可能</span>
          </div>
        </div>
      </div>
    </section>
  );
}
