import { ArrowLeft, ArrowRight, RotateCw, X, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchBox } from './SearchBox';

interface BrowserControlsProps {
  url: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onClose: () => void;
  onNavigate: (url: string) => void;
}

export function BrowserControls({
  url,
  canGoBack,
  canGoForward,
  isLoading,
  onBack,
  onForward,
  onRefresh,
  onClose,
  onNavigate,
}: BrowserControlsProps) {
  return (
    <header 
      className="flex items-center gap-3 px-4 py-3 z-40"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      data-testid="browser-controls"
    >
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          disabled={!canGoBack}
          className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          data-testid="button-back"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onForward}
          disabled={!canGoForward}
          className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          data-testid="button-forward"
          aria-label="Go forward"
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={isLoading}
          className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          data-testid="button-refresh"
          aria-label="Refresh"
        >
          <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <div className="flex-1 max-w-2xl">
        <SearchBox 
          onSearch={onNavigate} 
          isLoading={isLoading}
          initialValue={url}
          compact
        />
      </div>

      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-white/60"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Globe className="w-3 h-3" />
          <span className="max-w-[200px] truncate" data-testid="text-current-url">
            {url ? new URL(url).hostname : 'Ready'}
          </span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-destructive/20"
          data-testid="button-close-browser"
          aria-label="Close browser"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
