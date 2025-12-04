import { X, Moon, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';

interface SettingsPanelProps {
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onClearHistory: () => void;
  onClose: () => void;
}

export function SettingsPanel({ 
  privacyMode, 
  onTogglePrivacy, 
  onClearHistory, 
  onClose 
}: SettingsPanelProps) {
  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="settings-panel"
    >
      <Card 
        className="w-full max-w-md p-6 border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Settings</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-close-settings"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-6">
          <SettingItem
            icon={<Moon className="w-5 h-5" />}
            title="Dark Mode"
            description="Always enabled for optimal viewing"
          >
            <Switch checked={true} disabled className="data-[state=checked]:bg-primary" />
          </SettingItem>

          <SettingItem
            icon={<Shield className="w-5 h-5" />}
            title="Privacy Mode"
            description={privacyMode ? "History is not being saved" : "Don't save browsing history"}
          >
            <Switch 
              checked={privacyMode} 
              onCheckedChange={onTogglePrivacy}
              className="data-[state=checked]:bg-primary" 
              data-testid="switch-privacy" 
            />
          </SettingItem>

          <SettingItem
            icon={<Trash2 className="w-5 h-5" />}
            title="Clear History"
            description="Remove all browsing data"
          >
            <Button 
              variant="outline" 
              size="sm"
              onClick={onClearHistory}
              className="border-white/20 hover:bg-white/10 text-white"
              data-testid="button-clear-history"
            >
              Clear
            </Button>
          </SettingItem>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-xs text-white/40 text-center">
            Illing Star v1.0.0 - Cloud Browser
          </p>
        </div>
      </Card>
    </div>
  );
}

function SettingItem({ 
  icon, 
  title, 
  description, 
  children 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <div>
          <p className="text-white font-medium">{title}</p>
          <p className="text-sm text-white/50">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
