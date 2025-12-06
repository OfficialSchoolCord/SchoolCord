import { X, Plus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrowserTab } from '@shared/schema';

interface TabBarProps {
  tabs: BrowserTab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onNewTab: () => void;
}

export function TabBar({
  tabs = [],
  activeTabId,
  onTabSelect,
  onTabClose,
  onNewTab,
}: TabBarProps) {
  const getHostname = (url: string): string => {
    try {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      return new URL(url).hostname;
    } catch {
      return url || 'New Tab';
    }
  };

  return (
    <div 
      className="flex items-center gap-1 px-2 py-1 overflow-x-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.6)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
      data-testid="tab-bar"
    >
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer min-w-[120px] max-w-[200px] transition-all ${
            tab.id === activeTabId
              ? 'bg-white/10 text-white'
              : 'bg-transparent text-white/60 hover:bg-white/5 hover:text-white/80'
          }`}
          onClick={() => onTabSelect(tab.id)}
          data-testid={`tab-${tab.id}`}
        >
          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs truncate flex-1" data-testid={`tab-title-${tab.id}`}>
            {tab.title || getHostname(tab.url) || 'New Tab'}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose(tab.id);
            }}
            className="opacity-0 group-hover:opacity-100 hover:bg-white/20 rounded p-0.5 transition-opacity"
            data-testid={`button-close-tab-${tab.id}`}
            aria-label="Close tab"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      <Button
        variant="ghost"
        size="icon"
        onClick={onNewTab}
        className="h-7 w-7 rounded-full text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0"
        data-testid="button-new-tab"
        aria-label="New tab"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}