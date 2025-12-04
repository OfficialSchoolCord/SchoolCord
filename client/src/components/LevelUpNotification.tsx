
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp } from 'lucide-react';

interface LevelUpNotificationProps {
  newLevel: number;
  onComplete: () => void;
}

export function LevelUpNotification({ newLevel, onComplete }: LevelUpNotificationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-md border-2 border-yellow-500/50 rounded-lg p-4 shadow-2xl min-w-[280px]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-sm">NEW LEVEL UNLOCKED!</span>
            </div>
            <div className="text-2xl font-bold text-white">
              Level {newLevel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
