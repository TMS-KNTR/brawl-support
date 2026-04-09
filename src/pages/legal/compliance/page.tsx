import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Header from '../../home/components/Header';
import Footer from '../../home/components/Footer';

export default function CompliancePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Helmet>
        <title>特定商取引法に基づく表記 | げむ助 - ゲームスキルマッチングプラットフォーム</title>
        <meta name="description" content="げむ助の特定商取引法に基づく表記。運営者情報、支払方法、返品・キャンセルポリシー等を掲載しています。" />
        <meta property="og:title" content="特定商取引法に基づく表記 | げむ助" />
        <meta property="og:description" content="げむ助の特定商取引法に基づく表記。運営者情報、支払方法、返品・キャンセルポリシー。" />
        <meta property="og:url" content="https://gemusuke.com/legal/compliance" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:image" content="https://gemusuke.com/og-image.png" />
        <link rel="canonical" href="https://gemusuke.com/legal/compliance" />
      </Helmet>
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
                  <td className="px-6 py-4 text-gray-900">決済完了後、提供者が受注次第開始（目安：受注から1〜7日で完了。注文内容により変動します）。役務期間は注文確定日から最大30日間です。</td>
                </tr>
                <tr className="border-b border-gray-200">
                  <td className="bg-gray-100 px-6 py-4 font-semibold text-gray-700">返品・キャンセル</td>
                  <td className="px-6 py-4 text-gray-900">
                    <p>・作業開始前：全額返金</p>
                    <p>・提供者都合による中止：全額返金</p>
                    <p>・目標未達成（購入後30日以内）：全額返金</p>
                    <p>・作業開始後のお客様都合：進捗状況に応じて部分返金を検討</p>
                    <p>・やむを得ない事情による中止：進捗状況に応じて部分返金または再作業で対応</p>
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

          <h2 className="text-2xl font-semibold text-gray-900 mt-12 mb-4">サービスに関する注意事項</h2>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">プラットフォームの性質</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・当サービスは、ゲームに関するスキルを持つユーザーとそれを必要とするユーザーをつなぐマッチングプラットフォームです</p>
            <p>・ユーザー間の取引内容・方法はユーザー間で決定されるものであり、当サービスはその詳細について関知しません</p>
            <p>・当サービスはゲーム運営会社とは一切関係ありません</p>
            <p>・サービスの利用にあたっては、利用規約をご確認の上、ご自身の判断と責任においてご利用ください</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">安心してご利用いただくために</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・<strong>30日間返金保証</strong> — 目標未達成の場合は全額返金</p>
            <p>・<strong>安全な決済</strong> — UnivaPay決済で安心のお支払い</p>
            <p>・<strong>紛争解決サポート</strong> — 万が一の問題にも運営が仲裁対応</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">年齢制限</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・未成年者の方は親権者等の法定代理人の同意が必要です</p>
            <p>・13歳未満の方はサービスをご利用いただけません</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">お客様相談窓口</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>サービスに関するご不満・ご相談は、以下の窓口までお気軽にご連絡ください。</p>
            <p>・<strong>メール</strong>：<a href="mailto:gemusuke.official@gmail.com" className="text-purple-600 hover:underline">gemusuke.official@gmail.com</a></p>
            <p>・<strong>受付時間</strong>：24時間受付（順次対応）</p>
            <p className="text-sm text-gray-500 mt-2">※お問い合わせの際は、注文番号をお知らせいただくとスムーズに対応できます</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">返金・紛争解決の流れ</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>万が一サービスにご満足いただけなかった場合、以下の手順で対応いたします。カード会社へのお問い合わせの前に、まず当サービスにご連絡ください。</p>
            <p><strong>ステップ1</strong>：チャット機能またはメールでお問い合わせ</p>
            <p><strong>ステップ2</strong>：当事者間での話し合い（チャット機能をご利用ください）</p>
            <p><strong>ステップ3</strong>：解決しない場合、紛争申立機能から運営に仲裁を依頼</p>
            <p><strong>ステップ4</strong>：運営が双方の主張を確認し、返金・再作業等の措置を決定</p>
            <p className="text-sm text-gray-500 mt-2">※30日間の返金保証期間内であれば、目標未達成の場合は全額返金いたします</p>
            <p className="text-sm text-gray-500">※返金処理は通常5〜10営業日で完了します</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">紛争解決の管轄</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>上記の手続きで解決しない場合、運営者所在地を管轄する裁判所にて解決するものとします。</p>
          </div>

          <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">禁止事項</h3>
          <div className="text-gray-700 mb-6 space-y-2">
            <p>・チャットでの個人情報（電話番号、SNS ID等）の交換（ただし、取引に必要な情報の共有は除く）</p>
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
            <p>最終改定日：2026年4月9日</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
