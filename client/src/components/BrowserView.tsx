import { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserControls } from './BrowserControls';
import { Loader2, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BrowserViewProps {
  url: string;
  content: string | null;
  title: string;
  isLoading: boolean;
  error: string | null;
  isSearch: boolean;
  searchUrl: string | null;
  history: string[];
  historyIndex: number;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onClose: () => void;
  useProxy?: boolean;
}

const _0x5f = 0x5A;
const _0x3e = (s: string): string => {
  const arr = new Uint8Array(new TextEncoder().encode(s));
  const r = new Uint8Array(arr.length);
  for (let i = 0; i < arr.length; i++) {
    r[i] = arr[i] ^ _0x5f;
  }
  let binary = '';
  r.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export function BrowserView({
  url,
  content,
  title,
  isLoading,
  error,
  isSearch,
  searchUrl,
  history,
  historyIndex,
  onNavigate,
  onBack,
  onForward,
  onClose,
  useProxy = true,
}: BrowserViewProps) {
  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < history.length - 1;
  const [proxyUrl, setProxyUrl] = useState<string | null>(null);
  const [iframeLoading, setIframeLoading] = useState(false);
  const [iframeError, setIframeError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (useProxy && url && !isSearch) {
      let targetUrl = url;
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        if (targetUrl.includes('.') && !targetUrl.includes(' ')) {
          targetUrl = 'https://' + targetUrl;
        }
      }
      
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        setIframeLoading(true);
        setIframeError(null);
        const encoded = _0x3e(targetUrl);
        setProxyUrl('/~s/' + encoded);
      }
    } else {
      setProxyUrl(null);
    }
  }, [url, useProxy, isSearch]);

  const handleIframeLoad = () => {
    setIframeLoading(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError('Failed to load the page through proxy');
  };

  const handleRefresh = useCallback(() => {
    if (useProxy && proxyUrl) {
      setIframeLoading(true);
      if (iframeRef.current) {
        iframeRef.current.src = proxyUrl;
      }
    } else if (url) {
      onNavigate(url);
    }
  }, [url, onNavigate, useProxy, proxyUrl]);

  const openInNewTab = () => {
    if (isSearch && searchUrl) {
      window.open(searchUrl, '_blank', 'noopener,noreferrer');
    } else if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const showIframe = useProxy && proxyUrl && !isSearch;
  const showContent = !showIframe && !error && !isLoading && content;

  return (
    <div 
      className="fixed inset-0 ml-16 flex flex-col z-30 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px)',
      }}
      data-testid="browser-view"
    >
      <BrowserControls
        url={url}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        isLoading={isLoading || iframeLoading}
        onBack={onBack}
        onForward={onForward}
        onRefresh={handleRefresh}
        onClose={onClose}
        onNavigate={onNavigate}
      />

      <main className="flex-1 overflow-hidden relative">
        {(isLoading || iframeLoading) && (
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

        {(error || iframeError) && !isLoading && !iframeLoading && (
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
                <p className="text-white/60 text-sm">{error || iframeError}</p>
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

        {showIframe && (
          <iframe
            ref={iframeRef}
            src={proxyUrl}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            data-testid="browser-iframe"
          />
        )}

        {showContent && (
          <div className="h-full flex flex-col">
            {isSearch && searchUrl && (
              <div 
                className="flex items-center justify-between gap-2 px-4 py-2"
                style={{
                  background: 'rgba(139, 92, 246, 0.1)',
                  borderBottom: '1px solid rgba(139, 92, 246, 0.2)',
                }}
              >
                <span className="text-sm text-white/70">
                  Search results from DuckDuckGo
                </span>
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
              </div>
            )}
            
            <div 
              className="flex-1 overflow-auto p-6"
              data-testid="browser-content"
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
          </div>
        )}

        {!error && !iframeError && !isLoading && !iframeLoading && !content && !showIframe && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white/40">Enter a URL or search term to browse</p>
          </div>
        )}
      </main>
    </div>
  );
}
