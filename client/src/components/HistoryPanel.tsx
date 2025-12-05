import { X, Clock, ExternalLink, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { HistoryItem } from '@shared/schema';

interface HistoryPanelProps {
  history: HistoryItem[];
  onNavigate: (url: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export function HistoryPanel({ history, onNavigate, onClear, onClose }: HistoryPanelProps) {
  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="history-panel"
    >
      <Card 
        className="w-full max-w-lg h-[70vh] flex flex-col border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white hover:bg-white/10"
              data-testid="button-back-history"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-white">Browsing History</h2>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="text-white/70 hover:text-destructive hover:bg-destructive/10"
                data-testid="button-clear-all-history"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>

        <ScrollArea className="flex-1 p-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                }}
              >
                <Clock className="w-8 h-8 text-white/30" />
              </div>
              <p className="text-white/50 text-lg mb-2">No browsing history</p>
              <p className="text-white/30 text-sm">
                Your visited pages will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.url)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200 hover-elevate"
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                  data-testid={`history-item-${item.id}`}
                >
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(139, 92, 246, 0.15)',
                    }}
                  >
                    <ExternalLink className="w-4 h-4 text-purple-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{item.title}</p>
                    <p className="text-sm text-white/40 truncate">{item.url}</p>
                  </div>
                  <span className="text-xs text-white/30 flex-shrink-0">
                    {new Date(item.visitedAt).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}
