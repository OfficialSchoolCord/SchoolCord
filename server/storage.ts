
import type { User, QuickApp, BlockedWebsite, HistoryItem, UserRole, ChatMessage, ChatRoom } from "@shared/schema";
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load persisted data
function loadUsers(): Map<string, User & { password: string }> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
  return new Map();
}

function loadChatMessages(): Map<ChatRoom, ChatMessage[]> {
  try {
    if (fs.existsSync(CHAT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHAT_FILE, 'utf-8'));
      return new Map([
        ['global', data.global || []],
        ['mod', data.mod || []],
        ['admin', data.admin || []],
      ]);
    }
  } catch (error) {
    console.error('Error loading chat messages:', error);
  }
  return new Map([
    ['global', []],
    ['mod', []],
    ['admin', []],
  ]);
}

function saveUsers() {
  try {
    const data = Object.fromEntries(storage.users.entries());
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving users:', error);
  }
}

function saveChatMessages() {
  try {
    const data = {
      global: storage.chatMessages.get('global') || [],
      mod: storage.chatMessages.get('mod') || [],
      admin: storage.chatMessages.get('admin') || [],
    };
    fs.writeFileSync(CHAT_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving chat messages:', error);
  }
}

// In-memory storage with persistence
export const storage = {
  users: loadUsers(),
  quickApps: new Map<string, QuickApp[]>(),
  blockedWebsites: new Map<string, BlockedWebsite>(),
  history: new Map<string, HistoryItem[]>(),
  sessions: new Map<string, string>(), // sessionId -> userId
  pageViews: 0,
  bannedUsers: new Set<string>(),
  tempBans: new Map<string, number>(), // userId -> unban timestamp
  chatMessages: loadChatMessages(),
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
  level: 67,
  xp: 10000,
  badges: ['crown'],
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
    level: 1,
    xp: 0,
    badges: [],
  };
  storage.users.set(id, user);
  saveUsers();
  return user;
}

export function updateUser(userId: string, updates: Partial<User>) {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  const updated = { ...user, ...updates };
  storage.users.set(userId, updated);
  saveUsers();
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
  checkAndUnbanUsers(); // Auto-unban expired bans
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
  saveUsers();
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function changeUserPassword(userId: string, newPassword: string): User | null {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  user.password = newPassword;
  storage.users.set(userId, user);
  saveUsers();
  
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export function changeUserLevel(userId: string, newLevel: number): User | null {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  user.level = newLevel;
  
  // Recalculate XP based on level to maintain consistency
  // Award badges based on new level
  user.badges = [];
  if (newLevel >= 10) user.badges.push('star');
  if (newLevel >= 25) user.badges.push('shield');
  if (newLevel >= 50) user.badges.push('goat');
  if (newLevel >= 100) user.badges.push('crown');
  if (newLevel >= 5000) user.badges.push('fire');
  
  storage.users.set(userId, user);
  saveUsers();
  
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

export function addChatMessage(room: ChatRoom, message: ChatMessage) {
  const messages = storage.chatMessages.get(room) || [];
  messages.push(message);
  // Keep last 200 messages per room
  if (messages.length > 200) {
    messages.shift();
  }
  storage.chatMessages.set(room, messages);
  saveChatMessages();
  return message;
}

export function getChatMessages(room: ChatRoom): ChatMessage[] {
  return storage.chatMessages.get(room) || [];
}

export function canAccessChatRoom(userId: string | undefined, room: ChatRoom): boolean {
  if (room === 'global') return true;
  
  if (!userId) return false;
  
  const user = storage.users.get(userId);
  if (!user) return false;
  
  if (room === 'mod') {
    return user.role === 'mod' || user.role === 'admin';
  }
  
  if (room === 'admin') {
    return user.role === 'admin';
  }
  
  return false;
}



// XP and leveling functions
export function calculateLevel(xp: number): number {
  // Formula: level increases as XP grows exponentially
  if (xp < 100) return 1;
  if (xp < 300) return Math.floor(2 + (xp - 100) / 50);
  if (xp < 1000) return Math.floor(5 + (xp - 300) / 70);
  if (xp < 3000) return Math.floor(15 + (xp - 1000) / 100);
  if (xp < 7500) return Math.floor(35 + (xp - 3000) / 150);
  if (xp < 25000) return Math.floor(65 + (xp - 7500) / 250);
  if (xp < 100000) return Math.floor(135 + (xp - 25000) / 500);
  if (xp < 500000) return Math.floor(285 + (xp - 100000) / 1000);
  
  return Math.min(5000, Math.floor(685 + (xp - 500000) / 5000));
}

export function addXP(userId: string, amount: number): { newLevel: number; oldLevel: number; newXP: number } | null {
  const user = storage.users.get(userId);
  if (!user) return null;
  
  const oldLevel = user.level || 1;
  const oldXP = user.xp || 0;
  const newXP = oldXP + amount;
  const newLevel = calculateLevel(newXP);
  
  user.xp = newXP;
  user.level = newLevel;
  
  // Award badges based on level
  if (newLevel >= 10 && !user.badges.includes('star')) {
    user.badges.push('star');
  }
  if (newLevel >= 25 && !user.badges.includes('shield')) {
    user.badges.push('shield');
  }
  if (newLevel >= 50 && !user.badges.includes('goat')) {
    user.badges.push('goat');
  }
  if (newLevel >= 100 && !user.badges.includes('crown')) {
    user.badges.push('crown');
  }
  if (newLevel >= 5000 && !user.badges.includes('fire')) {
    user.badges.push('fire');
  }
  
  storage.users.set(userId, user);
  saveUsers();
  return { newLevel, oldLevel, newXP };
}

export function getLeaderboard(limit: number = 50) {
  const users = Array.from(storage.users.values())
    .map(user => ({
      userId: user.id,
      username: user.username,
      profilePicture: user.profilePicture,
      level: user.level || 1,
      xp: user.xp || 0,
      badge: user.badges[user.badges.length - 1], // Latest badge
    }))
    .sort((a, b) => b.level - a.level || b.xp - a.xp)
    .slice(0, limit);
  
  return users;
}

export function canUserSendLinks(userId: string): boolean {
  const user = storage.users.get(userId);
  if (!user) return false;
  return (user.level || 1) >= 5 || user.role === 'admin' || user.role === 'mod';
}

export function canUserSendImages(userId: string): boolean {
  const user = storage.users.get(userId);
  if (!user) return false;
  return (user.level || 1) >= 10 || user.role === 'admin' || user.role === 'mod';
}

// Phishing/malicious link detection
const SUSPICIOUS_PATTERNS = [
  /grabify/i,
  /iplogger/i,
  /ip-grabber/i,
  /2no\.co/i,
  /bit\.ly\/[a-zA-Z0-9]{6,}/i, // Shortened links can be suspicious
  /discord\.gift/i,
  /steamcommunity-/i,
  /stearn/i,
  /discordapp-/i,
];

export function isSuspiciousLink(url: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(url));
}

export function tempBanUser(userId: string, durationMs: number = 7 * 24 * 60 * 60 * 1000) {
  const unbanTime = Date.now() + durationMs;
  storage.tempBans.set(userId, unbanTime);
  storage.bannedUsers.add(userId);
}

export function checkAndUnbanUsers() {
  const now = Date.now();
  for (const [userId, unbanTime] of storage.tempBans.entries()) {
    if (now >= unbanTime) {
      storage.tempBans.delete(userId);
      storage.bannedUsers.delete(userId);
    }
  }
}
