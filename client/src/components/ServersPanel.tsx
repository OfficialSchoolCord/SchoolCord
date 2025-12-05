import { useState, useEffect } from 'react';
import { X, Server, Plus, Hash, Volume2, MessageSquare, Settings, Users, Trash2, LogOut, Bot, Quote, ArrowLeft, Copy, Link, Phone, PhoneOff, UserPlus, Edit2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Server as ServerType, Channel, ChannelMessage, ChannelType, ServerMember } from '@shared/schema';

interface ServersPanelProps {
  onClose: () => void;
  sessionId: string | null;
  user: any;
  preselectedServerId?: string;
}

export function ServersPanel({ onClose, sessionId, user, preselectedServerId }: ServersPanelProps) {
  const [selectedServerId, setSelectedServerId] = useState<string | null>(preselectedServerId || null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [showCreateServer, setShowCreateServer] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [showServerSettings, setShowServerSettings] = useState(false);
  const [inVoiceChannel, setInVoiceChannel] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: serversData, isLoading: serversLoading } = useQuery<{ servers: ServerType[] }>({
    queryKey: ['/api/servers'],
    enabled: !!sessionId,
    queryFn: async () => {
      const res = await fetch('/api/servers', {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch servers');
      return res.json();
    },
  });

  const { data: channelsData } = useQuery<{ channels: Channel[] }>({
    queryKey: ['/api/servers', selectedServerId, 'channels'],
    enabled: !!sessionId && !!selectedServerId,
    queryFn: async () => {
      const res = await fetch(`/api/servers/${selectedServerId}/channels`, {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch channels');
      return res.json();
    },
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery<{ messages: ChannelMessage[] }>({
    queryKey: ['/api/channels', selectedChannelId, 'messages'],
    enabled: !!sessionId && !!selectedChannelId,
    refetchInterval: 3000,
    queryFn: async () => {
      const res = await fetch(`/api/channels/${selectedChannelId}/messages`, {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
  });

  const { data: serverInfo } = useQuery<{ server: ServerType; isMember: boolean; isAdmin: boolean }>({
    queryKey: ['/api/servers', selectedServerId],
    enabled: !!sessionId && !!selectedServerId,
    queryFn: async () => {
      const res = await fetch(`/api/servers/${selectedServerId}`, {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch server info');
      return res.json();
    },
  });

  const { data: membersData } = useQuery<{ members: (ServerMember & { user?: any })[] }>({
    queryKey: ['/api/servers', selectedServerId, 'members'],
    enabled: !!sessionId && !!selectedServerId,
    queryFn: async () => {
      const res = await fetch(`/api/servers/${selectedServerId}/members`, {
        headers: { 'x-session-id': sessionId || '' },
      });
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
  });

  const createServerMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; discoverable: boolean }) => {
      const res = await fetch('/api/servers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create server');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setShowCreateServer(false);
      toast({ title: 'Server created successfully!' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; type: ChannelType; topic?: string }) => {
      const res = await fetch(`/api/servers/${selectedServerId}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create channel');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId, 'channels'] });
      setShowCreateChannel(false);
      toast({ title: 'Channel created' });
    },
  });

  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const res = await fetch(`/api/channels/${channelId}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId || '',
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete channel');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId, 'channels'] });
      setSelectedChannelId(null);
      toast({ title: 'Channel deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const res = await fetch(`/api/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }
      return res.json();
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
  });

  const leaveServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const res = await fetch(`/api/servers/${serverId}/leave`, {
        method: 'POST',
        headers: {
          'x-session-id': sessionId || '',
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to leave server');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setSelectedServerId(null);
      setSelectedChannelId(null);
      toast({ title: 'Left server' });
    },
  });

  const deleteServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const res = await fetch(`/api/servers/${serverId}`, {
        method: 'DELETE',
        headers: {
          'x-session-id': sessionId || '',
        },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete server');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setSelectedServerId(null);
      setSelectedChannelId(null);
      setShowServerSettings(false);
      toast({ title: 'Server deleted' });
    },
  });

  const updateServerMutation = useMutation({
    mutationFn: async (data: { name?: string; description?: string; discoverable?: boolean }) => {
      const res = await fetch(`/api/servers/${selectedServerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId || '',
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update server');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId] });
      toast({ title: 'Server updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const servers = serversData?.servers || [];
  const channels = channelsData?.channels || [];
  const messages = messagesData?.messages || [];
  const members = membersData?.members || [];
  const isAdmin = serverInfo?.isAdmin || false;
  const selectedServer = servers.find(s => s.id === selectedServerId);
  const selectedChannel = channels.find(c => c.id === selectedChannelId);

  const textChannels = channels.filter(c => c.type === 'text');
  const voiceChannels = channels.filter(c => c.type === 'voice');
  const otherChannels = channels.filter(c => c.type !== 'text' && c.type !== 'voice');

  const getChannelIcon = (type: ChannelType) => {
    switch (type) {
      case 'voice': return <Volume2 className="w-4 h-4" />;
      case 'quote': return <Quote className="w-4 h-4" />;
      case 'bot': return <Bot className="w-4 h-4" />;
      default: return <Hash className="w-4 h-4" />;
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessageMutation.mutate(newMessage.trim());
    }
  };

  const handleJoinVoice = (channelId: string) => {
    if (inVoiceChannel === channelId) {
      setInVoiceChannel(null);
      toast({ title: 'Left voice channel' });
    } else {
      setInVoiceChannel(channelId);
      setSelectedChannelId(channelId);
      toast({ title: 'Joined voice channel', description: 'Voice chat is simulated - real-time voice coming soon!' });
    }
  };

  const handleDeleteChannel = (channelId: string, channelName: string) => {
    if (window.confirm(`Are you sure you want to delete #${channelName}? This cannot be undone.`)) {
      deleteChannelMutation.mutate(channelId);
    }
  };

  const generateInviteLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}?invite=${selectedServerId}`;
  };

  const copyInviteLink = async () => {
    const link = generateInviteLink();
    await navigator.clipboard.writeText(link);
    toast({ title: 'Invite link copied!' });
  };

  return (
    <div 
      className="fixed inset-0 ml-16 flex z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="servers-panel"
    >
      <div className="flex w-full h-full">
        <div 
          className="w-20 flex flex-col items-center py-4 gap-2 border-r border-white/10"
          style={{ background: 'rgba(20, 15, 30, 0.95)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white mb-2"
            data-testid="button-back-servers"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowCreateServer(true)}
            className="w-12 h-12 rounded-full bg-white/10 hover:bg-primary/20 text-white/70 hover:text-white"
            data-testid="button-create-server"
          >
            <Plus className="w-6 h-6" />
          </Button>
          <div className="w-8 h-0.5 bg-white/20 my-2" />
          
          {servers.map((server) => (
            <Button
              key={server.id}
              variant="ghost"
              size="icon"
              onClick={() => {
                setSelectedServerId(server.id);
                setSelectedChannelId(null);
              }}
              className={`w-12 h-12 rounded-full ${
                selectedServerId === server.id 
                  ? 'bg-primary/30 text-primary' 
                  : 'bg-white/10 text-white/70 hover:text-white'
              }`}
              data-testid={`server-button-${server.id}`}
            >
              {server.icon ? (
                <img src={server.icon} alt={server.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <span className="text-sm font-medium">{server.name.charAt(0).toUpperCase()}</span>
              )}
            </Button>
          ))}
        </div>

        {selectedServerId ? (
          <>
            <div 
              className="w-60 flex flex-col border-r border-white/10"
              style={{ background: 'rgba(25, 20, 35, 0.95)' }}
            >
              <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2">
                <h3 className="font-semibold text-white truncate flex-1">{selectedServer?.name}</h3>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowServerSettings(true)}
                    className="text-white/70 hover:text-white shrink-0"
                    data-testid="button-server-settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {textChannels.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 py-1">
                        <span className="text-xs font-medium text-white/50 uppercase">Text Channels</span>
                        {isAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowCreateChannel(true)}
                            className="w-5 h-5 text-white/50 hover:text-white"
                            data-testid="button-create-channel"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      
                      {textChannels.map((channel) => (
                        <div key={channel.id} className="group flex items-center gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedChannelId(channel.id)}
                            className={`flex-1 justify-start gap-2 ${
                              selectedChannelId === channel.id 
                                ? 'bg-white/10 text-white' 
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                            data-testid={`channel-button-${channel.id}`}
                          >
                            {getChannelIcon(channel.type)}
                            <span className="truncate">{channel.name}</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChannel(channel.id, channel.name)}
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              data-testid={`button-delete-channel-${channel.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {voiceChannels.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 py-1 mt-4">
                        <span className="text-xs font-medium text-white/50 uppercase">Voice Channels</span>
                      </div>
                      
                      {voiceChannels.map((channel) => (
                        <div key={channel.id} className="group">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              onClick={() => handleJoinVoice(channel.id)}
                              className={`flex-1 justify-start gap-2 ${
                                inVoiceChannel === channel.id 
                                  ? 'bg-green-500/20 text-green-400' 
                                  : 'text-white/60 hover:text-white hover:bg-white/5'
                              }`}
                              data-testid={`voice-channel-button-${channel.id}`}
                            >
                              <Volume2 className="w-4 h-4" />
                              <span className="truncate">{channel.name}</span>
                              {inVoiceChannel === channel.id && (
                                <Phone className="w-3 h-3 ml-auto text-green-400" />
                              )}
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteChannel(channel.id, channel.name)}
                                className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                data-testid={`button-delete-voice-channel-${channel.id}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                          {inVoiceChannel === channel.id && (
                            <div className="ml-6 mt-1 p-2 bg-white/5 rounded text-xs text-white/60">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span>Connected</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/80">
                                <Avatar className="w-5 h-5">
                                  <AvatarFallback className="text-[10px] bg-primary/20">
                                    {user?.username?.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span>{user?.username}</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setInVoiceChannel(null)}
                                className="w-full mt-2 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                data-testid="button-leave-voice"
                              >
                                <PhoneOff className="w-3 h-3 mr-2" />
                                Disconnect
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {otherChannels.length > 0 && (
                    <>
                      <div className="flex items-center justify-between px-2 py-1 mt-4">
                        <span className="text-xs font-medium text-white/50 uppercase">Other Channels</span>
                      </div>
                      
                      {otherChannels.map((channel) => (
                        <div key={channel.id} className="group flex items-center gap-1">
                          <Button
                            variant="ghost"
                            onClick={() => setSelectedChannelId(channel.id)}
                            className={`flex-1 justify-start gap-2 ${
                              selectedChannelId === channel.id 
                                ? 'bg-white/10 text-white' 
                                : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                            data-testid={`channel-button-${channel.id}`}
                          >
                            {getChannelIcon(channel.type)}
                            <span className="truncate">{channel.name}</span>
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteChannel(channel.id, channel.name)}
                              className="w-6 h-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                              data-testid={`button-delete-channel-${channel.id}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </>
                  )}

                  {channels.length === 0 && (
                    <div className="text-center py-4 text-white/40 text-sm">
                      No channels yet
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          onClick={() => setShowCreateChannel(true)}
                          className="block mx-auto mt-2 text-primary"
                        >
                          Create one
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-2 border-t border-white/10 space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyInviteLink}
                  className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
                  data-testid="button-copy-invite"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite People
                </Button>
                
                {isAdmin && selectedServer?.ownerId === user?.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this server? This cannot be undone.')) {
                        deleteServerMutation.mutate(selectedServerId);
                      }
                    }}
                    className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    data-testid="button-delete-server"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Server
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => leaveServerMutation.mutate(selectedServerId)}
                    className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
                    data-testid="button-leave-server"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Leave Server
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col" style={{ background: 'rgba(30, 25, 40, 0.95)' }}>
              {selectedChannelId && selectedChannel?.type === 'voice' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8">
                  <div className="p-4 border-b border-white/10 flex items-center justify-between w-full absolute top-0 left-0 right-0">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-white/70" />
                      <span className="font-medium text-white">
                        {selectedChannel?.name}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onClose}
                      className="text-white/70 hover:text-white"
                      data-testid="button-close-servers"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Volume2 className="w-20 h-20 mx-auto mb-6 text-white/30" />
                    <h3 className="text-xl font-medium text-white mb-2">Voice Channel</h3>
                    <p className="text-white/50 mb-6 max-w-md">
                      {inVoiceChannel === selectedChannelId 
                        ? "You're connected to this voice channel. Voice chat simulation is active."
                        : "Click below to join the voice channel and start chatting with others."}
                    </p>
                    
                    {inVoiceChannel === selectedChannelId ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2 text-green-400">
                          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
                          <span>Connected</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                          {members.slice(0, 4).map((member) => (
                            <div key={member.id} className="flex flex-col items-center">
                              <Avatar className="w-16 h-16 border-2 border-green-400/50">
                                <AvatarFallback className="bg-primary/20 text-lg">
                                  {member.user?.username?.charAt(0).toUpperCase() || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-white/70 mt-2">{member.user?.username}</span>
                            </div>
                          ))}
                        </div>
                        <Button
                          variant="destructive"
                          onClick={() => setInVoiceChannel(null)}
                          className="mt-4"
                          data-testid="button-disconnect-voice"
                        >
                          <PhoneOff className="w-4 h-4 mr-2" />
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleJoinVoice(selectedChannelId)}
                        className="bg-green-600 hover:bg-green-500"
                        data-testid="button-join-voice"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        Join Voice Channel
                      </Button>
                    )}
                  </div>
                </div>
              ) : selectedChannelId ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(selectedChannel?.type || 'text')}
                      <span className="font-medium text-white">
                        {selectedChannel?.name}
                      </span>
                      {selectedChannel?.topic && (
                        <span className="text-white/40 text-sm ml-2">| {selectedChannel.topic}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId, 'members'] })}
                        className="text-white/70 hover:text-white"
                        data-testid="button-show-members"
                      >
                        <Users className="w-5 h-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="text-white/70 hover:text-white"
                        data-testid="button-close-servers"
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                          <p>No messages yet. Start the conversation!</p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div key={msg.id} className="flex gap-3" data-testid={`message-${msg.id}`}>
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">
                              {msg.profilePicture ? (
                                <img src={msg.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
                              ) : (
                                msg.username.charAt(0).toUpperCase()
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">{msg.username}</span>
                              {msg.level && (
                                <Badge variant="outline" className="text-xs text-primary/70 border-primary/30">
                                  Lv.{msg.level}
                                </Badge>
                              )}
                              <span className="text-xs text-white/40">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-white/80 mt-1">{msg.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={`Message #${selectedChannel?.name || 'channel'}`}
                        className="flex-1 bg-white/5 border-white/10 text-white"
                        data-testid="input-channel-message"
                      />
                      <Button type="submit" disabled={sendMessageMutation.isPending} data-testid="button-send-message">
                        Send
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-white/50">
                    <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>Select a channel to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center" style={{ background: 'rgba(30, 25, 40, 0.95)' }}>
            <div className="text-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
                data-testid="button-close-servers-empty"
              >
                <X className="w-5 h-5" />
              </Button>
              <Server className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-xl font-medium text-white/70 mb-2">No Server Selected</h3>
              <p className="text-white/50 mb-4">Select a server or create a new one</p>
              <Button onClick={() => setShowCreateServer(true)} data-testid="button-create-first-server">
                <Plus className="w-4 h-4 mr-2" />
                Create Server
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={showCreateServer} onOpenChange={setShowCreateServer}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateServer(false)}
              className="text-white/70 hover:text-white"
              data-testid="button-back-create-server"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-white">Create Server</DialogTitle>
          </DialogHeader>
          <CreateServerForm 
            onSubmit={(data) => createServerMutation.mutate(data)}
            isPending={createServerMutation.isPending}
            onCancel={() => setShowCreateServer(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowCreateChannel(false)}
              className="text-white/70 hover:text-white"
              data-testid="button-back-create-channel"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-white">Create Channel</DialogTitle>
          </DialogHeader>
          <CreateChannelForm 
            onSubmit={(data) => createChannelMutation.mutate(data)}
            isPending={createChannelMutation.isPending}
            onCancel={() => setShowCreateChannel(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showServerSettings} onOpenChange={setShowServerSettings}>
        <DialogContent className="bg-card border-white/10 max-w-lg">
          <DialogHeader className="flex flex-row items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowServerSettings(false)}
              className="text-white/70 hover:text-white"
              data-testid="button-back-server-settings"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <DialogTitle className="text-white">Server Settings</DialogTitle>
          </DialogHeader>
          <ServerSettingsForm
            server={selectedServer}
            members={members}
            isOwner={selectedServer?.ownerId === user?.id}
            onUpdate={(data) => updateServerMutation.mutate(data)}
            onDelete={() => {
              if (window.confirm('Are you sure you want to delete this server? This cannot be undone.')) {
                deleteServerMutation.mutate(selectedServerId!);
              }
            }}
            isPending={updateServerMutation.isPending}
            inviteLink={generateInviteLink()}
            onCopyInvite={copyInviteLink}
            onClose={() => setShowServerSettings(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateServerForm({ onSubmit, isPending, onCancel }: { onSubmit: (data: any) => void; isPending: boolean; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discoverable, setDiscoverable] = useState(false);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, description, discoverable }); }} className="space-y-4">
      <div>
        <label className="text-sm text-white/70">Server Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Awesome Server"
          className="bg-white/5 border-white/10 text-white mt-1"
          required
          data-testid="input-server-name"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's your server about?"
          className="bg-white/5 border-white/10 text-white mt-1 resize-none"
          data-testid="input-server-description"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm text-white">Make Discoverable</label>
          <p className="text-xs text-white/50">Allow users to find your server</p>
        </div>
        <Switch checked={discoverable} onCheckedChange={setDiscoverable} data-testid="switch-discoverable" />
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-server">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isPending || !name.trim()} data-testid="button-submit-server">
          {isPending ? 'Creating...' : 'Create Server'}
        </Button>
      </div>
    </form>
  );
}

function CreateChannelForm({ onSubmit, isPending, onCancel }: { onSubmit: (data: any) => void; isPending: boolean; onCancel?: () => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<ChannelType>('text');
  const [topic, setTopic] = useState('');

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit({ name, type, topic }); }} className="space-y-4">
      <div>
        <label className="text-sm text-white/70">Channel Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="general"
          className="bg-white/5 border-white/10 text-white mt-1"
          required
          data-testid="input-channel-name"
        />
      </div>
      <div>
        <label className="text-sm text-white/70">Channel Type</label>
        <Select value={type} onValueChange={(v) => setType(v as ChannelType)}>
          <SelectTrigger className="bg-white/5 border-white/10 text-white mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="text">Text Channel</SelectItem>
            <SelectItem value="voice">Voice Channel</SelectItem>
            <SelectItem value="quote">Quote Channel</SelectItem>
            <SelectItem value="bot">Bot Channel</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-sm text-white/70">Topic (optional)</label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What's this channel about?"
          className="bg-white/5 border-white/10 text-white mt-1"
          data-testid="input-channel-topic"
        />
      </div>
      <div className="flex gap-2">
        {onCancel && (
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel} data-testid="button-cancel-channel">
            Cancel
          </Button>
        )}
        <Button type="submit" className="flex-1" disabled={isPending || !name.trim()} data-testid="button-submit-channel">
          {isPending ? 'Creating...' : 'Create Channel'}
        </Button>
      </div>
    </form>
  );
}

interface ServerSettingsFormProps {
  server?: ServerType;
  members: any[];
  isOwner: boolean;
  onUpdate: (data: any) => void;
  onDelete: () => void;
  isPending: boolean;
  inviteLink: string;
  onCopyInvite: () => void;
  onClose: () => void;
}

function ServerSettingsForm({ server, members, isOwner, onUpdate, onDelete, isPending, inviteLink, onCopyInvite, onClose }: ServerSettingsFormProps) {
  const [name, setName] = useState(server?.name || '');
  const [description, setDescription] = useState(server?.description || '');
  const [discoverable, setDiscoverable] = useState(server?.discoverable || false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setName(server?.name || '');
    setDescription(server?.description || '');
    setDiscoverable(server?.discoverable || false);
  }, [server]);

  const handleChange = () => {
    setHasChanges(true);
  };

  const handleSave = () => {
    onUpdate({ name, description, discoverable });
    setHasChanges(false);
  };

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full bg-white/5">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
        <TabsTrigger value="invite" className="flex-1">Invite</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview" className="space-y-4 mt-4">
        <div>
          <label className="text-sm text-white/70">Server Name</label>
          <Input
            value={name}
            onChange={(e) => { setName(e.target.value); handleChange(); }}
            className="bg-white/5 border-white/10 text-white mt-1"
            data-testid="input-edit-server-name"
          />
        </div>
        <div>
          <label className="text-sm text-white/70">Description</label>
          <Textarea
            value={description}
            onChange={(e) => { setDescription(e.target.value); handleChange(); }}
            className="bg-white/5 border-white/10 text-white mt-1 resize-none"
            data-testid="input-edit-server-description"
          />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm text-white">Make Discoverable</label>
            <p className="text-xs text-white/50">Allow users to find your server</p>
          </div>
          <Switch 
            checked={discoverable} 
            onCheckedChange={(v) => { setDiscoverable(v); handleChange(); }}
            data-testid="switch-edit-discoverable"
          />
        </div>
        
        <div className="flex gap-2 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={onClose}
            data-testid="button-close-settings"
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            className="flex-1" 
            disabled={isPending || !hasChanges}
            onClick={handleSave}
            data-testid="button-save-server-settings"
          >
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
        
        {isOwner && (
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-red-400 font-medium mb-2">Danger Zone</h4>
            <Button 
              variant="destructive" 
              className="w-full"
              onClick={onDelete}
              data-testid="button-delete-server-settings"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Server
            </Button>
          </div>
        )}
      </TabsContent>
      
      <TabsContent value="members" className="mt-4">
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-3 p-2 rounded bg-white/5">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary/20 text-sm">
                    {member.user?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white text-sm">{member.user?.username || 'Unknown'}</p>
                  <p className="text-white/40 text-xs">
                    {member.roles.includes('owner') ? 'Owner' : 
                     member.roles.includes('admin') ? 'Admin' : 'Member'}
                  </p>
                </div>
                {member.user?.level && (
                  <Badge variant="outline" className="text-xs">Lv.{member.user.level}</Badge>
                )}
              </div>
            ))}
            {members.length === 0 && (
              <p className="text-center text-white/40 py-4">No members yet</p>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
      
      <TabsContent value="invite" className="mt-4 space-y-4">
        <div>
          <label className="text-sm text-white/70 mb-2 block">Invite Link</label>
          <div className="flex gap-2">
            <Input
              value={inviteLink}
              readOnly
              className="bg-white/5 border-white/10 text-white/70"
              data-testid="input-invite-link"
            />
            <Button onClick={onCopyInvite} data-testid="button-copy-invite-link">
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-white/50 mt-2">
            Share this link with others to invite them to your server
          </p>
        </div>
        
        <div className="bg-white/5 p-4 rounded-lg">
          <h4 className="text-white font-medium mb-2 flex items-center gap-2">
            <Link className="w-4 h-4" />
            How to invite
          </h4>
          <ol className="text-white/60 text-sm space-y-2 list-decimal list-inside">
            <li>Copy the invite link above</li>
            <li>Share it with your friends</li>
            <li>They can join by visiting the link</li>
          </ol>
        </div>
      </TabsContent>
    </Tabs>
  );
}
