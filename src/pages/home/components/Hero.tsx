import { useAuth } from '../../../contexts/AuthContext';

export default function Hero() {
  const { user } = useAuth();

  const handleCreateOrder = () => {
    if (user) {
      window.REACT_APP_NAVIGATE('/order/new');
    } else {
      window.REACT_APP_NAVIGATE('/register');
    }
  };

  const handleJoinAsWorker = () => {
    if (user) {
      window.REACT_APP_NAVIGATE('/dashboard/worker');
    } else {
      window.REACT_APP_NAVIGATE('/register');
    }
  };

  return (
    <section 
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://readdy.ai/api/search-image?query=Professional%20gaming%20setup%20with%20Brawl%20Stars%20game%20interface%20on%20multiple%20monitors%2C%20modern%20esports%20environment%20with%20purple%20and%20blue%20lighting%2C%20high-tech%20gaming%20room%20with%20clean%20minimalist%20design%2C%20professional%20competitive%20gaming%20atmosphere&width=1920&height=1080&seq=hero-bg&orientation=landscape')`
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Brawl Stars
            </span>
            <br />
            <span className="text-white">代行サービス</span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-gray-200 leading-relaxed">
            安全・匿名・前払い決済で信頼できるランク代行
            <br />
            プロの代行者があなたの目標ランクまでサポート
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button
              onClick={handleCreateOrder}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-full text-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 whitespace-nowrap"
            >
              <i className="ri-add-circle-line mr-2"></i>
              依頼を作成
            </button>
            
            <button
              onClick={handleJoinAsWorker}
              className="bg-white/10 backdrop-blur-sm text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white/20 transition-all duration-200 border border-white/20 whitespace-nowrap"
            >
              <i className="ri-user-star-line mr-2"></i>
              代行者として参加
            </button>
          </div>

          {/* 3ステップ */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-file-text-line text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">1. 依頼作成</h3>
              <p className="text-gray-300">現在ランクと目標ランクを選択して依頼を作成</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-secure-payment-line text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">2. 安全決済</h3>
              <p className="text-gray-300">Stripe決済でエスクロー風の安全な前払い</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-trophy-line text-2xl text-white"></i>
              </div>
              <h3 className="text-xl font-semibold mb-2">3. 代行完了</h3>
              <p className="text-gray-300">プロの代行者が匿名チャットで進捗報告</p>
            </div>
          </div>

          {/* 信頼表示 */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-300">
            <div className="flex items-center">
              <i className="ri-shield-check-line mr-2 text-green-400"></i>
              Stripe決済
            </div>
            <div className="flex items-center">
              <i className="ri-user-forbid-line mr-2 text-blue-400"></i>
              完全匿名
            </div>
            <div className="flex items-center">
              <i className="ri-refund-line mr-2 text-yellow-400"></i>
              返金保証
            </div>
            <button
              onClick={() => window.REACT_APP_NAVIGATE('/compliance')}
              className="flex items-center hover:text-white transition-colors cursor-pointer"
            >
              <i className="ri-file-shield-line mr-2 text-purple-400"></i>
              コンプライアンス
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
