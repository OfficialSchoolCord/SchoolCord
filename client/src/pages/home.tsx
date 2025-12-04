import { useState, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { Starfield } from '@/components/Starfield';
import { AppSidebar } from '@/components/AppSidebar';
import { HomePage } from '@/components/HomePage';
import { BrowserView } from '@/components/BrowserView';
import { SettingsPanel } from '@/components/SettingsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AppsPanel } from '@/components/AppsPanel';
import { ProfilePanel } from '@/components/ProfilePanel';
import { useToast } from '@/hooks/use-toast';
import { useBrowserSettings } from '@/hooks/use-browser-settings';
import { apiRequest } from '@/lib/queryClient';
import type { NavItemId, HistoryItem, FetchResponse } from '@shared/schema';

export default function Home() {
  const { toast } = useToast();
  const { 
    privacyMode, 
    togglePrivacyMode, 
    savedHistory, 
    addToHistory, 
    clearHistory 
  } = useBrowserSettings();
  
  const [activeNav, setActiveNav] = useState<NavItemId>('home');
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);
  
  const [browsingHistory, setBrowsingHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const fetchMutation = useMutation({
    mutationFn: async (url: string): Promise<FetchResponse> => {
      const response = await apiRequest('POST', '/api/browse', { url });
      const data = await response.json();
      return data as FetchResponse;
    },
    onSuccess: (data) => {
      if (data.success) {
        setPageContent(data.content || null);
        setPageTitle(data.title || '');
        setPageError(null);
        setIsSearchResult(data.isSearch || false);
        setSearchUrl(data.searchUrl || null);
        setCurrentUrl(data.url);
        
        const newHistoryItem: HistoryItem = {
          id: Date.now().toString(),
          url: data.url,
          title: data.title || data.url,
          visitedAt: new Date().toISOString(),
        };
        addToHistory(newHistoryItem);
      } else {
        setPageError(data.error || 'Failed to load page');
        setPageContent(null);
      }
    },
    onError: (error: Error) => {
      setPageError(error.message || 'Failed to connect to cloud service');
      setPageContent(null);
      toast({
        title: 'Error',
        description: 'Failed to load the page. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSearch = useCallback((query: string) => {
    setShowBrowser(true);
    setActiveNav('search');
    setPageError(null);
    setPageContent(null);
    
    const newHistory = browsingHistory.slice(0, historyIndex + 1);
    newHistory.push(query);
    setBrowsingHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    
    fetchMutation.mutate(query);
  }, [browsingHistory, historyIndex, fetchMutation]);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = browsingHistory[newIndex];
      fetchMutation.mutate(url);
    }
  }, [historyIndex, browsingHistory, fetchMutation]);

  const handleForward = useCallback(() => {
    if (historyIndex < browsingHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = browsingHistory[newIndex];
      fetchMutation.mutate(url);
    }
  }, [historyIndex, browsingHistory, fetchMutation]);

  const handleCloseBrowser = useCallback(() => {
    setShowBrowser(false);
    setActiveNav('home');
    setPageContent(null);
    setPageError(null);
    setCurrentUrl('');
  }, []);

  const handleNavChange = useCallback((id: NavItemId) => {
    if (id === 'home') {
      handleCloseBrowser();
    } else if (id === 'search' && showBrowser) {
      return;
    }
    setActiveNav(id);
  }, [handleCloseBrowser, showBrowser]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    toast({
      title: 'History Cleared',
      description: 'Your browsing history has been cleared.',
    });
  }, [clearHistory, toast]);

  const handleHistoryNavigate = useCallback((url: string) => {
    setActiveNav('search');
    handleSearch(url);
  }, [handleSearch]);

  const renderPanel = () => {
    switch (activeNav) {
      case 'settings':
        return (
          <SettingsPanel 
            privacyMode={privacyMode}
            onTogglePrivacy={togglePrivacyMode}
            onClearHistory={handleClearHistory}
            onClose={() => setActiveNav(showBrowser ? 'search' : 'home')} 
          />
        );
      case 'history':
        return (
          <HistoryPanel 
            history={savedHistory}
            onNavigate={handleHistoryNavigate}
            onClear={handleClearHistory}
            onClose={() => setActiveNav(showBrowser ? 'search' : 'home')} 
          />
        );
      case 'apps':
        return (
          <AppsPanel 
            onNavigate={handleSearch}
            onClose={() => setActiveNav(showBrowser ? 'search' : 'home')} 
          />
        );
      case 'profile':
        return (
          <ProfilePanel 
            visitCount={savedHistory.length}
            onClose={() => setActiveNav(showBrowser ? 'search' : 'home')} 
          />
        );
      default:
        return null;
    }
  };

  const sidebarStyle = {
    '--sidebar-width': '4rem',
    '--sidebar-width-icon': '4rem',
  } as React.CSSProperties;

  return (
    <div className="min-h-screen overflow-hidden relative">
      <Starfield />
      
      <SidebarProvider 
        defaultOpen={false}
        style={sidebarStyle}
      >
        <AppSidebar 
          activeNav={activeNav} 
          onNavChange={handleNavChange} 
        />
        
        <SidebarInset className="bg-transparent">
          {!showBrowser && activeNav === 'home' && (
            <HomePage 
              onSearch={handleSearch} 
              isLoading={fetchMutation.isPending} 
            />
          )}

          {showBrowser && (
            <BrowserView
              url={currentUrl}
              content={pageContent}
              title={pageTitle}
              isLoading={fetchMutation.isPending}
              error={pageError}
              isSearch={isSearchResult}
              searchUrl={searchUrl}
              history={browsingHistory}
              historyIndex={historyIndex}
              onNavigate={handleSearch}
              onBack={handleBack}
              onForward={handleForward}
              onClose={handleCloseBrowser}
            />
          )}

          {renderPanel()}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
