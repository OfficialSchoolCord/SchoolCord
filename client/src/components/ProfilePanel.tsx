import { useState, useEffect, useRef } from 'react';
import { X, User, Star, Clock, Globe, Sparkles, Target, CheckCircle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import type { Quest } from '@shared/schema';

interface ProfilePanelProps {
  visitCount: number;
  onClose: () => void;
  user: any | null;
  onSignIn: () => void;
  onSignOut: () => void;
  onUpdateProfile: (username: string, profilePicture?: string) => void;
  sessionId: string | null;
}

export function ProfilePanel({ visitCount, onClose, user, onSignIn, onSignOut, onUpdateProfile, sessionId }: ProfilePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');
  const [editProfilePic, setEditProfilePic] = useState(user?.profilePicture || '');
  const [activeTab, setActiveTab] = useState<'profile' | 'quests'>('profile');
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(false);
  const [resetTimeRemaining, setResetTimeRemaining] = useState(0);
  const [dailyQuestsCompleted, setDailyQuestsCompleted] = useState(0);
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const profilePicInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    try {
      if (!editUsername.trim()) {
        alert('Username cannot be empty');
        return;
      }
      onUpdateProfile(editUsername, editProfilePic);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be smaller than 2MB');
      return;
    }

    setUploadingProfilePic(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const base64 = event.target?.result as string;
          setEditProfilePic(base64);
          setUploadingProfilePic(false);
        } catch (err) {
          console.error('Failed to process image:', err);
          alert('Failed to process image');
          setUploadingProfilePic(false);
        }
      };
      reader.onerror = () => {
        console.error('Failed to read image file');
        alert('Failed to read image file');
        setUploadingProfilePic(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image');
      setUploadingProfilePic(false);
    }
  };

  useEffect(() => {
    if (user && sessionId && activeTab === 'quests') {
      loadQuests();
    }
  }, [user, sessionId, activeTab]);

  useEffect(() => {
    if (resetTimeRemaining > 0) {
      const interval = setInterval(() => {
        setResetTimeRemaining(prev => Math.max(0, prev - 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [resetTimeRemaining]);

  const loadQuests = async () => {
    if (!sessionId) {
      console.warn('No session ID available for loading quests');
      return;
    }
    setQuestsLoading(true);
    try {
      const res = await fetch('/api/quests', {
        headers: { 'x-session-id': sessionId },
      });
      
      // Check content type to avoid JSON parse errors on HTML responses
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Quest API returned non-JSON response');
        setQuests([]);
        setQuestsLoading(false);
        return;
      }
      
      if (!res.ok) {
        console.error('Quest API error:', res.status);
        setQuests([]);
        setQuestsLoading(false);
        return;
      }
      
      const data = await res.json();
      setQuests(data.quests || []);
      setResetTimeRemaining(data.resetTimeRemaining || 0);
      setDailyQuestsCompleted(data.dailyQuestsCompleted || 0);
    } catch (error) {
      console.error('Failed to load quests:', error);
      setQuests([]);
    } finally {
      setQuestsLoading(false);
    }
  };

  const formatTimeRemaining = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}h ${minutes}m ${seconds}s`;
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
        className="w-full max-w-md border-white/10"
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

        {user && (
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-profile"
            >
              <User className="w-4 h-4 inline mr-2" />
              Profile
            </button>
            <button
              onClick={() => setActiveTab('quests')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'quests'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-quests"
            >
              <Target className="w-4 h-4 inline mr-2" />
              Quests
            </button>
          </div>
        )}

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-white/60 text-center">Sign in to save your browsing history, quick apps, and settings.</p>
              <Button
                onClick={onSignIn}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-sign-in"
              >
                Sign In
              </Button>
            </div>
          ) : activeTab === 'profile' ? (
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
                    {user?.profilePicture ? (
                      <img 
                        src={user.profilePicture} 
                        alt={user?.username || 'User'} 
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          console.error('Failed to load profile picture');
                          e.currentTarget.style.display = 'none';
                        }}
                      />
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
                      data-testid="input-edit-username"
                    />
                    <input
                      type="text"
                      value={editProfilePic}
                      onChange={(e) => setEditProfilePic(e.target.value)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white"
                      placeholder="Profile Picture URL"
                      data-testid="input-edit-profile-pic"
                    />
                    <input
                      type="file"
                      ref={profilePicInputRef}
                      onChange={handleProfilePicUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => profilePicInputRef.current?.click()}
                      className="w-full border-white/20 hover:bg-white/10"
                      disabled={uploadingProfilePic}
                    >
                      {uploadingProfilePic ? 'Uploading...' : 'Upload from Device'}
                    </Button>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSave} className="flex-1" data-testid="button-save-profile">Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setIsEditing(false)} className="flex-1" data-testid="button-cancel-edit">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-white" data-testid="text-username">{user?.username || 'User'}</h3>
                    <p className="text-sm text-white/50">{user?.isAdmin ? 'Administrator' : 'Cloud Browser User'}</p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditUsername(user.username);
                        setEditProfilePic(user.profilePicture || '');
                        setIsEditing(true);
                      }}
                      className="mt-2 text-white/70"
                      data-testid="button-edit-profile"
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

              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
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
                    data-testid="button-sign-out"
                  >
                    Sign Out
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <div className="flex items-center gap-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <span className="text-white/70 text-sm">Reset in:</span>
                </div>
                <span className="text-white font-medium" data-testid="text-reset-timer">
                  {formatTimeRemaining(resetTimeRemaining)}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                <span className="text-white/70 text-sm">Daily Quests Completed:</span>
                <Badge variant="outline" className="text-primary border-primary/30" data-testid="text-quests-completed">
                  {dailyQuestsCompleted} / 5000
                </Badge>
              </div>

              {questsLoading ? (
                <div className="text-center py-8 text-white/50">Loading quests...</div>
              ) : quests.length === 0 ? (
                <div className="text-center py-8 text-white/50">No quests available</div>
              ) : (
                <div className="space-y-3">
                  {quests.map((quest) => (
                    <QuestItem key={quest.id} quest={quest} />
                  ))}
                </div>
              )}

              <Button
                onClick={loadQuests}
                variant="outline"
                className="w-full mt-4 border-white/20 hover:bg-white/10"
                data-testid="button-refresh-quests"
              >
                Refresh Quests
              </Button>
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

function QuestItem({ quest }: { quest: Quest }) {
  const progressPercent = Math.min((quest.progress / quest.requirement) * 100, 100);
  
  return (
    <div 
      className={`p-4 rounded-lg border ${quest.completed ? 'border-green-500/30 bg-green-500/10' : 'border-white/10 bg-white/5'}`}
      data-testid={`quest-item-${quest.id}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {quest.completed ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <Target className="w-5 h-5 text-primary" />
          )}
          <span className={`font-medium ${quest.completed ? 'text-green-400' : 'text-white'}`}>
            {quest.title}
          </span>
        </div>
        <Badge 
          variant="outline" 
          className={quest.completed ? 'text-green-400 border-green-400/30' : 'text-yellow-400 border-yellow-400/30'}
        >
          +{quest.xpReward} XP
        </Badge>
      </div>
      <p className="text-sm text-white/60 mb-3">{quest.description}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-white/50">
          <span>Progress</span>
          <span>{quest.progress}/{quest.requirement}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
