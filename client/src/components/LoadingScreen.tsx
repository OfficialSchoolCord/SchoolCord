
import { useState, useEffect } from 'react';
import { Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const LOADING_TIPS = [
  "SchoolCord connects you to the web through our secure cloud service",
  "Use the search bar to browse any website or search the web",
  "Level up by browsing websites and chatting with friends",
  "Join servers to connect with communities that share your interests",
  "Complete daily quests to earn XP and unlock badges",
  "Send friend requests to stay connected with others",
  "Explore discoverable servers to find new communities",
  "Use Quick Apps to access your favorite tools instantly",
  "Chat in the global room or join server-specific channels",
  "Customize your profile with unique badges and levels",
  "Admin and moderator tools help keep communities safe",
  "Your browsing history is private and secure",
  "DuckDuckGo is our default search engine for privacy",
  "Voice channels coming soon to SchoolCord!",
  "Server boosts unlock premium features for communities",
];

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [currentTip, setCurrentTip] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Rotate tips every 3 seconds
    const tipInterval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 3000);

    // Progress animation over 15 seconds
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          clearInterval(tipInterval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return prev + (100 / 150); // 150 steps over 15 seconds
      });
    }, 100);

    return () => {
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 max-w-md w-full px-6">
        {/* Spinning Purple Star */}
        <div 
          className="relative"
          style={{
            animation: 'spin 2s linear infinite',
          }}
        >
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(139, 92, 246, 0.1) 70%, transparent 100%)',
              boxShadow: '0 0 60px rgba(139, 92, 246, 0.6)',
            }}
          >
            <Sparkles className="w-12 h-12 text-purple-400" strokeWidth={2} />
          </div>
        </div>

        {/* Loading Text */}
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-white">
            Loading SchoolCord
          </h2>
          <p className="text-white/60 text-sm">
            Did you know?
          </p>
        </div>

        {/* Tip Display */}
        <div className="h-16 flex items-center justify-center text-center">
          <p 
            className="text-white/80 text-sm max-w-sm animate-fade-in"
            key={currentTip}
          >
            {LOADING_TIPS[currentTip]}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xs">
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-primary transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/40 text-xs text-center mt-2">
            {Math.floor(progress)}%
          </p>
        </div>

        {/* Skip Loading Section */}
        <div className="flex items-center gap-3 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onComplete}
            className="border-white/20 text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-skip-loading"
          >
            Skip Loading
          </Button>
          <div className="flex items-center gap-2 text-amber-400/80">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-xs">
              Skipping Loading Can Cause Errors With Searching / Proxy ( NOT RECOMMENDED )
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
