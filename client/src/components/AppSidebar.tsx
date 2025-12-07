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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarSeparator,
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

interface NavGroup {
  label: string;
  items: { id: ExtendedNavItemId; label: string; icon: typeof Home }[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { id: 'home', label: 'Home', icon: Sparkles },
      { id: 'search', label: 'Search', icon: Search },
      { id: 'discovery', label: 'Discovery', icon: Compass },
    ],
  },
  {
    label: 'Applications',
    items: [
      { id: 'apps', label: 'Apps', icon: Grid3X3 },
      { id: 'games', label: 'Games', icon: Gamepad2 },
      { id: 'ai', label: 'AI Assistant', icon: MessageSquare },
    ],
  },
  {
    label: 'Social',
    items: [
      { id: 'chat', label: 'Chat', icon: MessageSquare },
      { id: 'friends', label: 'Friends', icon: Users },
      { id: 'servers', label: 'Servers', icon: Server },
      { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'Account',
    items: [
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'history', label: 'History', icon: Clock },
      { id: 'profile', label: 'Profile', icon: User },
    ],
  },
];

const adminNavItem = { id: 'admin' as ExtendedNavItemId, label: 'Admin', icon: Shield };

export function AppSidebar({ activeNav, onNavChange, userRole = 'user' }: AppSidebarProps) {
  const hasModeratorAccess = userRole === 'admin' || userRole === 'mod';
  const { toggleSidebar, state } = useSidebar();

  const groupsWithAdmin = hasModeratorAccess 
    ? navGroups.map((group, idx) => {
        if (idx === navGroups.length - 1) {
          return {
            ...group,
            items: [adminNavItem, ...group.items],
          };
        }
        return group;
      })
    : navGroups;

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
        className="flex items-center justify-center py-3"
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-white/70 hover:text-white transition-all duration-200"
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
        className="py-2"
        style={{
          background: 'rgba(0, 0, 0, 0.35)',
          backdropFilter: 'blur(16px)',
        }}
      >
        {groupsWithAdmin.map((group, groupIndex) => (
          <SidebarGroup key={group.label} className="py-2">
            <SidebarGroupLabel 
              className="text-white/40 text-xs uppercase tracking-wider px-4 mb-1 group-data-[collapsible=icon]:hidden"
            >
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.id;
                  const isAdmin = item.id === 'admin';

                  const buttonClasses = [
                    'group-data-[collapsible=icon]:justify-center',
                    'transition-all duration-200',
                    isActive ? 'bg-primary/30 text-white ring-1 ring-primary/50' : 'text-white/70 hover:text-white hover:bg-white/5',
                    isAdmin && !isActive ? 'text-amber-400/90 hover:text-amber-300' : '',
                  ].filter(Boolean).join(' ');

                  const iconClasses = [
                    'w-5 h-5 transition-all duration-200',
                    isActive ? 'text-primary active-icon-glow' : 'group-hover:scale-110',
                  ].filter(Boolean).join(' ');

                  return (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => onNavChange(item.id)}
                        isActive={isActive}
                        className={buttonClasses}
                        data-testid={`nav-button-${item.id}`}
                      >
                        <Icon className={iconClasses} />
                        <span className="font-medium">{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
            {groupIndex < groupsWithAdmin.length - 1 && (
              <SidebarSeparator className="my-2 bg-white/10" />
            )}
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}