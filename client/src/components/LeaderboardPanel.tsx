
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, Award, Crown, Shield, Star, Flame } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LeaderboardEntry, Badge } from '@shared/schema';

const BadgeIcon = ({ badge }: { badge?: Badge }) => {
  if (!badge) return null;
  
  const icons = {
    star: <Star className="w-4 h-4 text-yellow-400" fill="currentColor" />,
    shield: <Shield className="w-4 h-4 text-blue-400" fill="currentColor" />,
    goat: <Award className="w-4 h-4 text-purple-400" fill="currentColor" />,
    crown: <Crown className="w-4 h-4 text-yellow-500" fill="currentColor" />,
    fire: <Flame className="w-4 h-4 text-orange-500" fill="currentColor" />,
  };
  
  return icons[badge] || null;
};

export function LeaderboardPanel() {
  const { data } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const leaderboard: LeaderboardEntry[] = data?.leaderboard || [];

  return (
    <div className="h-full flex flex-col p-4" style={{ background: 'rgba(30, 20, 40, 0.95)', backdropFilter: 'blur(20px)' }}>
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
        <Trophy className="w-6 h-6 text-yellow-500" />
        <h2 className="text-xl font-bold text-white">Leaderboard</h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2">
          {leaderboard.map((entry, index) => (
            <div
              key={entry.userId}
              className="flex items-center gap-3 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 text-center">
                {index === 0 && <Medal className="w-5 h-5 text-yellow-500 mx-auto" />}
                {index === 1 && <Medal className="w-5 h-5 text-gray-400 mx-auto" />}
                {index === 2 && <Medal className="w-5 h-5 text-orange-600 mx-auto" />}
                {index > 2 && <span className="text-white/50 text-sm">#{index + 1}</span>}
              </div>

              <Avatar className="w-8 h-8 shrink-0">
                {entry.profilePicture && <AvatarImage src={entry.profilePicture} alt={entry.username} />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs">
                  {entry.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-white text-sm font-medium truncate">{entry.username}</span>
                  <BadgeIcon badge={entry.badge} />
                </div>
                <div className="text-xs text-white/50">
                  {entry.xp.toLocaleString()} XP
                </div>
              </div>

              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  {entry.level}
                </div>
                <div className="text-xs text-white/50">level</div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
