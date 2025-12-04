import { useState, useEffect } from 'react';
import { X, Moon, Shield, Trash2, Code, Palette, Type, Maximize, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface SettingsPanelProps {
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onClearHistory: () => void;
  onClose: () => void;
  sessionId: string | null;
}

export function SettingsPanel({ 
  privacyMode, 
  onTogglePrivacy, 
  onClearHistory, 
  onClose,
  sessionId 
}: SettingsPanelProps) {
  const [clickCount, setClickCount] = useState(0);
  const [devMode, setDevMode] = useState(() => {
    return localStorage.getItem('illing-star-dev-mode') === 'true';
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('illing-star-theme') || 'default';
  });
  const [textSize, setTextSize] = useState(() => {
    return parseInt(localStorage.getItem('illing-star-text-size') || '100');
  });
  const [guiScale, setGuiScale] = useState(() => {
    return parseInt(localStorage.getItem('illing-star-gui-scale') || '100');
  });
  const [customBadge, setCustomBadge] = useState(() => {
    return localStorage.getItem('illing-star-custom-badge') || '';
  });

  useEffect(() => {
    localStorage.setItem('illing-star-dev-mode', String(devMode));
  }, [devMode]);

  useEffect(() => {
    localStorage.setItem('illing-star-theme', theme);
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('illing-star-text-size', String(textSize));
    document.documentElement.style.setProperty('--text-scale', `${textSize / 100}`);
  }, [textSize]);

  useEffect(() => {
    localStorage.setItem('illing-star-gui-scale', String(guiScale));
    document.documentElement.style.setProperty('--gui-scale', `${guiScale / 100}`);
  }, [guiScale]);

  useEffect(() => {
    localStorage.setItem('illing-star-custom-badge', customBadge);
  }, [customBadge]);

  const handleVersionClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5 && !devMode) {
      setDevMode(true);
      setTimeout(() => setClickCount(0), 2000);
    } else if (newCount < 5) {
      setTimeout(() => setClickCount(0), 2000);
    }
  };

  const applyTheme = (themeName: string) => {
    const root = document.documentElement;
    
    switch (themeName) {
      case 'ocean':
        root.style.setProperty('--primary', '199 89% 48%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        break;
      case 'forest':
        root.style.setProperty('--primary', '142 71% 45%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        break;
      case 'sunset':
        root.style.setProperty('--primary', '24 95% 53%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        break;
      case 'midnight':
        root.style.setProperty('--primary', '263 70% 50%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        break;
      case 'default':
      default:
        root.style.setProperty('--primary', '0 72% 51%');
        root.style.setProperty('--primary-foreground', '0 0% 100%');
        break;
    }
  };

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
        className="w-full max-w-md max-h-[80vh] overflow-y-auto p-6 border-white/10"
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

          {devMode && (
            <>
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-4">
                  <Code className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-white">Developer Mode</h3>
                </div>

                <div className="space-y-4">
                  <SettingItem
                    icon={<Palette className="w-5 h-5" />}
                    title="Theme"
                    description="Customize your interface colors"
                  >
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="ocean">Ocean</SelectItem>
                        <SelectItem value="forest">Forest</SelectItem>
                        <SelectItem value="sunset">Sunset</SelectItem>
                        <SelectItem value="midnight">Midnight</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingItem>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Type className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Text Size</p>
                        <p className="text-sm text-white/50">{textSize}%</p>
                      </div>
                    </div>
                    <Slider
                      value={[textSize]}
                      onValueChange={([value]) => setTextSize(value)}
                      min={75}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Maximize className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-white font-medium">GUI Scale</p>
                        <p className="text-sm text-white/50">{guiScale}%</p>
                      </div>
                    </div>
                    <Slider
                      value={[guiScale]}
                      onValueChange={([value]) => setGuiScale(value)}
                      min={75}
                      max={150}
                      step={5}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-white font-medium">Custom Badge</p>
                        <p className="text-sm text-white/50">Only visible to you</p>
                      </div>
                    </div>
                    <Input
                      value={customBadge}
                      onChange={(e) => setCustomBadge(e.target.value)}
                      placeholder="Enter custom badge emoji"
                      maxLength={2}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <p 
            className="text-xs text-white/40 text-center cursor-pointer select-none"
            onClick={handleVersionClick}
          >
            Illing Star v1.0.0 - Cloud Browser
            {clickCount > 0 && clickCount < 5 && !devMode && (
              <span className="ml-2 text-primary">({clickCount}/5)</span>
            )}
            {devMode && <span className="ml-2 text-primary">🔧 Dev Mode</span>}
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
