import { useNavigate } from 'react-router-dom';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function CompliancePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>

          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden mb-12">
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700 w-1/3">販売業者（屋号）</td>
                  <td className="px-6 py-4 text-gray-900">げむ助</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">運営責任者</td>
                  <td className="px-6 py-4 text-gray-900">請求があった場合に遅滞なく開示いたします</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">所在地</td>
                  <td className="px-6 py-4 text-gray-900">請求があった場合に遅滞なく開示いたします</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">連絡先メール</td>
                  <td className="px-6 py-4 text-gray-900">gemusuke.official@gmail.com</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">電話番号</td>
                  <td className="px-6 py-4 text-gray-900">請求があった場合に遅滞なく開示いたします</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">販売価格</td>
                  <td className="px-6 py-4 text-gray-900">各サービスページに表示された価格（税込）</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">商品代金以外の必要料金</td>
                  <td className="px-6 py-4 text-gray-900">なし（決済手数料は当社が負担）</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">支払方法</td>
                  <td className="px-6 py-4 text-gray-900">クレジットカード（UnivaPay決済）</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">支払時期</td>
                  <td className="px-6 py-4 text-gray-900">注文確定時に前払い</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">サービス提供時期</td>
                  <td className="px-6 py-4 text-gray-900">決済完了後、代行者が受注次第開始（目安：受注から1〜7日で完了。注文内容により変動します）。役務期間は注文確定日から最大30日間です。</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">返品・キャンセル</td>
                  <td className="px-6 py-4 text-gray-900">
                    <p>・作業開始前：全額返金</p>
                    <p>・代行者都合による中止：全額返金</p>
                    <p>・目標未達成（購入後30日以内）：全額返金</p>
                    <p>・作業開始後のお客様都合：返金不可</p>
                    <p>・アカウントBAN等のゲーム側措置による中止：返金不可</p>
                    <p className="text-gray-500 text-xs mt-1">※返金保証期間は購入後30日以内です</p>
                    <p className="text-gray-500 text-xs">※返金処理に係る手数料は当サービスが負担します</p>
                  </td>
                </tr>
                <tr>
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">動作環境</td>
                  <td className="px-6 py-4 text-gray-900">Chrome / Safari / Edge 最新版推奨</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">コンプライアンス・注意事項</h2>

          <p className="text-sm text-gray-500 mb-8 border-l-2 border-gray-300 pl-4">
            本サービスはゲーム代行サービスであり、対象ゲームの利用規約に抵触する可能性があります。
            利用は完全に自己責任となり、アカウントBANなどのリスクを十分ご理解の上ご利用ください。
          </p>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">ゲーム規約との関係</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・代行サービスはSupercell社のBrawl Stars利用規約に抵触する可能性があります</p>
            <p>・アカウント共有は多くのゲームで禁止されている行為です</p>
            <p>・規約違反によりアカウントが永久停止される可能性があります</p>
            <p>・当サービスはゲーム会社と一切関係なく、規約解釈や回避方法の助言は行いません</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">お客様が負うリスク</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・<strong>アカウント停止・BAN</strong> — ゲーム運営会社による永久停止の可能性</p>
            <p>・<strong>データ損失</strong> — ゲーム内アイテム、進行状況の消失</p>
            <p>・<strong>金銭的損失</strong> — 課金アイテムや時間投資の無効化</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">年齢制限</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・未成年者の方は親権者等の法定代理人の同意が必要です</p>
            <p>・13歳未満の方はサービスをご利用いただけません</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">紛争解決</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>1. 当事者間でのチャットによる話し合い</p>
            <p>2. 運営による仲裁</p>
            <p>3. それでも解決しない場合、運営者所在地を管轄する裁判所にて解決</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">禁止事項</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・チャットでの個人情報（電話番号、SNS ID等）の交換（ただし、代行作業に必要なゲームアカウント情報・アカウント共有用メールアドレスの共有は除く）</p>
            <p>・プラットフォーム外での直接取引</p>
            <p>・虚偽情報による登録や取引</p>
            <p>・他ユーザーへの嫌がらせや脅迫</p>
            <p>・システムの不正利用</p>
            <p>・複数アカウントの作成</p>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <button onClick={() => navigate('/legal/terms')} className="text-purple-600 hover:underline">
              利用規約
            </button>
            <button onClick={() => navigate('/legal/privacy')} className="text-purple-600 hover:underline">
              プライバシーポリシー
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
