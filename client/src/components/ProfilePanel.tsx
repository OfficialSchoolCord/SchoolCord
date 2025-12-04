import { useState } from 'react';
import { X, User, Star, Clock, Globe, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ProfilePanelProps {
  visitCount: number;
  onClose: () => void;
  user: any | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdateProfile: (username: string, profilePicture?: string) => void;
}

export function ProfilePanel({ visitCount, onClose, user, onSignIn, onSignOut, onUpdateProfile }: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editProfilePic, setEditProfilePic] = useState(user?.profilePicture || '');

  const handleSave = () => {
    onUpdateProfile(editUsername, editProfilePic);
    setIsEditing(false);
  };

  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
      data-testid="profile-panel"
    >
      <Card 
        className="w-full max-w-sm border-white/10"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Profile</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-close-profile"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6">
          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/60 text-center">Sign in to save your browsing history, quick apps, and settings.</p>
              <Button
                onClick={onSignIn}
                className="bg-primary hover:bg-primary/90"
              >
                Sign In
              </Button>
            </div>
          ) : (
            <div>
              <div className="flex flex-col items-center mb-8">
                <Avatar className="w-20 h-20 mb-4">
                  <AvatarFallback 
                    className="text-2xl font-semibold"
                    style={{
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%)',
                      color: 'white',
                    }}
                  >
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.username} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <User className="w-10 h-10" />
                    )}
                  </AvatarFallback>
                </Avatar>
                {isEditing ? (
                  <div className="w-full space-y-2">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                      placeholder="Username"
                    />
                    <input
                      type="text"
                      value={editProfilePic}
                      onChange={(e) => setEditProfilePic(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                      placeholder="Profile Picture URL"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="flex-1">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white">{user.username}</h3>
                    <p className="text-sm text-white/50">{user.isAdmin ? 'Administrator' : 'Cloud Browser User'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditUsername(user.username);
                        setEditProfilePic(user.profilePicture || '');
                        setIsEditing(true);
                      }}
                      className="mt-2 text-white/70"
                    >
                      Edit Profile
                    </Button>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <StatItem 
                  icon={<Star className="w-5 h-5" />}
                  label="Level"
                  value={`${user.level || 1}`}
                  valueColor="text-yellow-400"
                />
                <StatItem 
                  icon={<Sparkles className="w-5 h-5" />}
                  label="XP"
                  value={`${user.xp || 0}`}
                  valueColor="text-purple-400"
                />
                <StatItem 
                  icon={<Globe className="w-5 h-5" />}
                  label="Pages Visited"
                  value={visitCount.toString()}
                />
                <StatItem 
                  icon={<Clock className="w-5 h-5" />}
                  label="Session Started"
                  value={new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                />
              </div>

              <div className="p-4 border-t border-white/10 space-y-3">
                <div 
                  className="flex items-center justify-center gap-2 py-3 rounded-lg"
                  style={{
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  }}
                >
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm text-white/70">Illing Star {user?.isAdmin ? 'Admin' : 'Premium User'}</span>
                </div>
                {user && (
                  <Button
                    onClick={onSignOut}
                    variant="outline"
                    className="w-full border-white/20 hover:bg-white/10"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function StatItem({ 
  icon, 
  label, 
  value, 
  valueColor = 'text-white' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  valueColor?: string;
}) {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg"
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="text-primary">{icon}</div>
        <span className="text-white/70">{label}</span>
      </div>
      <span className={`font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}
