import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';

export default function Home() {
  return (
    <div
      className="min-h-screen bg-white text-[#1E293B] overflow-x-hidden"
      style={{ fontFamily: '"Rajdhani", sans-serif' }}
    >
      <Helmet>
        <title>げむ助 | ブロスタ代行サービス - ランク上げ・トロフィー上げ代行</title>
        <meta name="description" content="ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ・ガチバトル代行ならげむ助。クレカ・コンビニ・銀行振込対応。プロの代行者が安全・確実に目標を達成。30日間返金保証付き。" />
        <meta name="keywords" content="ブロスタ,代行,Brawl Stars,ランク上げ,トロフィー上げ,ガチバトル,ブロスタ代行,ゲーム代行,GEMUSUKE,げむ助" />
        <meta property="og:title" content="げむ助 | ブロスタ代行サービス - ランク上げ・トロフィー上げ" />
        <meta property="og:description" content="ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ代行ならげむ助。クレカ・コンビニ・銀行振込対応・30日間返金保証・匿名チャットで安心。" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="げむ助 - ブロスタ代行サービス" />
        <meta property="og:image" content="https://gemsuke.vercel.app/og-image.png" />
        <link rel="canonical" href="https://gemsuke.com" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "げむ助",
          "alternateName": "GEMUSUKE",
          "url": "https://gemsuke.com",
          "description": "ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ・ガチバトル代行サービス。クレカ・コンビニ・銀行振込対応・30日間返金保証。",
          "sameAs": []
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "ブロスタ代行サービス",
          "alternateName": "Brawl Stars Boosting Service",
          "description": "ブロスタのランク上げ・トロフィー上げ・ガチバトル代行。プロプレイヤーが安全・確実に目標を達成。",
          "provider": { "@type": "Organization", "name": "げむ助", "url": "https://gemsuke.com" },
          "serviceType": "ゲーム代行",
          "areaServed": "JP"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "アカウント情報は安全ですか？",
              "acceptedAnswer": { "@type": "Answer", "text": "はい。アカウント情報は暗号化された専用チャットのみでやり取りされ、サーバーに保存されません。代行完了後はチャット履歴も削除可能です。" }
            },
            {
              "@type": "Question",
              "name": "目標が達成できなかった場合、返金はできますか？",
              "acceptedAnswer": { "@type": "Answer", "text": "30日間の返金保証があります。購入後30日以内に依頼した目標が達成されなかった場合、お支払い金額を全額返金いたします。代行完了が確認されるまで代金は安全に保管されます。" }
            },
            {
              "@type": "Question",
              "name": "どのような支払い方法に対応していますか？",
              "acceptedAnswer": { "@type": "Answer", "text": "クレジットカード（Visa / Mastercard / JCB / AMEX）、コンビニ決済、銀行振込に対応しています。すべての決済はUnivaPayを通じて安全に処理されます。" }
            },
            {
              "@type": "Question",
              "name": "依頼からどのくらいで完了しますか？",
              "acceptedAnswer": { "@type": "Answer", "text": "依頼内容により異なりますが、多くの場合24〜72時間以内に完了します。受注後はチャットでリアルタイムに進捗が共有されます。" }
            },
            {
              "@type": "Question",
              "name": "個人情報は必要ですか？",
              "acceptedAnswer": { "@type": "Answer", "text": "一切不要です。ユーザー間のやり取りはすべて匿名チャットで行われ、本名・住所・電話番号などの個人情報を公開する必要はありません。" }
            },
            {
              "@type": "Question",
              "name": "依頼後にアカウントは使えますか？",
              "acceptedAnswer": { "@type": "Answer", "text": "代行期間中はアカウントをご利用いただけません。代行者がログインして作業を行うため、完了までアカウントの使用はお控えください。完了後は通常通りご利用いただけます。" }
            }
          ]
        })}</script>
      </Helmet>
      <Header />
      <Hero />
      <Features />
      <HowItWorks />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}
