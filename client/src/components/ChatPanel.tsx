
import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ChatMessage, ChatRoom } from '@shared/schema';

interface ChatPanelProps {
  sessionId: string | null;
  userRole?: 'user' | 'mod' | 'admin';
}

export function ChatPanel({ sessionId, userRole = 'user' }: ChatPanelProps) {
  const [activeRoom, setActiveRoom] = useState<ChatRoom>('global');
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canAccessMod = userRole === 'mod' || userRole === 'admin';
  const canAccessAdmin = userRole === 'admin';

  const { data: messagesData, refetch } = useQuery({
    queryKey: ['chat-messages', activeRoom],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }
      
      const response = await fetch(`/api/chat/${activeRoom}`, { headers });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    refetchInterval: 2000, // Poll every 2 seconds
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/chat/${activeRoom}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: () => {
      setInputValue('');
      refetch();
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData]);

  const handleSend = () => {
    const message = inputValue.trim();
    if (!message || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages: ChatMessage[] = messagesData?.messages || [];

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <MessageSquare className="w-12 h-12 text-white/30 mb-4" />
          <p className="text-white/50 text-sm max-w-xs">
            No messages yet. Be the first to start the conversation!
          </p>
        </div>
      );
    }

    return messages.map((msg) => (
      <div key={msg.id} className="flex gap-3 mb-4">
        <Avatar className="w-8 h-8 shrink-0">
          {msg.profilePicture && <AvatarImage src={msg.profilePicture} alt={msg.username} />}
          <AvatarFallback className="bg-primary/20 text-primary text-xs">
            {msg.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="font-medium text-white text-sm">{msg.username}</span>
            <span className="text-xs text-white/40">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-white/90 break-words">{msg.message}</p>
        </div>
      </div>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs value={activeRoom} onValueChange={(v) => setActiveRoom(v as ChatRoom)} className="flex-1 flex flex-col">
        <div className="p-4 pb-0">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="global" className="data-[state=active]:bg-primary/20">
              <Users className="w-4 h-4 mr-2" />
              Global
            </TabsTrigger>
            <TabsTrigger value="mod" disabled={!canAccessMod} className="data-[state=active]:bg-primary/20">
              <Shield className="w-4 h-4 mr-2" />
              Mod
            </TabsTrigger>
            <TabsTrigger value="admin" disabled={!canAccessAdmin} className="data-[state=active]:bg-primary/20">
              <Shield className="w-4 h-4 mr-2" />
              Admin
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="global" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1 p-4">
            {renderMessages()}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="mod" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1 p-4">
            {renderMessages()}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="admin" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1 p-4">
            {renderMessages()}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </TabsContent>
      </Tabs>

      <div className="flex gap-2 p-4 pt-3 border-t border-white/10">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${activeRoom} chat...`}
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          disabled={sendMessageMutation.isPending}
          maxLength={500}
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || sendMessageMutation.isPending}
          size="icon"
          className="shrink-0"
        >
          {sendMessageMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
