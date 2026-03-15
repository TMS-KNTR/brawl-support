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
        <title>GEMSUKE | ゲーム代行サービス - ブロスタ代行ならGEMSUKE</title>
        <meta name="description" content="ブロスタのランク上げ・トロフィー上げ代行ならGEMSUKE。プロの代行者が安全・確実に目標を達成。安心の決済と匿名チャットで安全なお取引を提供します。" />
        <meta property="og:title" content="GEMSUKE | ゲーム代行サービス" />
        <meta property="og:description" content="ブロスタのランク上げ・トロフィー上げ代行ならGEMSUKE。プロの代行者が安全・確実に目標を達成。" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://gemsuke.com" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "GEMSUKE",
          "url": "https://gemsuke.com",
          "description": "ブロスタのランク上げ・トロフィー上げ代行サービス",
          "sameAs": []
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
              "acceptedAnswer": { "@type": "Answer", "text": "全額返金保証があります。依頼した目標が達成されなかった場合、お支払い金額を全額返金いたします。エスクロー方式を採用しているため、代行完了が確認されるまで代金は安全に保全されます。" }
            },
            {
              "@type": "Question",
              "name": "どのような支払い方法に対応していますか？",
              "acceptedAnswer": { "@type": "Answer", "text": "クレジットカード（Visa / Mastercard / JCB / AMEX）およびPayPayに対応しています。すべての決済はStripeを通じて安全に処理されます。" }
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
