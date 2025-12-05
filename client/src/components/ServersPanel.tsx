import { useState } from 'react';
import { X, Server, Plus, Hash, Volume2, MessageSquare, Settings, Users, Trash2, LogOut, Bot, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Server as ServerType, Channel, ChannelMessage, ChannelType } from '@shared/schema';

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
  const { toast } = useToast();

  const { data: serversData, isLoading: serversLoading } = useQuery<{ servers: ServerType[] }>({
    queryKey: ['/api/servers'],
    enabled: !!sessionId,
  });

  const { data: channelsData } = useQuery<{ channels: Channel[] }>({
    queryKey: ['/api/servers', selectedServerId, 'channels'],
    enabled: !!sessionId && !!selectedServerId,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery<{ messages: ChannelMessage[] }>({
    queryKey: ['/api/channels', selectedChannelId, 'messages'],
    enabled: !!sessionId && !!selectedChannelId,
    refetchInterval: 3000,
  });

  const { data: serverInfo } = useQuery<{ server: ServerType; isMember: boolean; isAdmin: boolean }>({
    queryKey: ['/api/servers', selectedServerId],
    enabled: !!sessionId && !!selectedServerId,
  });

  const createServerMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; discoverable: boolean }) => {
      return apiRequest('/api/servers', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setShowCreateServer(false);
      toast({ title: 'Server created' });
    },
  });

  const createChannelMutation = useMutation({
    mutationFn: async (data: { name: string; type: ChannelType; topic?: string }) => {
      return apiRequest(`/api/servers/${selectedServerId}/channels`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers', selectedServerId, 'channels'] });
      setShowCreateChannel(false);
      toast({ title: 'Channel created' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest(`/api/channels/${selectedChannelId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
  });

  const leaveServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      return apiRequest(`/api/servers/${serverId}/leave`, { method: 'POST' });
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
      return apiRequest(`/api/servers/${serverId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/servers'] });
      setSelectedServerId(null);
      setSelectedChannelId(null);
      toast({ title: 'Server deleted' });
    },
  });

  const servers = serversData?.servers || [];
  const channels = channelsData?.channels || [];
  const messages = messagesData?.messages || [];
  const isAdmin = serverInfo?.isAdmin || false;
  const selectedServer = servers.find(s => s.id === selectedServerId);

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
              <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-white truncate">{selectedServer?.name}</h3>
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowServerSettings(true)}
                    className="text-white/70 hover:text-white"
                    data-testid="button-server-settings"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <ScrollArea className="flex-1">
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1">
                    <span className="text-xs font-medium text-white/50 uppercase">Channels</span>
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
                  
                  {channels.map((channel) => (
                    <Button
                      key={channel.id}
                      variant="ghost"
                      onClick={() => setSelectedChannelId(channel.id)}
                      className={`w-full justify-start gap-2 ${
                        selectedChannelId === channel.id 
                          ? 'bg-white/10 text-white' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                      data-testid={`channel-button-${channel.id}`}
                    >
                      {getChannelIcon(channel.type)}
                      <span className="truncate">{channel.name}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="p-2 border-t border-white/10">
                {isAdmin && selectedServer?.ownerId === user?.id ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteServerMutation.mutate(selectedServerId)}
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
              {selectedChannelId ? (
                <>
                  <div className="p-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getChannelIcon(channels.find(c => c.id === selectedChannelId)?.type || 'text')}
                      <span className="font-medium text-white">
                        {channels.find(c => c.id === selectedChannelId)?.name}
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
                  
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
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
                        placeholder="Type a message..."
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
          <DialogHeader>
            <DialogTitle className="text-white">Create Server</DialogTitle>
          </DialogHeader>
          <CreateServerForm 
            onSubmit={(data) => createServerMutation.mutate(data)}
            isPending={createServerMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showCreateChannel} onOpenChange={setShowCreateChannel}>
        <DialogContent className="bg-card border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Create Channel</DialogTitle>
          </DialogHeader>
          <CreateChannelForm 
            onSubmit={(data) => createChannelMutation.mutate(data)}
            isPending={createChannelMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateServerForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
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
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()} data-testid="button-submit-server">
        Create Server
      </Button>
    </form>
  );
}

function CreateChannelForm({ onSubmit, isPending }: { onSubmit: (data: any) => void; isPending: boolean }) {
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
      <Button type="submit" className="w-full" disabled={isPending || !name.trim()} data-testid="button-submit-channel">
        Create Channel
      </Button>
    </form>
  );
}