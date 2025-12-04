
import { useState, useEffect } from 'react';
import { X, Users, BarChart, Shield, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';

interface AdminPanelProps {
  onClose: () => void;
  sessionId: string;
}

export function AdminPanel({ onClose, sessionId }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'blocked'>('analytics');
  const [analytics, setAnalytics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [blockedSites, setBlockedSites] = useState<any[]>([]);
  const [newBlockUrl, setNewBlockUrl] = useState('');
  const [blockReason, setBlockReason] = useState('');

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

  return (
    <div 
      className="fixed inset-0 ml-16 flex items-center justify-center z-40 animate-fade-in"
      style={{
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <Card 
        className="w-full max-w-3xl border-white/10 max-h-[80vh]"
        style={{
          background: 'rgba(30, 20, 40, 0.95)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Admin Panel</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/70 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex border-b border-white/10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'analytics'
                ? 'text-white border-b-2 border-primary'
                : 'text-white/60 hover:text-white'
            }`}
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
          >
            <Shield className="w-4 h-4 inline mr-2" />
            Blocked Sites
          </button>
        </div>

        <ScrollArea className="p-6">
          {activeTab === 'analytics' && analytics && (
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Total Users" value={analytics.totalUsers} />
              <StatCard label="Active Users" value={analytics.activeUsers} />
              <StatCard label="Total Page Views" value={analytics.totalPageViews} />
              <StatCard label="Banned Users" value={analytics.bannedUsers} />
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                >
                  <div>
                    <p className="text-white font-medium">{user.username}</p>
                    <p className="text-sm text-white/50">
                      {user.isAdmin ? 'Admin' : 'User'} • {user.isBanned ? 'Banned' : 'Active'}
                    </p>
                  </div>
                  {!user.isAdmin && (
                    <Button
                      size="sm"
                      variant={user.isBanned ? 'outline' : 'destructive'}
                      onClick={() => user.isBanned ? handleUnbanUser(user.id) : handleBanUser(user.id)}
                    >
                      <Ban className="w-4 h-4 mr-1" />
                      {user.isBanned ? 'Unban' : 'Ban'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'blocked' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={newBlockUrl}
                  onChange={(e) => setNewBlockUrl(e.target.value)}
                  placeholder="Enter URL to block"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Input
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button onClick={handleBlockWebsite} className="w-full">
                  Block Website
                </Button>
              </div>
              <div className="space-y-2">
                {blockedSites.map((site) => (
                  <div
                    key={site.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                  >
                    <div>
                      <p className="text-white font-medium">{site.url}</p>
                      {site.reason && (
                        <p className="text-sm text-white/50">{site.reason}</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnblockWebsite(site.id)}
                    >
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-4 rounded-lg bg-white/5">
      <p className="text-white/60 text-sm">{label}</p>
      <p className="text-2xl font-bold text-white mt-1">{value}</p>
    </div>
  );
}
