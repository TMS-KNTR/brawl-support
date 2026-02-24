
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import ServiceHero from './components/ServiceHero';
import ServiceOverview from './components/ServiceOverview';
import GameCategories from './components/GameCategories';
import ServiceFeatures from './components/ServiceFeatures';
import ProcessFlow from './components/ProcessFlow';
import SafetyGuarantee from './components/SafetyGuarantee';
import ServiceCTA from './components/ServiceCTA';

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <ServiceHero />
      <ServiceOverview />
      <GameCategories />
      <ServiceFeatures />
      <ProcessFlow />
      <SafetyGuarantee />
      <ServiceCTA />
      <Footer />
    </div>
  );
}