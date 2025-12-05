import { useState } from 'react';
import { X, Compass, Search, Users, Tag, Globe, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Server } from '@shared/schema';

interface DiscoveryPanelProps {
  onClose: () => void;
  sessionId: string | null;
  onNavigateToServer: (serverId: string) => void;
}

export function DiscoveryPanel({ onClose, sessionId, onNavigateToServer }: DiscoveryPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const { toast } = useToast();

  const { data: serversData, isLoading } = useQuery<{ servers: Server[] }>({
    queryKey: ['/api/servers/discover', searchQuery, selectedTags.join(',')],
    enabled: true,
  });

  const { data: userServersData } = useQuery<{ servers: Server[] }>({
    queryKey: ['/api/servers'],
    enabled: !!sessionId,
  });

  const joinServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest(`/api/servers/${serverId}/join`, { method: 'POST' });
    },
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      toast({ title: 'Joined server!' });
      onNavigateToServer(serverId);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to join', description: error.message, variant: 'destructive' });
    },
  });

  const servers = serversData?.servers || [];
  const userServers = userServersData?.servers || [];
  const userServerIds = new Set(userServers.map(s => s.id));

  const popularTags = ['gaming', 'music', 'art', 'tech', 'community', 'education', 'anime', 'crypto'];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="discovery-panel"
    >
      <Card 
        className="w-full max-w-4xl max-h-[85vh] border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold text-white">Discover Servers</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-close-discovery"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-4 border-b border-white/10">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search servers..."
                className="pl-10 bg-white/5 border-white/10 text-white"
                data-testid="input-search-servers"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className={`cursor-pointer transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-primary/20 text-primary border-primary/50'
                    : 'text-white/60 border-white/20 hover:bg-white/10'
                }`}
                onClick={() => toggleTag(tag)}
                data-testid={`tag-${tag}`}
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="h-[calc(85vh-200px)] p-4">
          {isLoading ? (
            <div className="text-center py-12 text-white/50">
              Loading servers...
            </div>
          ) : servers.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-lg font-medium text-white/70 mb-2">No Servers Found</h3>
              <p className="text-white/50">
                {searchQuery || selectedTags.length > 0 
                  ? 'Try adjusting your search or tags' 
                  : 'Be the first to create a discoverable server!'
                }
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {servers.map((server) => {
                const isMember = userServerIds.has(server.id);
                
                return (
                  <Card 
                    key={server.id}
                    className="p-4 bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                    data-testid={`server-card-${server.id}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                        {server.icon ? (
                          <img src={server.icon} alt={server.name} className="w-full h-full object-cover rounded-xl" />
                        ) : (
                          <span className="text-2xl font-bold text-primary">
                            {server.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-white truncate">{server.name}</h3>
                        {server.description && (
                          <p className="text-sm text-white/60 line-clamp-2 mt-1">{server.description}</p>
                        )}
                        
                        {server.tags && server.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {server.tags.slice(0, 3).map((tag) => (
                              <Badge 
                                key={tag} 
                                variant="outline" 
                                className="text-xs text-white/50 border-white/20"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isMember ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onNavigateToServer(server.id)}
                            className="border-green-500/50 text-green-400"
                            data-testid={`button-open-server-${server.id}`}
                          >
                            Joined
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => joinServerMutation.mutate(server.id)}
                            disabled={joinServerMutation.isPending}
                            data-testid={`button-join-server-${server.id}`}
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}