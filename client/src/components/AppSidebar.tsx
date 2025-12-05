import { 
  Home, 
  Search, 
  Grid3X3, 
  Settings, 
  Clock, 
  User,
  MessageSquare,
  Shield,
  Sparkles,
  Trophy,
  Gamepad2,
  Users,
  Server,
  Compass,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { UserRole, ExtendedNavItemId } from '@shared/schema';

interface AppSidebarProps {
  activeNav: ExtendedNavItemId | null;
  onNavChange: (id: ExtendedNavItemId) => void;
  userRole?: UserRole;
}

const baseNavItems: { id: ExtendedNavItemId; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Sparkles },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'apps', label: 'Apps', icon: Grid3X3 },
  { id: 'games', label: 'Games', icon: Gamepad2 },
  { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
  { id: 'chat', label: 'Chat', icon: MessageSquare },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'servers', label: 'Servers', icon: Server },
  { id: 'discovery', label: 'Discovery', icon: Compass },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'history', label: 'History', icon: Clock },
  { id: 'profile', label: 'Profile', icon: User },
];

const adminNavItem = { id: 'admin' as ExtendedNavItemId, label: 'Admin', icon: Shield };

export function AppSidebar({ activeNav, onNavChange, userRole = 'user' }: AppSidebarProps) {
  const hasModeratorAccess = userRole === 'admin' || userRole === 'mod';
  const { toggleSidebar, state } = useSidebar();

  const navItems = hasModeratorAccess 
    ? [...baseNavItems.slice(0, -1), adminNavItem, baseNavItems[baseNavItems.length - 1]]
    : baseNavItems;

  return (
    <Sidebar 
      collapsible="icon"
      side="right"
      className="border-l-0"
      style={{
        '--sidebar-width': '16rem',
        '--sidebar-width-icon': '4rem',
      } as React.CSSProperties}
    >
      <SidebarHeader
        className="flex items-center justify-center py-2"
        style={{
          background: 'rgba(0, 0, 0, 0.25)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-white/70 hover:text-white"
              data-testid="button-toggle-sidebar"
            >
              {state === 'expanded' ? (
                <PanelRightClose className="w-5 h-5" />
              ) : (
                <PanelRightOpen className="w-5 h-5" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>{state === 'expanded' ? 'Collapse Menu' : 'Expand Menu'}</p>
          </TooltipContent>
        </Tooltip>
      </SidebarHeader>
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
                    <SidebarMenuButton
                      onClick={() => onNavChange(item.id)}
                      isActive={isActive}
                      className="group-data-[collapsible=icon]:justify-center"
                      data-testid={`nav-button-${item.id}`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
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