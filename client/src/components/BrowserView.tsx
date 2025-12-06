import { useCallback, useState, useEffect, useRef } from 'react';
import { BrowserControls } from './BrowserControls';
import { TabBar } from './TabBar';
import { Loader2, AlertCircle, ExternalLink, Home, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrowserTab } from '@shared/schema';

// Encode URL for proxy
async function encodeProxyUrl(url: string): Promise<string> {
  try {
    const response = await fetch('/api/~e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ u: url }),
    });
    const data = await response.json();
    return data.r || '';
  } catch {
    return '';
  }
}

interface BrowserViewProps {
  url: string;
  content: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;
  isSearch?: boolean;
  searchUrl?: string | null;
  canGoBack: boolean;
  canGoForward: boolean;
  onSearch: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
  sessionId?: string | null;
  tabs?: BrowserTab[];
  activeTabId?: string | null;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onNewTab?: () => void;
}

export function BrowserView({
  url,
  content,
  title,
  isLoading,
  error,
  isSearch = false,
  searchUrl = null,
  canGoBack,
  canGoForward,
  onSearch,
  onBack,
  onForward,
  onClose,
  sessionId,
  tabs = [],
  activeTabId = null,
  onTabSelect = () => {},
  onTabClose = () => {},
  onNewTab = () => {},
}: BrowserViewProps) {

  const handleRefresh = useCallback(() => {
    if (url) {
      onSearch(url);
    }
  }, [url, onSearch]);

  const [proxyUrl, setProxyUrl] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (url && !isSearch) {
      encodeProxyUrl(url).then(setProxyUrl);
    }
  }, [url, isSearch]);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const openInNewTab = () => {
    if (isSearch && searchUrl) {
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Show content area when not in error or loading state
  // For proxy mode (empty content with valid URL), we still need to show the iframe
  const showContent = !error && !isLoading && (content || url);

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 ${isFullscreen ? '' : 'ml-16'} flex flex-col z-30 animate-fade-in`}
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
      }}
      data-testid="browser-view"
    >
      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onTabSelect={onTabSelect}
        onTabClose={onTabClose}
        onNewTab={onNewTab}
      />
      <BrowserControls
        url={url}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading}
        onBack={onBack}
        onForward={onForward}
        onRefresh={handleRefresh}
        onClose={onClose}
        onNavigate={onSearch}
      />

      <main className="flex-1 overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="flex flex-col items-center gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(220, 38, 38, 0.1)',
                  boxShadow: '0 0 30px rgba(220, 38, 38, 0.3)',
                }}
              >
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <p className="text-white/60 text-sm">Loading through cloud...</p>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="flex flex-col items-center gap-6 p-8 rounded-2xl max-w-md text-center"
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                }}
              >
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-white mb-2">Unable to Load Page</h3>
                <p className="text-white/60 text-sm">{error}</p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="border-white/20"
                  data-testid="button-retry"
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={onClose}
                  data-testid="button-go-home"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        )}

        {showContent && (
          <div className="h-full flex flex-col">
            {(isSearch || content || url) && (
              <div 
                className="flex items-center justify-between gap-2 px-4 py-2"
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="gap-2 text-white/70 hover:text-white"
                    data-testid="button-back-home"
                  >
                    <Home className="w-4 h-4" />
                    <span>Back Home</span>
                  </Button>
                  {isSearch && searchUrl && (
                    <span className="text-sm text-white/70">
                      Search results from DuckDuckGo
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomOut}
                      className="h-7 w-7 text-white/70 hover:text-white"
                      data-testid="button-zoom-out"
                      disabled={zoomLevel <= 50}
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-white/70 min-w-[3rem] text-center" data-testid="text-zoom-level">
                      {zoomLevel}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleZoomIn}
                      className="h-7 w-7 text-white/70 hover:text-white"
                      data-testid="button-zoom-in"
                      disabled={zoomLevel >= 200}
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreen}
                    className="h-7 w-7 text-white/70 hover:text-white"
                    data-testid="button-fullscreen"
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </Button>
                  {isSearch && searchUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={openInNewTab}
                      className="gap-2 text-white/70 hover:text-white"
                      data-testid="button-open-external"
                    >
                      <span>Open in new tab</span>
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {content && content.trim().length > 0 ? (
              <div 
                className="flex-1 overflow-auto p-6"
                data-testid="browser-content"
                style={{
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: 'top left',
                  width: `${10000 / zoomLevel}%`,
                  height: `${10000 / zoomLevel}%`,
                }}
              >
                <div 
                  className="prose prose-invert prose-sm max-w-4xl mx-auto"
                  style={{
                    '--tw-prose-body': 'rgba(255, 255, 255, 0.85)',
                    '--tw-prose-headings': '#fff',
                    '--tw-prose-links': 'hsl(348, 83%, 60%)',
                    '--tw-prose-bold': '#fff',
                  } as React.CSSProperties}
                >
                  {title && (
                    <h1 className="text-2xl font-bold text-white mb-6" data-testid="text-page-title">
                      {title}
                    </h1>
                  )}
                  <div 
                    className="whitespace-pre-wrap leading-relaxed text-white/80"
                    dangerouslySetInnerHTML={{ __html: content }}
                  />
                </div>
              </div>
            ) : proxyUrl ? (
              <div className="flex-1 relative overflow-hidden">
                <iframe
                  src={`/~s/${proxyUrl}`}
                  className="border-0"
                  style={{
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                    width: `${10000 / zoomLevel}%`,
                    height: `${10000 / zoomLevel}%`,
                  }}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
                  title={title || 'Web page'}
                />
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            )}
          </div>
        )}

        {!error && !isLoading && !content && !url && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40">Enter a URL or search term to browse</p>
          </div>
        )}
      </main>
    </div>
  );
}
