import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import { useState, useEffect } from 'react';

// Assuming User type and setActivePanel are defined elsewhere
// import { User } from '@/types/user';
// import { setActivePanel } from '@/lib/utils';

// Placeholder types and functions for demonstration
type User = { id: string; username: string; role: 'user' | 'admin'; };
const setActivePanel = (panel: string) => console.log(`Setting active panel to: ${panel}`);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/~s/:encoded">{() => {
        window.location.href = '/';
        return null;
      }}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    return localStorage.getItem('sessionId');
  });
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Restore session on app load
  useEffect(() => {
    const storedSessionId = localStorage.getItem('sessionId');
    if (storedSessionId && !user) {
      fetch('/api/auth/me', {
        headers: {
          'x-session-id': storedSessionId,
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            setUser(data.user);
            setSessionId(storedSessionId);
          } else {
            localStorage.removeItem('sessionId');
          }
        })
        .catch(() => {
          localStorage.removeItem('sessionId');
        });
    }
  }, []);

  const handleAuthSuccess = (userData: User, newSessionId: string) => {
    setUser(userData);
    setSessionId(newSessionId);
    localStorage.setItem('sessionId', newSessionId);
    setShowAuthModal(false);
  };

  const handleSignOut = async () => {
    if (sessionId) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'x-session-id': sessionId,
        },
      });
    }
    setUser(null);
    setSessionId(null);
    localStorage.removeItem('sessionId');
    setActivePanel('home');
  };


  return (
    <ThemeProvider defaultTheme="dark">
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;