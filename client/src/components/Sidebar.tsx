import { 
  Home, 
  Search, 
  Grid3X3, 
  Settings, 
  Clock, 
  User,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavItemId } from '@shared/schema';

interface SidebarProps {
  activeNav: NavItemId;
  onNavChange: (id: NavItemId) => void;
}

const navItems: { id: NavItemId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'apps', label: 'Apps', icon: Grid3X3 },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar({ activeNav, onNavChange }: SidebarProps) {
  return (
    <aside 
      className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-6 z-50"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      }}
      data-testid="sidebar-navigation"
    >
      <div className="flex flex-col items-center gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          
          return (
            <Tooltip key={item.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onNavChange(item.id)}
                  className={`
                    relative w-12 h-12 rounded-lg transition-all duration-200
                    ${isActive 
                      ? 'bg-primary/20 text-primary' 
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                  data-testid={`nav-button-${item.id}`}
                  aria-label={item.label}
                >
                  {isActive && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                      style={{
                        boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
                      }}
                    />
                  )}
                  <Icon 
                    className={`w-5 h-5 transition-all duration-200 ${isActive ? 'icon-glow' : ''}`}
                  />
                </Button>
              </TooltipTrigger>
              <TooltipContent 
                side="right" 
                className="bg-card/95 backdrop-blur-md border-white/10"
              >
                <p>{item.label}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </aside>
  );
}
