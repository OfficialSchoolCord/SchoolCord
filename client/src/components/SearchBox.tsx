import { useState, useRef, useEffect } from 'react';
import { ArrowRight, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  initialValue?: string;
  compact?: boolean;
}

export function SearchBox({ onSearch, isLoading = false, initialValue = '', compact = false }: SearchBoxProps) {
  const [query, setQuery] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  if (compact) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div 
          className="flex items-center gap-3 px-4 py-2 rounded-full flex-1 min-w-0"
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Search className="w-4 h-4 text-white/50 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or enter URL..."
            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder:text-white/40 min-w-0"
            disabled={isLoading}
            data-testid="input-search-compact"
          />
        </div>
        <Button
          type="submit"
          size="icon"
          disabled={!query.trim() || isLoading}
          className="bg-primary hover:bg-primary/90 rounded-full flex-shrink-0"
          data-testid="button-search-compact"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ArrowRight className="w-4 h-4" />
          )}
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div 
        className="search-glow flex items-center gap-4 px-6 py-4 rounded-full transition-all duration-300"
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <Search className="w-5 h-5 text-white/40 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search with DuckDuckGo or Enter URL..."
          className="flex-1 bg-transparent border-none outline-none text-white text-base placeholder:text-white/40 font-light tracking-wide"
          disabled={isLoading}
          autoFocus
          data-testid="input-search-main"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!query.trim() || isLoading}
          className="bg-primary/80 hover:bg-primary rounded-full h-10 w-10 transition-all duration-200 flex-shrink-0"
          data-testid="button-search-main"
          style={{
            boxShadow: query.trim() ? '0 0 15px rgba(220, 38, 38, 0.4)' : 'none',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </Button>
      </div>
    </form>
  );
}
