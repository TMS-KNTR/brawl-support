import { Helmet } from 'react-helmet-async';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import HowItWorks from './components/HowItWorks';
import FAQ from './components/FAQ';
import CTA from './components/CTA';
import Footer from './components/Footer';
import { faqs } from './data/faqs';

export default function Home() {
  return (
    <div
      className="min-h-screen bg-white text-[#1E293B] overflow-x-hidden"
      style={{ fontFamily: '"Rajdhani", sans-serif' }}
    >
      <Helmet>
        <title>げむ助 | ブロスタ代行サービス - ランク上げ・トロフィー上げ代行</title>
        <meta name="description" content="ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ・ガチバトル代行ならげむ助。クレジットカード・コンビニ決済・銀行振込対応。プロが安全・確実に目標を達成。30日間返金保証付き。" />
        <meta name="keywords" content="ブロスタ,代行,Brawl Stars,ランク上げ,トロフィー上げ,ガチバトル,ブロスタ代行,ゲーム代行,GEMUSUKE,げむ助" />
        <meta property="og:title" content="げむ助 | ブロスタ代行サービス - ランク上げ・トロフィー上げ" />
        <meta property="og:description" content="ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ代行ならげむ助。クレジットカード・コンビニ決済・銀行振込対応・30日間返金保証・匿名チャットで安心。" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://gemusuke.com" />
        <meta property="og:locale" content="ja_JP" />
        <meta property="og:site_name" content="げむ助 - ブロスタ代行サービス" />
        <meta property="og:image" content="https://gemusuke.com/og-image.png" />
        <link rel="canonical" href="https://gemusuke.com" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          "name": "げむ助",
          "alternateName": "GEMUSUKE",
          "url": "https://gemusuke.com",
          "description": "ブロスタ（Brawl Stars）のランク上げ・トロフィー上げ・ガチバトル代行サービス。クレジットカード・コンビニ決済・銀行振込対応・30日間返金保証。",
          "sameAs": []
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "ブロスタ代行サービス",
          "alternateName": "Brawl Stars Gaming Support Service",
          "description": "ブロスタのランク上げ・トロフィー上げ・ガチバトル代行。プロプレイヤーが安全・確実に目標を達成。",
          "provider": { "@type": "Organization", "name": "げむ助", "url": "https://gemusuke.com" },
          "serviceType": "ゲーム代行",
          "areaServed": "JP"
        })}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": faqs.map((faq) => ({
            "@type": "Question",
            "name": faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.a },
          })),
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
