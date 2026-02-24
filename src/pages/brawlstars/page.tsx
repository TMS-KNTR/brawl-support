
import BrawlStarsHero from './components/BrawlStarsHero';
import BrawlStarsServices from './components/BrawlStarsServices';
import BrawlStarsPricing from './components/BrawlStarsPricing';
import BrawlStarsProcess from './components/BrawlStarsProcess';
import BrawlStarsOrderForm from './components/BrawlStarsOrderForm';
import BrawlStarsCTA from './components/BrawlStarsCTA';

export default function BrawlStarsPage() {
  return (
    <div className="min-h-screen">
      <BrawlStarsHero />
      <BrawlStarsServices />
      <BrawlStarsPricing />
      <BrawlStarsProcess />
      <BrawlStarsOrderForm />
      <BrawlStarsCTA />
    </div>
  );
}
