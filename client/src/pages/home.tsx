import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Starfield } from '@/components/Starfield';
import { AppSidebar } from '@/components/AppSidebar';
import { HomePage } from '@/components/HomePage';
import { BrowserView } from '@/components/BrowserView';
import { SettingsPanel } from '@/components/SettingsPanel';
import { HistoryPanel } from '@/components/HistoryPanel';
import { AppsPanel } from '@/components/AppsPanel';
import { ProfilePanel } from '@/components/ProfilePanel';
import { AdminPanel } from '@/components/AdminPanel';
import { AIChatPanel } from '@/components/AIChatPanel';
import { ChatPanel } from '@/components/ChatPanel';
import { AuthModal } from '@/components/AuthModal';
import { LevelUpNotification } from '@/components/LevelUpNotification';
import { LeaderboardPanel } from '@/components/LeaderboardPanel';
import { OnboardingTutorial } from '@/components/OnboardingTutorial';
import { AnnouncementDisplay } from '@/components/AnnouncementDisplay';
import { GamesPanel } from '@/components/GamesPanel';
import { useToast } from '@/hooks/use-toast';
import { useBrowserSettings } from '@/hooks/use-browser-settings';
import type { NavItemId, HistoryItem, FetchResponse, UserRole } from '@shared/schema';
import { ServerNavSidebar } from '@/components/ServerNavSidebar';
import { SearchBox } from '@/components/SearchBox';
import { ServersPanel } from '@/components/ServersPanel';
import { DiscoveryPanel } from '@/components/DiscoveryPanel';
import { FriendsPanel } from '@/components/FriendsPanel';
import { DMChatPanel } from '@/components/DMChatPanel';
import { useQuery } from '@tanstack/react-query';

export default function Home() {
  const [activePanel, setActivePanel] = useState<NavItemId | null>('home');
  const [showBrowser, setShowBrowser] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [pageContent, setPageContent] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSearchResult, setIsSearchResult] = useState(false);
  const [searchUrl, setSearchUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [visitCount, setVisitCount] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number } | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedDMThreadId, setSelectedDMThreadId] = useState<string | null>(null);
  const { toast } = useToast();
  const { 
    privacyMode, 
    togglePrivacyMode, 
    savedHistory, 
    addToHistory, 
    clearHistory 
  } = useBrowserSettings();

  const userRole: UserRole = user?.role || 'user';
  const hasModeratorAccess = userRole === 'admin' || userRole === 'mod';

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

  const handleAuthSuccess = (userData: any, newSessionId: string) => {
    setUser(userData);
    setSessionId(newSessionId);
    localStorage.setItem('sessionId', newSessionId);
    setShowAuthModal(false);

    // Show onboarding for new users (check if they just registered)
    const isNewUser = !localStorage.getItem(`onboarding_completed_${userData.id}`);
    if (isNewUser) {
      setShowOnboarding(true);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`onboarding_completed_${user.id}`, 'true');
    }
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
    mutationFn: async (url: string): Promise<FetchResponse> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      const response = await fetch('/api/browse', {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: (data: FetchResponse & { levelUp?: any }) => {
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

        // Check for level up
        if (data.levelUp && data.levelUp.newLevel > data.levelUp.oldLevel) {
          setLevelUpData(data.levelUp);
        }
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
    } else if (panel === 'admin' && !hasModeratorAccess) {
      return;
    } else if (panel === 'ai' && !user) {
      setShowAuthModal(true);
      setActivePanel(null);
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

  const handleServerSelect = (serverId: string | null) => {
    setSelectedServerId(serverId);
    if (serverId) {
      setActivePanel(null);
    }
  };

  const handleCreateServerFromNav = () => {
    setActivePanel('servers');
  };

  const handleDMOpen = (threadId: string) => {
    setSelectedDMThreadId(threadId);
    setActivePanel('chat');
  };

  const renderPanel = () => {
    switch (activePanel) {
      case 'settings':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg border border-white/10 max-h-[80vh] rounded-lg" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <SettingsPanel 
                privacyMode={privacyMode}
                onTogglePrivacy={togglePrivacyMode}
                onClearHistory={clearHistory}
                onClose={handleClosePanel} 
                sessionId={sessionId}
              />
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg border border-white/10 max-h-[80vh] rounded-lg" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <HistoryPanel 
                history={savedHistory}
                onNavigate={handleHistoryNavigate}
                onClear={handleClearHistory}
                onClose={handleClosePanel} 
              />
            </div>
          </div>
        );
      case 'apps':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-2xl border border-white/10 max-h-[80vh] rounded-lg" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <AppsPanel onNavigate={handleNavigate} onClose={handleClosePanel} sessionId={sessionId} />
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-lg border border-white/10 max-h-[80vh] rounded-lg" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
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
                sessionId={sessionId}
              />
            </div>
          </div>
        );
      case 'admin':
        if (!hasModeratorAccess || !sessionId) return null;
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-3xl border border-white/10 max-h-[80vh] rounded-lg overflow-hidden" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <AdminPanel 
                onClose={handleClosePanel} 
                sessionId={sessionId} 
                currentUserRole={userRole}
              />
            </div>
          </div>
        );
      case 'ai':
        if (!user || !sessionId) return null;
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-2xl h-[80vh] border border-white/10 rounded-lg overflow-hidden" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <AIChatPanel />
            </div>
          </div>
        );
      case 'chat':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-3xl h-[80vh] border border-white/10 rounded-lg overflow-hidden" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <ChatPanel sessionId={sessionId} userRole={userRole} />
            </div>
          </div>
        );
      case 'leaderboard':
        return (
          <div className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-md h-[80vh] border border-white/10 rounded-lg overflow-hidden" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
              <LeaderboardPanel />
            </div>
          </div>
        );
      case 'games':
        return <GamesPanel onClose={handleClosePanel} />;
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
      <AnnouncementDisplay />

      {showOnboarding && (
        <OnboardingTutorial onComplete={handleOnboardingComplete} />
      )}

      {levelUpData && (
        <LevelUpNotification 
          newLevel={levelUpData.newLevel} 
          onComplete={() => setLevelUpData(null)} 
        />
      )}

      <TooltipProvider>
        <SidebarProvider 
          defaultOpen={true}
          style={sidebarStyle}
        >
          <ServerNavSidebar 
            onServerSelect={handleServerSelect}
            onCreateServer={handleCreateServerFromNav}
            selectedServerId={selectedServerId}
            sessionId={sessionId}
          />

          <SidebarInset className="bg-transparent">
          {selectedServerId && (
            <ServersPanel 
              sessionId={sessionId} 
              user={user}
              onClose={() => setSelectedServerId(null)}
              preselectedServerId={selectedServerId}
            />
          )}
          {!selectedServerId && activePanel === 'home' && (
            <HomePage 
              onSearch={handleSearch} 
              isLoading={fetchMutation.isPending} 
              sessionId={sessionId}
            />
          )}
          {!selectedServerId && activePanel === 'search' && <SearchBox onSearch={handleSearch} />}
          {!selectedServerId && activePanel === 'apps' && <AppsPanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'games' && <GamesPanel />}
          {!selectedServerId && activePanel === 'settings' && <SettingsPanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'history' && <HistoryPanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'profile' && <ProfilePanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'ai' && <AIChatPanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'admin' && userRole === 'admin' && <AdminPanel sessionId={sessionId} />}
          {!selectedServerId && activePanel === 'chat' && selectedDMThreadId && (
            <DMChatPanel 
              sessionId={sessionId} 
              threadId={selectedDMThreadId}
              onClose={() => setSelectedDMThreadId(null)}
            />
          )}
          {!selectedServerId && activePanel === 'chat' && !selectedDMThreadId && <ChatPanel sessionId={sessionId} userRole={userRole} />}
          {!selectedServerId && activePanel === 'leaderboard' && <LeaderboardPanel onClose={() => setActivePanel('home')} />}
          {!selectedServerId && activePanel === 'friends' && (
            <FriendsPanel 
              sessionId={sessionId} 
              onClose={() => setActivePanel('home')}
              onOpenDM={handleDMOpen}
            />
          )}
          {!selectedServerId && activePanel === 'servers' && (
            <ServersPanel 
              sessionId={sessionId} 
              user={user}
              onClose={() => setActivePanel('home')}
            />
          )}
          {!selectedServerId && activePanel === 'discovery' && (
            <DiscoveryPanel 
              sessionId={sessionId}
              onClose={() => setActivePanel('home')}
              onNavigateToServer={(serverId) => {
                setSelectedServerId(serverId);
              }}
            />
          )}
          {!selectedServerId && searchUrl && !activePanel && <BrowserView url={searchUrl} sessionId={sessionId} />}

          {renderPanel()}

          {showAuthModal && (
            <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
          )}
        </SidebarInset>

        <AppSidebar 
          activeNav={activePanel} 
          onNavChange={handlePanelChange} 
          userRole={userRole}
        />
      </SidebarProvider>
      </TooltipProvider>
    </div>
  );
}