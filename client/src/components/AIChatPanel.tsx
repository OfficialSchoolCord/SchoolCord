import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiRequest } from '@/lib/queryClient';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/ai/chat', {
        message,
        history: messages.slice(-10),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success && data.message) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      }
    },
    onError: (error: any) => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const message = inputValue.trim();
    if (!message || chatMutation.isPending) return;

    setMessages(prev => [...prev, { role: 'user', content: message }]);
    setInputValue('');
    chatMutation.mutate(message);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center gap-3 pb-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white" data-testid="text-ai-title">AI Assistant</h2>
          <p className="text-sm text-white/60">Ask me anything</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Bot className="w-12 h-12 text-white/30 mb-4" />
              <p className="text-white/50 text-sm max-w-xs">
                Start a conversation with the AI assistant. Ask questions, get help with tasks, or just chat!
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              data-testid={`chat-message-${msg.role}-${index}`}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' 
                    ? 'bg-primary/20' 
                    : 'bg-gradient-to-br from-primary/30 to-primary/10'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-primary" />
                )}
              </div>
              <div 
                className={`max-w-[80%] rounded-xl px-4 py-2.5 ${
                  msg.role === 'user'
                    ? 'bg-primary/20 text-white'
                    : 'bg-white/10 text-white/90'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-3" data-testid="chat-loading">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-white/10 rounded-xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-white/60" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex gap-2 pt-3 border-t border-white/10">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          disabled={chatMutation.isPending}
          data-testid="input-chat-message"
        />
        <Button
          onClick={handleSend}
          disabled={!inputValue.trim() || chatMutation.isPending}
          size="icon"
          className="shrink-0"
          data-testid="button-send-chat"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
