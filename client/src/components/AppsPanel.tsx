import { useState, useEffect } from 'react';
import { X, Globe, Search, BookOpen, Film, Music, ShoppingBag, Newspaper, Code, Plus, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface AppsPanelProps {
  onNavigate: (url: string) => void;
  onClose: () => void;
  sessionId: string | null;
}

const iconMap: Record<string, any> = {
  Search, Globe, BookOpen, Code, Newspaper, ShoppingBag, Film, Music
};

export function AppsPanel({ onNavigate, onClose, sessionId }: AppsPanelProps) {
  const [apps, setApps] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', url: '', icon: 'Globe', color: '#4285F4' });

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/quick-apps', {
        headers: { 'x-session-id': sessionId },
      });
      const data = await res.json();
      setApps(data.apps);
    } catch (error) {
      console.error('Failed to load apps:', error);
    }
  };

  const saveApps = async (updatedApps: any[]) => {
    if (!sessionId) return;
    try {
      await fetch('/api/quick-apps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ apps: updatedApps }),
      });
      setApps(updatedApps);
    } catch (error) {
      console.error('Failed to save apps:', error);
    }
  };

  const handleAddApp = () => {
    if (!newApp.name || !newApp.url) return;
    const app = {
      ...newApp,
      id: `custom-${Date.now()}`,
      userId: 'user',
      order: apps.length,
    };
    saveApps([...apps, app]);
    setNewApp({ name: '', url: '', icon: 'Globe', color: '#4285F4' });
    setIsAdding(false);
  };

  const handleRemoveApp = (id: string) => {
    saveApps(apps.filter(app => app.id !== id));
  };
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
            {apps.map((app) => {
              const Icon = iconMap[app.icon] || Globe;
              return (
                <div key={app.id} className="relative group">
                  <button
                    onClick={() => {
                      onNavigate(app.url);
                      onClose();
                    }}
                    className="w-full flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200 hover-elevate"
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
                  {sessionId && (
                    <button
                      onClick={() => handleRemoveApp(app.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-red-500/80 hover:bg-red-500"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  )}
                </div>
              );
            })}
            {sessionId && (
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl transition-all duration-200 hover-elevate"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                }}
              >
                <Plus className="w-8 h-8 text-white/40" />
                <span className="text-white/40 text-sm">Add App</span>
              </button>
            )}
          </div>
          {isAdding && (
            <div className="mt-4 p-4 rounded-lg bg-white/5 space-y-3">
              <Input
                placeholder="App Name"
                value={newApp.name}
                onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="URL"
                value={newApp.url}
                onChange={(e) => setNewApp({ ...newApp, url: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Input
                placeholder="Color (hex)"
                value={newApp.color}
                onChange={(e) => setNewApp({ ...newApp, color: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
              <Button onClick={handleAddApp} className="w-full">Add App</Button>
            </div>
          )}
        </ScrollArea>

        <div className="p-4 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            {sessionId ? 'Customize your quick apps - click + to add, hover to remove' : 'Sign in to customize your quick apps'}
          </p>
        </div>
      </Card>
    </div>
  );
}
