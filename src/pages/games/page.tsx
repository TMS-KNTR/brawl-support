
import Header from '../home/components/Header';
import Footer from '../home/components/Footer';
import GameHero from './components/GameHero';
import GameList from './components/GameList';
import GameFeatures from './components/GameFeatures';
import GamePricing from './components/GamePricing';
import GameCTA from './components/GameCTA';

export default function GamesPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <GameHero />
      <GameList />
      <GameFeatures />
      <GamePricing />
      <GameCTA />
      <Footer />
    </div>
  );
}
