import { 
  Home, 
  Search, 
  Grid3X3, 
  Settings, 
  Clock, 
  User,
  Sparkles,
  Shield,
  MessageSquare
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { NavItemId, UserRole } from '@shared/schema';

interface AppSidebarProps {
  activeNav: NavItemId | null;
  onNavChange: (id: NavItemId) => void;
  userRole?: UserRole;
}

const baseNavItems: { id: NavItemId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'apps', label: 'Apps', icon: Grid3X3 },
  { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];

const adminNavItem = { id: 'admin' as NavItemId, label: 'Admin', icon: Shield };

export function AppSidebar({ activeNav, onNavChange, userRole = 'user' }: AppSidebarProps) {
  const hasModeratorAccess = userRole === 'admin' || userRole === 'mod';
  
  const navItems = hasModeratorAccess 
    ? [...baseNavItems.slice(0, -1), adminNavItem, baseNavItems[baseNavItems.length - 1]]
    : baseNavItems;

  return (
    <Sidebar 
      collapsible="icon"
      className="border-r-0"
      style={{
        '--sidebar-width': '4rem',
        '--sidebar-width-icon': '4rem',
      } as React.CSSProperties}
    >
      <SidebarContent 
        className="py-4"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <Tooltip delayDuration={200}>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => onNavChange(item.id)}
                          isActive={isActive}
                          className={`
                            relative w-12 h-12 mx-auto rounded-lg transition-all duration-200 justify-center
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
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        className="bg-card/95 backdrop-blur-md border-white/10"
                      >
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
