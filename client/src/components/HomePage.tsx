import { SearchBox } from './SearchBox';
import { Sparkles } from 'lucide-react';

interface HomePageProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export function HomePage({ onSearch, isLoading }: HomePageProps) {
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center px-6 ml-16"
      data-testid="home-page"
    >
      <div className="flex flex-col items-center gap-8 max-w-3xl w-full animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center animate-float"
            style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
              boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
            }}
          >
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <h1 
            className="text-3xl font-display font-bold tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #DC2626 0%, #A78BFA 50%, #DC2626 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer 3s linear infinite',
            }}
            data-testid="text-app-title"
          >
            SchoolCord
          </h1>
        </div>

        <h2 
          className="text-4xl md:text-5xl font-light text-center text-white tracking-tight"
          style={{
            textShadow: '0 0 40px rgba(255, 255, 255, 0.15)',
          }}
          data-testid="text-hero-tagline"
        >
          Explore the Web Beyond the Stars
        </h2>

        <p className="text-white/50 text-center text-lg max-w-xl">
          Browse websites, join servers, chat with friends, and explore the cosmos together. Enter any URL, search term, or server invite link to begin your journey.
        </p>

        <div className="w-full mt-4">
          <SearchBox onSearch={onSearch} isLoading={isLoading} />
        </div>

        <div className="flex items-center gap-6 mt-8">
          <QuickLink 
            label="DuckDuckGo" 
            onClick={() => onSearch('https://duckduckgo.com')} 
          />
          <QuickLink 
            label="Wikipedia" 
            onClick={() => onSearch('https://wikipedia.org')} 
          />
          <QuickLink 
            label="GitHub" 
            onClick={() => onSearch('https://github.com')} 
          />
        </div>
      </div>

      <footer className="absolute bottom-6 text-center text-white/30 text-sm">
        <p>Cloud-powered browsing - Your privacy, our priority</p>
      </footer>
    </div>
  );
}

function QuickLink({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-full text-sm text-white/60 hover:text-white transition-all duration-200 hover-elevate"
      style={{
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      data-testid={`quick-link-${label.toLowerCase()}`}
    >
      {label}
    </button>
  );
}
