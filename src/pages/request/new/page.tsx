import { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';
import ProtectedRoute from '../../../components/base/ProtectedRoute';

export default function NewRequestPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    payment_amount: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      alert('ログインが必要です');
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.payment_amount) {
      alert('すべての項目を入力してください');
      return;
    }

    const paymentAmount = parseFloat(formData.payment_amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      alert('正しい金額を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          payment_amount: paymentAmount,
          reward: Math.floor(paymentAmount * 0.8), // 80%を報酬として設定
          status: 'open'
        });

      if (error) throw error;

      setShowSuccess(true);
      setFormData({
        title: '',
        description: '',
        payment_amount: ''
      });

      // 3秒後にダッシュボードに移動
      setTimeout(() => {
        window.REACT_APP_NAVIGATE('/dashboard/customer');
      }, 3000);

    } catch (error: any) {
      console.error('送信エラー:', error);
      alert(error.message || '送信に失敗しました。再度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateReward = () => {
    const amount = parseFloat(formData.payment_amount);
    return isNaN(amount) ? 0 : Math.floor(amount * 0.8);
  };

  return (
    <ProtectedRoute allowedRoles={['client', 'admin']}>
      <div className="min-h-screen bg-gray-50">
        <Header />
        
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">新規依頼投稿</h1>
            <p className="text-gray-600">代行を依頼したい内容を詳しく記載してください</p>
          </div>

          {showSuccess ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-check-line text-2xl text-green-600"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">依頼完了</h2>
              <p className="text-gray-600 mb-4">
                依頼が正常に投稿されました。代行者からの応募をお待ちください。
              </p>
              <p className="text-sm text-gray-500">
                3秒後にダッシュボードに移動します...
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="例：Brawl Stars ランク代行をお願いします"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    内容 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="依頼内容を詳しく記載してください。&#10;例：&#10;- 現在のランク：ブロンズ3&#10;- 目標ランク：シルバー1&#10;- 希望期間：1週間以内&#10;- その他の要望など"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="payment_amount" className="block text-sm font-medium text-gray-700 mb-2">
                    支払金額 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">¥</span>
                    <input
                      type="number"
                      id="payment_amount"
                      name="payment_amount"
                      value={formData.payment_amount}
                      onChange={handleInputChange}
                      placeholder="5000"
                      min="100"
                      step="100"
                      className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                  {formData.payment_amount && (
                    <p className="mt-2 text-sm text-gray-600">
                      代行者への報酬: ¥{calculateReward().toLocaleString()} 
                      <span className="text-gray-500">（手数料20%を差し引いた金額）</span>
                    </p>
                  )}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <i className="ri-information-line text-blue-600 mr-2 mt-0.5"></i>
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">ご注意</p>
                      <ul className="space-y-1">
                        <li>• 支払金額の80%が代行者への報酬となります</li>
                        <li>• 依頼投稿後、代行者からの応募をお待ちください</li>
                        <li>• 代行者が決定後、チャットで詳細を相談できます</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => window.REACT_APP_NAVIGATE('/dashboard/customer')}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isSubmitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin mr-2"></i>
                        投稿中...
                      </>
                    ) : (
                      <>
                        <i className="ri-send-plane-line mr-2"></i>
                        依頼を投稿
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </ProtectedRoute>
  );
}
