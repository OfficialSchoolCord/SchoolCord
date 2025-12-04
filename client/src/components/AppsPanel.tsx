import { X, Globe, Search, BookOpen, Film, Music, ShoppingBag, Newspaper, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AppsPanelProps {
  onNavigate: (url: string) => void;
  onClose: () => void;
}

const quickApps = [
  { id: 'google', name: 'Google', url: 'https://google.com', icon: Search, color: '#4285F4' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: Search, color: '#DE5833' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://wikipedia.org', icon: BookOpen, color: '#000000' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', icon: Code, color: '#6e5494' },
  { id: 'reddit', name: 'Reddit', url: 'https://reddit.com', icon: Globe, color: '#FF4500' },
  { id: 'hackernews', name: 'Hacker News', url: 'https://news.ycombinator.com', icon: Newspaper, color: '#FF6600' },
  { id: 'amazon', name: 'Amazon', url: 'https://amazon.com', icon: ShoppingBag, color: '#FF9900' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: Film, color: '#FF0000' },
  { id: 'spotify', name: 'Spotify', url: 'https://spotify.com', icon: Music, color: '#1DB954' },
];

export function AppsPanel({ onNavigate, onClose }: AppsPanelProps) {
  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="apps-panel"
    >
      <Card 
        className="w-full max-w-2xl border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Quick Apps</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-close-apps"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <ScrollArea className="p-6">
          <div className="grid grid-cols-3 gap-4">
            {quickApps.map((app) => {
              const Icon = app.icon;
              return (
                <button
                  key={app.id}
                  onClick={() => {
                    onNavigate(app.url);
                    onClose();
                  }}
                  className="flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 hover-elevate group"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                  data-testid={`app-${app.id}`}
                >
                  <div 
                    className="w-14 h-14 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                    style={{
                      background: `${app.color}20`,
                      boxShadow: `0 0 20px ${app.color}30`,
                    }}
                  >
                    <Icon 
                      className="w-7 h-7 transition-colors" 
                      style={{ color: app.color }}
                    />
                  </div>
                  <span className="text-white/80 text-sm font-medium group-hover:text-white">
                    {app.name}
                  </span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            Click any app to open it through Illing Star cloud browser
          </p>
        </div>
      </Card>
    </div>
  );
}
