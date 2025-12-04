
import { LevelUpNotification } from './LevelUpNotification';


import { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Shield, Users, Loader2, Image as ImageIcon, Link as LinkIcon, Star, Crown, Flame, Upload } from 'lucide-react';
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
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [levelUpData, setLevelUpData] = useState<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

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
    mutationFn: async (data: { message: string; imageUrl?: string; linkUrl?: string }) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (sessionId) {
        headers['x-session-id'] = sessionId;
      }

      const response = await fetch(`/api/chat/${activeRoom}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setInputValue('');
      setImageUrl('');
      setLinkUrl('');
      setShowImageInput(false);
      setShowLinkInput(false);
      
      if (data.levelUp && data.levelUp.newLevel > data.levelUp.oldLevel) {
        setLevelUpData(data.levelUp);
      }
      
      refetch();
    },
  });

  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (shouldAutoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messagesData?.messages?.length, shouldAutoScroll]);
  
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 50;
    setShouldAutoScroll(isAtBottom);
  };

  const handleSend = () => {
    const message = inputValue.trim();
    if (!message || sendMessageMutation.isPending) return;

    sendMessageMutation.mutate({
      message,
      imageUrl: imageUrl.trim() || undefined,
      linkUrl: linkUrl.trim() || undefined,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB');
      return;
    }

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setImageUrl(base64);
        setShowImageInput(true);
        setUploadingImage(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Failed to upload image');
      setUploadingImage(false);
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

    const BadgeIcon = ({ badge, userId }: { badge?: string; userId?: string }) => {
      // Show custom badge only for current user
      const customBadge = localStorage.getItem('illing-star-custom-badge');
      const currentUserId = sessionId ? (messagesData as any)?.currentUserId : undefined;
      
      if (customBadge && userId === currentUserId) {
        return <span className="text-sm">{customBadge}</span>;
      }
      
      if (!badge) return null;
      if (badge === 'star') return <Star className="w-3 h-3 text-yellow-400" fill="currentColor" />;
      if (badge === 'shield') return <Shield className="w-3 h-3 text-blue-400" fill="currentColor" />;
      if (badge === 'crown') return <Crown className="w-3 h-3 text-yellow-500" fill="currentColor" />;
      if (badge === 'fire') return <Flame className="w-3 h-3 text-orange-500" fill="currentColor" />;
      return null;
    };

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
            {msg.level && (
              <span className="text-xs text-primary font-bold">Lv.{msg.level}</span>
            )}
            <BadgeIcon badge={msg.badge} userId={msg.userId} />
            <span className="text-xs text-white/40">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-sm text-white/90 break-words">{msg.message}</p>
          {msg.imageUrl && (
            <img 
              src={msg.imageUrl} 
              alt="Shared" 
              className="mt-2 max-w-xs rounded-lg border border-white/10"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
          {msg.linkUrl && (
            <a 
              href={msg.linkUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-1 text-xs text-blue-400 hover:underline"
            >
              <LinkIcon className="w-3 h-3" />
              {msg.linkUrl}
            </a>
          )}
        </div>
      </div>
    ));
  };

  return (
    <>
      {levelUpData && (
        <LevelUpNotification 
          newLevel={levelUpData.newLevel} 
          onComplete={() => setLevelUpData(null)} 
        />
      )}
      <div className="flex flex-col h-full max-h-full overflow-hidden">
      <Tabs value={activeRoom} onValueChange={(v) => setActiveRoom(v as ChatRoom)} className="flex-1 flex flex-col min-h-0">
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

        <TabsContent value="global" className="flex-1 mt-0 overflow-hidden flex flex-col">
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        </TabsContent>

        <TabsContent value="mod" className="flex-1 mt-0 overflow-hidden flex flex-col">
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        </TabsContent>

        <TabsContent value="admin" className="flex-1 mt-0 overflow-hidden flex flex-col">
          <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4" onScroll={handleScroll}>
            {renderMessages()}
            <div ref={messagesEndRef} />
          </div>
        </TabsContent>
      </Tabs>

      <div className="p-4 pt-3 border-t border-white/10 space-y-2 flex-shrink-0">
        {(showImageInput || showLinkInput) && (
          <div className="space-y-2">
            {showImageInput && (
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            )}
            {showLinkInput && (
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Link URL..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <input
            type="file"
            ref={imageInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button
            onClick={() => imageInputRef.current?.click()}
            size="icon"
            variant="ghost"
            className="shrink-0 text-white/70 hover:text-white"
            disabled={uploadingImage}
            title="Upload image from device"
          >
            {uploadingImage ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
          </Button>
          <Button
            onClick={() => setShowImageInput(!showImageInput)}
            size="icon"
            variant="ghost"
            className="shrink-0 text-white/70 hover:text-white"
            title="Image URL"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setShowLinkInput(!showLinkInput)}
            size="icon"
            variant="ghost"
            className="shrink-0 text-white/70 hover:text-white"
            title="Add link"
          >
            <LinkIcon className="w-4 h-4" />
          </Button>
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
    </div>
    </>
  );
}
