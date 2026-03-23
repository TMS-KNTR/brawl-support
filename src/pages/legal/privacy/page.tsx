import { useNavigate } from 'react-router-dom';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>

          <p className="text-sm text-gray-500 mb-8 border-l-2 border-gray-300 pl-4">
            げむ助（以下「当サービス」）は、ユーザーの個人情報を適切に保護し安全に管理いたします。
            本ポリシーでは個人情報の収集、利用、保護について説明します。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第1条（収集する情報）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスでは以下の情報を収集します。</p>
            <p>・<strong>アカウント情報</strong> — メールアドレス、ユーザー名</p>
            <p>・<strong>注文情報</strong> — 注文内容、ゲームアカウント情報（代行に必要な範囲のみ）</p>
            <p>・<strong>決済情報</strong> — Stripe社を通じた決済記録（クレジットカード・PayPay等の情報は当サービスでは保存しません）</p>
            <p>・<strong>チャット情報</strong> — サービス内でのメッセージ内容</p>
            <p>・<strong>利用ログ</strong> — アクセス日時、IPアドレス、ブラウザ情報</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第2条（利用目的）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>収集した情報は以下の目的で利用します。</p>
            <p>・サービスの提供・運営</p>
            <p>・本人確認、不正利用の防止</p>
            <p>・お問い合わせへの対応</p>
            <p>・料金の請求・決済処理</p>
            <p>・紛争・トラブルの解決</p>
            <p>・サービスの改善・新機能の開発</p>
            <p>・重要なお知らせの送付</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第3条（第三者への提供）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供しません。</p>
            <p>・法令に基づく場合</p>
            <p>・人の生命・身体・財産の保護に必要な場合</p>
            <p>・決済処理に必要な範囲でStripe社に提供する場合</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第4条（決済情報の取扱い）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスではStripe社の決済システムを利用しています。</p>
            <p>・クレジットカード・PayPay等の決済情報は当サービスのサーバーには一切保存されません</p>
            <p>・すべての決済情報はStripe社により安全に管理されます</p>
            <p>・PCI DSS準拠の高いセキュリティ基準で保護されています</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第5条（情報の保護）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスでは以下の対策を実施しています。</p>
            <p>・SSL暗号化通信の使用</p>
            <p>・アカウント情報の暗号化保存</p>
            <p>・チャットでの個人情報交換の自動検知・警告</p>
            <p>・不正アクセスの監視</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第6条（ゲームアカウント情報の取扱い）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>代行に必要なゲームアカウント情報は以下のように管理します。</p>
            <p>・代行作業に必要な最小限の情報のみ代行者に開示します</p>
            <p>・作業完了後、速やかにアクセス権を無効化することを推奨します</p>
            <p>・ゲームアカウント情報はサービス外で利用しません</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第7条（Cookieの使用）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>当サービスでは以下の目的でCookieを使用します。</p>
            <p>・ログイン状態の維持</p>
            <p>・ユーザー設定の保存</p>
            <p>Cookieの使用を希望されない場合はブラウザの設定で無効にできます。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第8条（個人情報の開示・訂正・削除）</h2>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>ユーザーは自己の個人情報について、以下を請求できます。</p>
            <p>・開示：保有する個人情報の内容確認</p>
            <p>・訂正：誤った情報の修正</p>
            <p>・削除：アカウント削除による個人情報の消去</p>
            <p>ご請求は gemusuke.official@gmail.com までご連絡ください。</p>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第9条（ポリシーの変更）</h2>
          <p className="text-gray-700 mb-6">
            本ポリシーは法令の変更やサービス内容の変更に伴い、予告なく改定する場合があります。
            変更後のポリシーはサイト上に掲載した時点から効力を生じます。
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">第10条（お問い合わせ）</h2>
          <div className="text-gray-700 mb-6 space-y-1">
            <p>げむ助 運営</p>
            <p>メール：gemusuke.official@gmail.com</p>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <button onClick={() => navigate('/legal/terms')} className="text-purple-600 hover:underline">
              利用規約
            </button>
            <button onClick={() => navigate('/legal/compliance')} className="text-purple-600 hover:underline">
              特定商取引法に基づく表記
            </button>
          </div>

          <div className="mt-8 text-right text-gray-500 text-sm">
            <p>制定日：2026年2月18日</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
