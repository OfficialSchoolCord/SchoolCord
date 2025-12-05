import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, Send, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { DMThread, DMMessage, User } from '@shared/schema';

interface DMChatPanelProps {
  onClose: () => void;
  sessionId: string | null;
  userId: string;
  targetUserId?: string;
}

export function DMChatPanel({ onClose, sessionId, userId, targetUserId }: DMChatPanelProps) {
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { data: threadsData, isLoading: threadsLoading } = useQuery<{ threads: (DMThread & { otherUser?: Partial<User> })[] }>({
    queryKey: ['/api/dms/threads'],
    enabled: !!sessionId,
  });

  const { data: messagesData, refetch: refetchMessages } = useQuery<{ messages: DMMessage[] }>({
    queryKey: ['/api/dms/threads', selectedThreadId, 'messages'],
    enabled: !!sessionId && !!selectedThreadId,
    refetchInterval: 3000,
  });

  const startDMMutation = useMutation({
    mutationFn: async (targetId: string) => {
      return apiRequest('/api/dms/start', {
        method: 'POST',
        body: JSON.stringify({ targetUserId: targetId }),
      });
    },
    onSuccess: (data: { thread: DMThread }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/dms/threads'] });
      setSelectedThreadId(data.thread.id);
    },
    onError: (error: any) => {
      toast({ title: 'Cannot start conversation', description: error.message, variant: 'destructive' });
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest(`/api/dms/threads/${selectedThreadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      setNewMessage('');
      refetchMessages();
    },
    onError: (error: any) => {
      toast({ title: 'Failed to send message', description: error.message, variant: 'destructive' });
    },
  });

  useEffect(() => {
    if (targetUserId && !selectedThreadId) {
      startDMMutation.mutate(targetUserId);
    }
  }, [targetUserId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesData?.messages]);

  const threads = threadsData?.threads || [];
  const messages = messagesData?.messages || [];
  const selectedThread = threads.find(t => t.id === selectedThreadId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && selectedThreadId) {
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
      data-testid="dm-panel"
    >
      <div className="flex w-full max-w-4xl mx-auto">
        <div 
          className="w-80 flex flex-col border-r border-white/10"
          style={{ background: 'rgba(25, 20, 35, 0.95)' }}
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-white">Messages</h2>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white/70 hover:text-white"
              data-testid="button-close-dm"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <ScrollArea className="flex-1">
            {threadsLoading ? (
              <div className="p-4 text-center text-white/50">Loading conversations...</div>
            ) : threads.length === 0 ? (
              <div className="p-8 text-center text-white/50">
                <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No conversations yet</p>
                <p className="text-sm">Add friends to start chatting</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {threads.map((thread) => (
                  <Button
                    key={thread.id}
                    variant="ghost"
                    onClick={() => setSelectedThreadId(thread.id)}
                    className={`w-full justify-start p-3 h-auto ${
                      selectedThreadId === thread.id 
                        ? 'bg-white/10 text-white' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`}
                    data-testid={`thread-button-${thread.id}`}
                  >
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {thread.otherUser?.profilePicture ? (
                          <img src={thread.otherUser.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          thread.otherUser?.username?.charAt(0).toUpperCase() || '?'
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <p className="font-medium">{thread.otherUser?.username || 'Unknown User'}</p>
                      <p className="text-xs text-white/50">
                        {new Date(thread.lastMessageAt).toLocaleDateString()}
                      </p>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <div 
          className="flex-1 flex flex-col"
          style={{ background: 'rgba(30, 25, 40, 0.95)' }}
        >
          {selectedThreadId && selectedThread ? (
            <>
              <div className="p-4 border-b border-white/10 flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedThreadId(null)}
                  className="md:hidden text-white/70 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary/20 text-primary">
                    {selectedThread.otherUser?.profilePicture ? (
                      <img src={selectedThread.otherUser.profilePicture} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      selectedThread.otherUser?.username?.charAt(0).toUpperCase() || '?'
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-white">{selectedThread.otherUser?.username || 'Unknown User'}</p>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === userId;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        data-testid={`dm-message-${msg.id}`}
                      >
                        <div 
                          className={`max-w-[70%] p-3 rounded-2xl ${
                            isOwn 
                              ? 'bg-primary text-white rounded-br-md' 
                              : 'bg-white/10 text-white rounded-bl-md'
                          }`}
                        >
                          <p>{msg.message}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-white/50'}`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
              
              <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-white/5 border-white/10 text-white"
                    data-testid="input-dm-message"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={sendMessageMutation.isPending || !newMessage.trim()}
                    data-testid="button-send-dm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-white/50">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}