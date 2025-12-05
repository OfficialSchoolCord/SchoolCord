import { useState, useEffect } from 'react';
import { X, Users, BarChart, Shield, Ban, Crown, UserCheck, Target, RefreshCw, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@shared/schema';

interface AdminPanelProps {
  onClose: () => void;
  sessionId: string;
  currentUserRole: UserRole;
}

export function AdminPanel({ onClose, sessionId, currentUserRole }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'blocked' | 'quests' | 'passwords' | 'announcements' | 'terminal'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [blockedSites, setBlockedSites] = useState<any[]>([]);
  const [newBlockUrl, setNewBlockUrl] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingLevelUserId, setEditingLevelUserId] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState('');
  const [resettingQuestUserId, setResettingQuestUserId] = useState<string | null>(null);
  const [passwords, setPasswords] = useState<any[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [passwordSearchQuery, setPasswordSearchQuery] = useState('');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ command: string; output: string; success: boolean }>>([]);

  const isAdmin = currentUserRole === 'admin';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'analytics') {
        const res = await fetch('/api/admin/analytics', {
          headers: { 'x-session-id': sessionId },
        });
        const data = await res.json();
        setAnalytics(data);
      } else if (activeTab === 'users' || activeTab === 'quests') {
        const res = await fetch('/api/admin/users', {
          headers: { 'x-session-id': sessionId },
        });
        const data = await res.json();
        setUsers(data.users);
      } else if (activeTab === 'blocked') {
        const res = await fetch('/api/admin/blocked-websites', {
          headers: { 'x-session-id': sessionId },
        });
        const data = await res.json();
        setBlockedSites(data.blocked);
      } else if (activeTab === 'passwords' && isAdmin) {
        const res = await fetch('/api/admin/user-passwords', {
          headers: { 'x-session-id': sessionId },
        });
        const data = await res.json();
        setPasswords(data.passwords);
      }
    } catch (error) {
      console.error('Failed to load admin data:', error);
    }
  };

  const handleBanUser = async (userId: string) => {
    try {
      await fetch('/api/admin/ban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to ban user:', error);
    }
  };

  const handleUnbanUser = async (userId: string) => {
    try {
      await fetch('/api/admin/unban-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to unban user:', error);
    }
  };

  const handleSetRole = async (userId: string, role: UserRole) => {
    try {
      await fetch('/api/admin/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId, role }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to set role:', error);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!newPassword.trim() || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }
    
    // Check if user is trying to change an admin's password (including their own)
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'admin') {
      const code = prompt('Enter 6-digit authentication code to change admin password:');
      if (code !== '676767') {
        alert('Invalid authentication code. Access denied.');
        return;
      }
    }
    
    try {
      await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId, newPassword }),
      });
      setEditingUserId(null);
      setNewPassword('');
      alert('Password changed successfully');
    } catch (error) {
      console.error('Failed to change password:', error);
      alert('Failed to change password');
    }
  };

  const handleChangeLevel = async (userId: string) => {
    const levelNum = parseInt(newLevel, 10);
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 10000000000) {
      alert('Level must be between 1 and 10 billion');
      return;
    }
    try {
      await fetch('/api/admin/change-level', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId, newLevel: levelNum }),
      });
      setEditingLevelUserId(null);
      setNewLevel('');
      loadData();
      alert('Level changed successfully');
    } catch (error) {
      console.error('Failed to change level:', error);
      alert('Failed to change level');
    }
  };

  const handleBlockWebsite = async () => {
    if (!newBlockUrl.trim()) return;
    try {
      await fetch('/api/admin/block-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ url: newBlockUrl, reason: blockReason }),
      });
      setNewBlockUrl('');
      setBlockReason('');
      loadData();
    } catch (error) {
      console.error('Failed to block website:', error);
    }
  };

  const handleUnblockWebsite = async (id: string) => {
    try {
      await fetch('/api/admin/unblock-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ id }),
      });
      loadData();
    } catch (error) {
      console.error('Failed to unblock website:', error);
    }
  };

  const handleResetUserQuests = async (userId: string) => {
    try {
      setResettingQuestUserId(userId);
      await fetch('/api/admin/reset-user-quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId }),
      });
      alert('User quests reset successfully');
    } catch (error) {
      console.error('Failed to reset user quests:', error);
      alert('Failed to reset user quests');
    } finally {
      setResettingQuestUserId(null);
    }
  };

  const handleResetAllQuests = async () => {
    if (!confirm('Are you sure you want to reset quests for ALL users? This cannot be undone.')) {
      return;
    }
    try {
      await fetch('/api/admin/reset-all-quests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
      });
      alert('All user quests reset successfully');
    } catch (error) {
      console.error('Failed to reset all quests:', error);
      alert('Failed to reset all quests');
    }
  };

  const handleLoginAsUser = async (userId: string, username: string) => {
    // Prevent logging into illingstar account
    if (username === 'illingstar') {
      const code = prompt('Enter 6-digit authentication code for illingstar account:');
      if (code !== '676767') {
        alert('Invalid authentication code. Access denied.');
        return;
      }
    }
    
    if (!confirm(`Are you sure you want to login as ${username}? This will log you out of your current session.`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/login-as-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.success && data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
        window.location.reload();
      } else {
        alert(data.error || 'Failed to login as user');
      }
    } catch (error) {
      console.error('Failed to login as user:', error);
      alert('Failed to login as user');
    }
  };

  const handleSendAnnouncement = async () => {
    if (!announcementMessage.trim()) {
      alert('Announcement message cannot be empty');
      return;
    }
    try {
      await fetch('/api/admin/announce', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ message: announcementMessage }),
      });
      setAnnouncementMessage('');
      alert('Announcement sent! It will display on all users\' screens for 5 seconds.');
    } catch (error) {
      console.error('Failed to send announcement:', error);
      alert('Failed to send announcement');
    }
  };

  const handleTerminalCommand = async () => {
    if (!terminalInput.trim()) return;
    
    const command = terminalInput.trim();
    setTerminalInput('');
    
    try {
      const res = await fetch('/api/admin/terminal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId,
        },
        body: JSON.stringify({ command }),
      });
      const data = await res.json();
      
      if (command.toLowerCase() === 'clear') {
        setTerminalHistory([]);
      } else {
        setTerminalHistory(prev => [...prev, {
          command,
          output: data.output || data.error || 'No output',
          success: data.success || false,
        }]);
      }
    } catch (error) {
      setTerminalHistory(prev => [...prev, {
        command,
        output: 'Error: Failed to execute command',
        success: false,
      }]);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-primary/20 text-primary border-primary/30"><Crown className="w-3 h-3 mr-1" />Admin</Badge>;
      case 'mod':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><Shield className="w-3 h-3 mr-1" />Mod</Badge>;
      default:
        return <Badge variant="outline" className="text-white/60 border-white/20"><UserCheck className="w-3 h-3 mr-1" />User</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
            data-testid="button-back-admin"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white" data-testid="text-admin-title">Admin Panel</h2>
            <p className="text-sm text-white/60">{isAdmin ? 'Full access' : 'Moderator access'}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10 overflow-x-auto">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'text-white border-b-2 border-primary'
              : 'text-white/60 hover:text-white'
          }`}
          data-testid="tab-analytics"
        >
          <BarChart className="w-4 h-4 inline mr-2" />
          Analytics
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'users'
              ? 'text-white border-b-2 border-primary'
              : 'text-white/60 hover:text-white'
          }`}
          data-testid="tab-users"
        >
          <Users className="w-4 h-4 inline mr-2" />
          Users
        </button>
        <button
          onClick={() => setActiveTab('blocked')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === 'blocked'
              ? 'text-white border-b-2 border-primary'
              : 'text-white/60 hover:text-white'
          }`}
          data-testid="tab-blocked"
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Blocked
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('quests')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'quests'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-quests"
            >
              <Target className="w-4 h-4 inline mr-2" />
              Quests
            </button>
            <button
              onClick={() => setActiveTab('passwords')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'passwords'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-passwords"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Passwords
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'announcements'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-announcements"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Announcements
            </button>
            <button
              onClick={() => setActiveTab('terminal')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === 'terminal'
                  ? 'text-white border-b-2 border-primary'
                  : 'text-white/60 hover:text-white'
              }`}
              data-testid="tab-terminal"
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Terminal
            </button>
          </>
        )}
      </div>

      <ScrollArea className="flex-1 pr-2">
        {activeTab === 'analytics' && analytics && (
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Total Users" value={analytics.totalUsers} data-testid="stat-total-users" />
            <StatCard label="Active Users" value={analytics.activeUsers} data-testid="stat-active-users" />
            <StatCard label="Total Page Views" value={analytics.totalPageViews} data-testid="stat-page-views" />
            <StatCard label="Banned Users" value={analytics.bannedUsers} data-testid="stat-banned-users" />
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-3">
            <div className="relative sticky top-0 z-10 pb-2 bg-card">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Search users by username..."
                className="pl-10 bg-white/10 border-white/10 text-white"
                data-testid="input-user-search"
              />
            </div>
            {users.filter(user => 
              user.username.toLowerCase().includes(userSearchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No users found
              </div>
            ) : (
              users.filter(user => 
                user.username.toLowerCase().includes(userSearchQuery.toLowerCase())
              ).map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-white font-medium">{user.username}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {getRoleBadge(user.role || 'user')}
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
                          Level {user.level || 1}
                        </Badge>
                        {user.isBanned && (
                          <Badge variant="destructive" className="text-xs">
                            <Ban className="w-3 h-3 mr-1" />Banned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isAdmin && user.role !== 'admin' && (
                        <Select
                          value={user.role || 'user'}
                          onValueChange={(value) => handleSetRole(user.id, value as UserRole)}
                        >
                          <SelectTrigger className="w-24 h-8 bg-white/5 border-white/10 text-white text-xs" data-testid={`select-role-${user.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="mod">Mod</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant={user.isBanned ? 'outline' : 'destructive'}
                          onClick={() => user.isBanned ? handleUnbanUser(user.id) : handleBanUser(user.id)}
                          data-testid={`button-ban-${user.id}`}
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </Button>
                      )}
                      {isAdmin && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingUserId(editingUserId === user.id ? null : user.id)}
                            data-testid={`button-change-password-${user.id}`}
                          >
                            Change Password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingLevelUserId(editingLevelUserId === user.id ? null : user.id)}
                            data-testid={`button-change-level-${user.id}`}
                          >
                            Change Level
                          </Button>
                          {user.username === 'illingstar' ? (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLoginAsUser(user.id, user.username)}
                              data-testid={`button-login-as-${user.id}`}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              🔒 Login (2FA)
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLoginAsUser(user.id, user.username)}
                              data-testid={`button-login-as-${user.id}`}
                            >
                              Login as User
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    {isAdmin && editingUserId === user.id && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="New password (min 6 chars)"
                          className="bg-white/5 border-white/10 text-white text-xs h-8"
                          data-testid={`input-new-password-${user.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleChangePassword(user.id)}
                          data-testid={`button-save-password-${user.id}`}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                    {isAdmin && editingLevelUserId === user.id && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={newLevel}
                          onChange={(e) => setNewLevel(e.target.value)}
                          placeholder="New level (1-10B)"
                          min="1"
                          max="10000000000"
                          className="bg-white/5 border-white/10 text-white text-xs h-8"
                          data-testid={`input-new-level-${user.id}`}
                        />
                        <Button
                          size="sm"
                          onClick={() => handleChangeLevel(user.id)}
                          data-testid={`button-save-level-${user.id}`}
                        >
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'blocked' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="space-y-2">
                <Input
                  value={newBlockUrl}
                  onChange={(e) => setNewBlockUrl(e.target.value)}
                  placeholder="Enter URL to block"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-block-url"
                />
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="bg-white/5 border-white/10 text-white"
                  data-testid="input-block-reason"
                />
                <Button onClick={handleBlockWebsite} className="w-full" data-testid="button-block-website">
                  Block Website
                </Button>
              </div>
            )}
            <div className="space-y-2">
              {blockedSites.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No blocked websites
                </div>
              ) : (
                blockedSites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    data-testid={`blocked-site-${site.id}`}
                  >
                    <div>
                      <p className="text-white font-medium">{site.url}</p>
                      {site.reason && (
                        <p className="text-sm text-white/50">{site.reason}</p>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnblockWebsite(site.id)}
                        data-testid={`button-unblock-${site.id}`}
                      >
                        Unblock
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'quests' && isAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/20 to-purple-500/20 border border-primary/30">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="text-white font-semibold">Quest Management</h3>
                  <p className="text-sm text-white/60">Reset quests for all users or individual users</p>
                </div>
              </div>
              <Button 
                onClick={handleResetAllQuests}
                variant="destructive"
                className="w-full"
                data-testid="button-reset-all-quests"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset All User Quests
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="text-white/70 text-sm font-medium">Reset Individual User Quests</h4>
              {users.length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No users found
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    data-testid={`quest-user-row-${user.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="text-white font-medium">{user.username}</p>
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400/30 text-xs">
                          Level {user.level || 1}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleResetUserQuests(user.id)}
                      disabled={resettingQuestUserId === user.id}
                      data-testid={`button-reset-quest-${user.id}`}
                    >
                      <RefreshCw className={`w-4 h-4 mr-1 ${resettingQuestUserId === user.id ? 'animate-spin' : ''}`} />
                      Reset Quests
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'passwords' && isAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-white font-semibold">Password Backup</h3>
                  <p className="text-sm text-white/60">View all user passwords for backup purposes</p>
                </div>
              </div>
              <p className="text-xs text-red-400 mt-2">⚠️ Protected account (illingstar) is not shown</p>
            </div>

            <div className="relative sticky top-0 z-10 pb-2 bg-card">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                value={passwordSearchQuery}
                onChange={(e) => setPasswordSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="pl-10 bg-white/10 border-white/10 text-white"
                data-testid="input-password-search"
              />
            </div>

            <div className="space-y-2">
              {passwords.filter(pwd => 
                pwd.username.toLowerCase().includes(passwordSearchQuery.toLowerCase())
              ).length === 0 ? (
                <div className="text-center py-8 text-white/50">
                  No passwords found
                </div>
              ) : (
                passwords.filter(pwd => 
                  pwd.username.toLowerCase().includes(passwordSearchQuery.toLowerCase())
                ).map((pwd) => (
                  <div
                    key={pwd.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                    data-testid={`password-row-${pwd.id}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-white font-medium">{pwd.username}</p>
                        {getRoleBadge(pwd.role || 'user')}
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="text-sm text-green-400 bg-black/20 px-2 py-1 rounded font-mono">
                          {pwd.password}
                        </code>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'announcements' && isAdmin && (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Create Announcement</h3>
                  <p className="text-sm text-white/60">Send a message to all users for 5 seconds</p>
                </div>
              </div>
              <div className="space-y-2">
                <Input
                  value={announcementMessage}
                  onChange={(e) => setAnnouncementMessage(e.target.value)}
                  placeholder="Enter announcement message..."
                  className="bg-white/5 border-white/10 text-white"
                  maxLength={200}
                  data-testid="input-announcement"
                />
                <p className="text-xs text-white/50">{announcementMessage.length}/200 characters</p>
                <Button 
                  onClick={handleSendAnnouncement}
                  className="w-full"
                  data-testid="button-send-announcement"
                >
                  Send Announcement
                </Button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-sm text-white/70">
                💡 Tip: You can also use <code className="bg-black/20 px-1 rounded">/announce &lt;message&gt;</code> in any chat room
              </p>
            </div>
          </div>
        )}

        {activeTab === 'terminal' && isAdmin && (
          <div className="space-y-4 h-full flex flex-col">
            <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/20 to-teal-500/20 border border-green-500/30">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-green-400" />
                <div>
                  <h3 className="text-white font-semibold">Admin Terminal</h3>
                  <p className="text-sm text-white/60">Execute admin commands. Type 'help' for available commands.</p>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-black/40 rounded-lg p-4 font-mono text-sm overflow-y-auto">
              {terminalHistory.length === 0 ? (
                <div className="text-green-400">
                  Admin Terminal v1.0<br/>
                  Type 'help' to see available commands.
                </div>
              ) : (
                terminalHistory.map((entry, idx) => (
                  <div key={idx} className="mb-3">
                    <div className="text-blue-400">$ {entry.command}</div>
                    <div className={entry.success ? 'text-green-400' : 'text-red-400'} style={{ whiteSpace: 'pre-wrap' }}>
                      {entry.output}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2">
              <span className="text-green-400 font-mono self-center">$</span>
              <Input
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTerminalCommand()}
                placeholder="Enter command..."
                className="flex-1 bg-black/40 border-green-500/30 text-green-400 font-mono"
                data-testid="input-terminal"
              />
              <Button
                onClick={handleTerminalCommand}
                variant="outline"
                className="border-green-500/30 text-green-400"
                data-testid="button-terminal-execute"
              >
                Execute
              </Button>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function StatCard({ label, value, ...props }: { label: string; value: number; [key: string]: any }) {
  return (
    <div className="p-4 rounded-lg bg-white/5" {...props}>
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
