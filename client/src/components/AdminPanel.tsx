import { useState, useEffect } from 'react';
import { X, Users, BarChart, Shield, Ban, Crown, UserCheck } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'blocked'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [blockedSites, setBlockedSites] = useState<any[]>([]);
  const [newBlockUrl, setNewBlockUrl] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [editingLevelUserId, setEditingLevelUserId] = useState<string | null>(null);
  const [newLevel, setNewLevel] = useState('');

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
      } else if (activeTab === 'users') {
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
    if (isNaN(levelNum) || levelNum < 1 || levelNum > 5000) {
      alert('Level must be between 1 and 5000');
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white" data-testid="text-admin-title">Admin Panel</h2>
            <p className="text-sm text-white/60">{isAdmin ? 'Full access' : 'Moderator access'}</p>
          </div>
        </div>
      </div>

      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
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
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'blocked'
              ? 'text-white border-b-2 border-primary'
              : 'text-white/60 hover:text-white'
          }`}
          data-testid="tab-blocked"
        >
          <Shield className="w-4 h-4 inline mr-2" />
          Blocked Sites
        </button>
      </div>

      <ScrollArea className="flex-1">
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
            {users.length === 0 ? (
              <div className="text-center py-8 text-white/50">
                No users found
              </div>
            ) : (
              users.map((user) => (
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
                    <div className="flex items-center gap-2">
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
                          placeholder="New level (1-5000)"
                          min="1"
                          max="5000"
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
