
import type { User, QuickApp, BlockedWebsite, HistoryItem, UserRole } from "@shared/schema";

// In-memory storage (replace with actual database in production)
export const storage = {
  users: new Map<string, User & { password: string }>(),
  quickApps: new Map<string, QuickApp[]>(),
  blockedWebsites: new Map<string, BlockedWebsite>(),
  history: new Map<string, HistoryItem[]>(),
  sessions: new Map<string, string>(), // sessionId -> userId
  pageViews: 0,
  bannedUsers: new Set<string>(),
};

// Initialize admin account
const adminId = "admin-illingstar";
storage.users.set(adminId, {
  id: adminId,
  username: "illingstar",
  password: "Av121988", // In production, hash this!
  email: "admin@illingstar.com",
  role: 'admin',
  isAdmin: true,
  profilePicture: undefined,
  googleAccountLinked: false,
  createdAt: new Date().toISOString(),
  lastLogin: undefined,
});

export function getUser(userId: string) {
  return storage.users.get(userId);
}

export function getUserByUsername(username: string) {
  for (const user of storage.users.values()) {
    if (user.username === username) {
      return user;
    }
  }
  return undefined;
}

export function createUser(username: string, password: string, email?: string): User {
  const id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const user = {
    id,
    username,
    password,
    email,
    role: 'user' as UserRole,
    isAdmin: false,
    profilePicture: undefined,
    googleAccountLinked: false,
    createdAt: new Date().toISOString(),
    lastLogin: undefined,
  };
  storage.users.set(id, user);
  return user;
}

export function updateUser(userId: string, updates: Partial<User>) {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  const updated = { ...user, ...updates };
  storage.users.set(userId, updated);
  return updated;
}

export function getUserQuickApps(userId: string): QuickApp[] {
  return storage.quickApps.get(userId) || [];
}

export function setUserQuickApps(userId: string, apps: QuickApp[]) {
  storage.quickApps.set(userId, apps);
}

export function addBlockedWebsite(url: string, blockedBy: string, reason?: string) {
  const id = `blocked-${Date.now()}`;
  const blocked: BlockedWebsite = {
    id,
    url,
    blockedBy,
    blockedAt: new Date().toISOString(),
    reason,
  };
  storage.blockedWebsites.set(id, blocked);
  return blocked;
}

export function removeBlockedWebsite(id: string) {
  storage.blockedWebsites.delete(id);
}

export function isWebsiteBlocked(url: string): boolean {
  for (const blocked of storage.blockedWebsites.values()) {
    if (url.includes(blocked.url) || blocked.url.includes(url)) {
      return true;
    }
  }
  return false;
}

export function getBlockedWebsites(): BlockedWebsite[] {
  return Array.from(storage.blockedWebsites.values());
}

export function addToHistory(userId: string, item: Omit<HistoryItem, "id">) {
  const history = storage.history.get(userId) || [];
  const historyItem: HistoryItem = {
    ...item,
    id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
  history.unshift(historyItem);
  if (history.length > 100) history.pop();
  storage.history.set(userId, history);
}

export function getUserHistory(userId: string): HistoryItem[] {
  return storage.history.get(userId) || [];
}

export function banUser(userId: string) {
  storage.bannedUsers.add(userId);
}

export function unbanUser(userId: string) {
  storage.bannedUsers.delete(userId);
}

export function isUserBanned(userId: string): boolean {
  return storage.bannedUsers.has(userId);
}

export function getAllUsers(): (User & { isBanned: boolean })[] {
  return Array.from(storage.users.values()).map(user => {
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      isBanned: storage.bannedUsers.has(user.id),
    };
  });
}

export function setUserRole(userId: string, role: UserRole): User | null {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  user.role = role;
  user.isAdmin = role === 'admin';
  storage.users.set(userId, user);
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function hasModeratorAccess(userId: string): boolean {
  const user = storage.users.get(userId);
  if (!user) return false;
  return user.role === 'admin' || user.role === 'mod';
}

export function getAnalytics() {
  return {
    totalUsers: storage.users.size,
    activeUsers: storage.sessions.size,
    totalPageViews: storage.pageViews,
    bannedUsers: storage.bannedUsers.size,
  };
}

export function incrementPageViews() {
  storage.pageViews++;
}
