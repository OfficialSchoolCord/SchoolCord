import { useState, useCallback, useEffect } from 'react';
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
import { AdminPanel } from '@/components/AdminPanel';
import { AuthModal } from '@/components/AuthModal';
import { useToast } from '@/hooks/use-toast';
import { useBrowserSettings } from '@/hooks/use-browser-settings';
import { apiRequest } from '@/lib/queryClient';
import type { NavItemId, HistoryItem, FetchResponse } from '@shared/schema';

export default function Home() {
  const [activePanel, setActivePanel] = useState<NavItemId | null>(null);
  const [currentUrl, setCurrentUrl] = useState('');
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [visitCount, setVisitCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();
  const { settings, updateSettings } = useBrowserSettings();

  useEffect(() => {
    const savedSessionId = localStorage.getItem('sessionId');
    if (savedSessionId) {
      setSessionId(savedSessionId);
      fetchCurrentUser(savedSessionId);
    }
  }, []);

  const fetchCurrentUser = async (sid: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-session-id': sid },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('sessionId');
        setSessionId(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    }
  };

  const handleAuthSuccess = (userData: any, sid: string) => {
    setUser(userData);
    setSessionId(sid);
    localStorage.setItem('sessionId', sid);
    setShowAuthModal(false);
    toast({
      title: 'Welcome!',
      description: `Signed in as ${userData.username}`,
    });
  };

  const handleSignOut = async () => {
    if (!sessionId) return;
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-session-id': sessionId },
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('sessionId');
    setActivePanel(null);
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
  };

  const handleUpdateProfile = async (username: string, profilePicture?: string) => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ username, profilePicture }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully',
        });
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const fetchMutation = useMutation({
    mutationFn: async (url: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      return await apiRequest<FetchResponse>('/api/browse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });
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
        setVisitCount(prevCount => prevCount + 1);
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
    setActivePanel('search');
    setPageError(null);
    setPageContent(null);

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(query);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    fetchMutation.mutate(query);
  }, [history, historyIndex, fetchMutation]);

  const handleBack = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      fetchMutation.mutate(url);
    }
  }, [historyIndex, history, fetchMutation]);

  const handleForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const url = history[newIndex];
      fetchMutation.mutate(url);
    }
  }, [historyIndex, history, fetchMutation]);

  const handleCloseBrowser = useCallback(() => {
    setShowBrowser(false);
    setActivePanel('home');
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
    setActivePanel(id);
  }, [handleCloseBrowser, showBrowser]);

  const handleClearHistory = useCallback(() => {
    clearHistory();
    toast({
      title: 'History Cleared',
      description: 'Your browsing history has been cleared.',
    });
  }, [clearHistory, toast]);

  const handleHistoryNavigate = useCallback((url: string) => {
    setActivePanel('search');
    handleSearch(url);
  }, [handleSearch]);

  const handlePanelChange = (panel: NavItemId) => {
    if (panel === 'home') {
      handleCloseBrowser();
    } else if (panel === 'search' && !currentUrl) {
      setActivePanel(null);
    } else if (panel === 'profile' && !user) {
      setShowAuthModal(true);
      setActivePanel(null);
    } else if (panel === 'settings' && user?.isAdmin) {
      setActivePanel('admin' as NavItemId);
    } else {
      setActivePanel(panel);
    }
  };

  const handleNavigate = (url: string) => {
    handleSearch(url);
  };

  const handleClosePanel = () => {
    setActivePanel(showBrowser ? 'search' : 'home');
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'settings':
        return (
          <SettingsPanel 
            privacyMode={privacyMode}
            onTogglePrivacy={togglePrivacyMode}
            onClearHistory={handleClearHistory}
            onClose={handleClosePanel} 
          />
        );
      case 'history':
        return (
          <HistoryPanel 
            history={savedHistory}
            onNavigate={handleHistoryNavigate}
            onClear={handleClearHistory}
            onClose={handleClosePanel} 
          />
        );
      case 'apps':
        return (
          <AppsPanel onNavigate={handleNavigate} onClose={handleClosePanel} sessionId={sessionId} />
        );
      case 'profile':
        return (
          <ProfilePanel 
            visitCount={visitCount} 
            onClose={handleClosePanel}
            user={user}
            onSignIn={() => {
              setActivePanel(null);
              setShowAuthModal(true);
            }}
            onSignOut={handleSignOut}
            onUpdateProfile={handleUpdateProfile}
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
          activeNav={activePanel} 
          onNavChange={handlePanelChange} 
          user={user}
        />

        <SidebarInset className="bg-transparent">
          {!showBrowser && activePanel === 'home' && (
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
              history={history}
              historyIndex={historyIndex}
              onNavigate={handleSearch}
              onBack={handleBack}
              onForward={handleForward}
              onClose={handleCloseBrowser}
            />
          )}

          {renderPanel()}

          {activePanel === 'settings' && user?.isAdmin && sessionId && (
            <AdminPanel onClose={handleClosePanel} sessionId={sessionId} />
          )}

          {showAuthModal && (
            <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
          )}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}