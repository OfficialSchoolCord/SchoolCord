
import { useState } from 'react';
import { X, Users, Hash, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Server } from '@shared/schema';

interface ServerInviteDialogProps {
  serverId: string;
  onClose: () => void;
  onJoinSuccess: (serverId: string) => void;
  sessionId: string | null;
}

export function ServerInviteDialog({ serverId, onClose, onJoinSuccess, sessionId }: ServerInviteDialogProps) {
  const { toast } = useToast();
  const [isJoining, setIsJoining] = useState(false);

  const { data: serverData, isLoading } = useQuery<{ server: Server; isMember: boolean }>({
    queryKey: [`/api/servers/${serverId}`],
    enabled: !!sessionId,
  });

  const { data: membersData } = useQuery<{ members: any[] }>({
    queryKey: [`/api/servers/${serverId}/members`],
    enabled: !!sessionId && !!serverData?.server,
  });

  const joinServerMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) {
        throw new Error('You must be signed in to join servers');
      }
      const res = await apiRequest('POST', `/api/servers/${serverId}/join`, undefined, sessionId);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      toast({ title: 'Joined server!' });
      onJoinSuccess(serverId);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to join', description: error.message, variant: 'destructive' });
    },
  });

  const handleJoin = async () => {
    if (!sessionId) {
      toast({ title: 'Sign in required', description: 'Please sign in to join servers', variant: 'destructive' });
      return;
    }
    setIsJoining(true);
    await joinServerMutation.mutateAsync();
    setIsJoining(false);
  };

  const server = serverData?.server;
  const isMember = serverData?.isMember;
  const memberCount = membersData?.members?.length || 0;

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-white/10 p-8">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-white/60">Loading server...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!server) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-white/10 p-8">
          <div className="flex flex-col items-center gap-4">
            <p className="text-white/60">Server not found</p>
            <Button onClick={onClose}>Close</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card border-white/10 overflow-hidden">
        {/* Header with background */}
        <div 
          className="relative h-24 bg-gradient-to-br from-purple-600/20 to-primary/20"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
          }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Server Info */}
        <div className="p-6 -mt-12 relative">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-card">
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-primary/20 text-3xl">
                  {server.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>

            <div className="flex-1 pt-4">
              <h2 className="text-2xl font-bold text-white mb-1">{server.name}</h2>
              {server.description && (
                <p className="text-white/60 text-sm">{server.description}</p>
              )}
            </div>
          </div>

          {/* Server Stats */}
          <div className="mt-6 flex items-center gap-6">
            <div className="flex items-center gap-2 text-white/60">
              <Users className="w-4 h-4" />
              <span className="text-sm">
                <strong className="text-white">{memberCount}</strong> Members
              </span>
            </div>
            <div className="flex items-center gap-2 text-white/60">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm">Active</span>
            </div>
          </div>

          {/* Tags */}
          {server.tags && server.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {server.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Join Button */}
          <div className="mt-6">
            {isMember ? (
              <Button
                className="w-full bg-green-600 hover:bg-green-700"
                onClick={() => {
                  onJoinSuccess(serverId);
                }}
              >
                Already a Member
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                className="w-full bg-primary hover:bg-primary/90"
                onClick={handleJoin}
                disabled={isJoining || !sessionId}
              >
                {isJoining ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : !sessionId ? (
                  'Sign in to Join'
                ) : (
                  <>
                    Join Server
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>

          {!sessionId && (
            <p className="text-white/40 text-xs text-center mt-3">
              You must be signed in to join servers
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
