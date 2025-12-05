
import { useState } from 'react';
import { Plus, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useQuery } from '@tanstack/react-query';
import type { Server } from '@shared/schema';

interface ServerNavSidebarProps {
  onServerSelect: (serverId: string | null) => void;
  onCreateServer: () => void;
  selectedServerId: string | null;
  sessionId: string | null;
}

export function ServerNavSidebar({ 
  onServerSelect, 
  onCreateServer, 
  selectedServerId,
  sessionId 
}: ServerNavSidebarProps) {
  const { data: serversData } = useQuery<{ servers: Server[] }>({
    queryKey: ['/api/servers'],
    enabled: !!sessionId,
  });

  const servers = serversData?.servers || [];

  return (
    <div 
      className="fixed left-0 top-0 h-full w-16 flex flex-col items-center py-4 z-50 border-r border-white/10"
      style={{
        background: 'rgba(15, 10, 25, 0.95)',
        backdropFilter: 'blur(12px)',
      }}
      data-testid="server-nav-sidebar"
    >
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onServerSelect(null)}
            className={`w-12 h-12 rounded-full mb-2 ${
              selectedServerId === null 
                ? 'bg-primary/30 text-primary' 
                : 'bg-white/10 text-white/70 hover:text-white'
            }`}
            data-testid="button-home-server"
          >
            <Home className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Home</p>
        </TooltipContent>
      </Tooltip>

      <div className="w-8 h-0.5 bg-white/20 my-2" />

      <ScrollArea className="flex-1 w-full">
        <div className="flex flex-col items-center gap-2 px-2">
          {servers.slice(0, 500).map((server) => (
            <Tooltip key={server.id} delayDuration={200}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onServerSelect(server.id)}
                  className={`w-12 h-12 rounded-full relative ${
                    selectedServerId === server.id 
                      ? 'bg-primary/30 text-primary' 
                      : 'bg-white/10 text-white/70 hover:text-white'
                  }`}
                  data-testid={`button-server-nav-${server.id}`}
                >
                  {selectedServerId === server.id && (
                    <div 
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full"
                      style={{
                        boxShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
                      }}
                    />
                  )}
                  {server.icon ? (
                    <img 
                      src={server.icon} 
                      alt={server.name} 
                      className="w-full h-full object-cover rounded-full" 
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {server.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{server.name}</p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
      </ScrollArea>

      <div className="w-8 h-0.5 bg-white/20 my-2" />

      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCreateServer}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-primary/20 text-white/70 hover:text-white"
            data-testid="button-create-server-nav"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p>Create Server</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
