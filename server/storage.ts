
import type { User, QuickApp, BlockedWebsite, HistoryItem, UserRole, ChatMessage, ChatRoom, Quest, UserQuestData } from "@shared/schema";
import { DEFAULT_QUESTS, QUEST_RESET_INTERVAL_MS, DAILY_QUEST_LIMIT } from "@shared/schema";
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const QUESTS_FILE = path.join(DATA_DIR, 'quests.json');

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

function loadQuests(): Map<string, UserQuestData> {
  try {
    if (fs.existsSync(QUESTS_FILE)) {
      const data = JSON.parse(fs.readFileSync(QUESTS_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading quests:', error);
  }
  return new Map();
}

function saveQuests() {
  try {
    const data = Object.fromEntries(storage.quests.entries());
    fs.writeFileSync(QUESTS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving quests:', error);
  }
}

// Announcement functions
export function createAnnouncement(userId: string, message: string): Announcement {
  const user = getUser(userId);
  const announcement: Announcement = {
    id: `announce-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    username: user?.username || 'Admin',
    message,
    timestamp: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 5000).toISOString(), // 5 seconds
  };
  
  storage.announcements.push(announcement);
  
  // Clean up expired announcements after 10 seconds
  setTimeout(() => {
    storage.announcements = storage.announcements.filter(a => a.id !== announcement.id);
  }, 10000);
  
  return announcement;
}

export function getActiveAnnouncements(): Announcement[] {
  const now = new Date().toISOString();
  return storage.announcements.filter(a => a.expiresAt > now);
}

// Admin terminal commands
export function executeAdminCommand(userId: string, command: string): { success: boolean; output: string } {
  const user = getUser(userId);
  if (!user || user.role !== 'admin') {
    return { success: false, output: 'Unauthorized: Admin access required' };
  }

  const parts = command.split(' ');
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  switch (cmd) {
    case 'help':
      return {
        success: true,
        output: `Available Commands:
- help: Show this help message
- users: List all users
- ban <username>: Ban a user
- unban <username>: Unban a user
- setrole <username> <role>: Set user role (user/mod/admin)
- setlevel <username> <level>: Set user level
- resetpw <username> <newpassword>: Reset user password
- stats: Show server statistics
- announce <message>: Create announcement (or use /announce in chat)
- clear: Clear terminal output`
      };

    case 'users':
      const users = getAllUsers();
      const userList = users.map(u => 
        `${u.username} (Level ${u.level || 1}) - ${u.role || 'user'}${u.isBanned ? ' [BANNED]' : ''}`
      ).join('\n');
      return { success: true, output: userList || 'No users found' };

    case 'ban':
      if (!args[0]) return { success: false, output: 'Usage: ban <username>' };
      const banUser = getUserByUsername(args[0]);
      if (!banUser) return { success: false, output: `User '${args[0]}' not found` };
      banUserById(banUser.id);
      return { success: true, output: `Successfully banned user '${args[0]}'` };

    case 'unban':
      if (!args[0]) return { success: false, output: 'Usage: unban <username>' };
      const unbanUser = getUserByUsername(args[0]);
      if (!unbanUser) return { success: false, output: `User '${args[0]}' not found` };
      unbanUserById(unbanUser.id);
      return { success: true, output: `Successfully unbanned user '${args[0]}'` };

    case 'setrole':
      if (!args[0] || !args[1]) return { success: false, output: 'Usage: setrole <username> <role>' };
      const roleUser = getUserByUsername(args[0]);
      if (!roleUser) return { success: false, output: `User '${args[0]}' not found` };
      if (!['user', 'mod', 'admin'].includes(args[1])) {
        return { success: false, output: 'Role must be: user, mod, or admin' };
      }
      setUserRole(roleUser.id, args[1] as UserRole);
      return { success: true, output: `Set ${args[0]}'s role to ${args[1]}` };

    case 'setlevel':
      if (!args[0] || !args[1]) return { success: false, output: 'Usage: setlevel <username> <level>' };
      const levelUser = getUserByUsername(args[0]);
      if (!levelUser) return { success: false, output: `User '${args[0]}' not found` };
      const level = parseInt(args[1]);
      if (isNaN(level) || level < 1 || level > 5000) {
        return { success: false, output: 'Level must be between 1 and 5000' };
      }
      changeUserLevel(levelUser.id, level);
      return { success: true, output: `Set ${args[0]}'s level to ${level}` };

    case 'resetpw':
      if (!args[0] || !args[1]) return { success: false, output: 'Usage: resetpw <username> <newpassword>' };
      const pwUser = getUserByUsername(args[0]);
      if (!pwUser) return { success: false, output: `User '${args[0]}' not found` };
      if (args[1].length < 6) return { success: false, output: 'Password must be at least 6 characters' };
      changeUserPassword(pwUser.id, args[1]);
      return { success: true, output: `Reset password for ${args[0]}` };

    case 'stats':
      const analytics = getAnalytics();
      return {
        success: true,
        output: `Server Statistics:
Total Users: ${analytics.totalUsers}
Active Users: ${analytics.activeUsers}
Banned Users: ${analytics.bannedUsers}
Total Page Views: ${analytics.totalPageViews}`
      };

    case 'announce':
      const announceMsg = args.join(' ');
      if (!announceMsg) return { success: false, output: 'Usage: announce <message>' };
      createAnnouncement(userId, announceMsg);
      return { success: true, output: `Announcement created: "${announceMsg}"` };

    case 'clear':
      return { success: true, output: '' };

    default:
      return { success: false, output: `Unknown command: ${cmd}. Type 'help' for available commands.` };
  }
}

function banUserById(userId: string) {
  storage.bannedUsers.add(userId);
  updateUser(userId, { isBanned: true });
}

function unbanUserById(userId: string) {
  storage.bannedUsers.delete(userId);
  storage.tempBans.delete(userId);
  updateUser(userId, { isBanned: false });
}

interface Announcement {
  id: string;
  userId: string;
  username: string;
  message: string;
  timestamp: string;
  expiresAt: string;
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
  quests: loadQuests(),
  announcements: [] as Announcement[],
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
  level: 100,
  xp: 7500,
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
  
  // Update XP to match the new level so it persists correctly
  user.xp = calculateXPForLevel(newLevel);
  
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

// Calculate minimum XP required for a specific level (reverse of calculateLevel)
export function calculateXPForLevel(level: number): number {
  if (level <= 1) return 0;
  if (level < 5) return 100 + (level - 2) * 50;
  if (level < 15) return 300 + (level - 5) * 70;
  if (level < 35) return 1000 + (level - 15) * 100;
  if (level < 65) return 3000 + (level - 35) * 150;
  if (level < 135) return 7500 + (level - 65) * 250;
  if (level < 285) return 25000 + (level - 135) * 500;
  if (level < 685) return 100000 + (level - 285) * 1000;
  if (level <= 5000) return 500000 + (level - 685) * 5000;
  return 500000 + (5000 - 685) * 5000; // Max XP for level 5000
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

// Quest system functions
function generateUserQuests(): Quest[] {
  return DEFAULT_QUESTS.map((quest, index) => ({
    ...quest,
    id: `quest-${Date.now()}-${index}`,
    progress: 0,
    completed: false,
  }));
}

function shouldResetQuests(lastResetTime: string): boolean {
  const lastReset = new Date(lastResetTime).getTime();
  const now = Date.now();
  return now - lastReset >= QUEST_RESET_INTERVAL_MS;
}

export function getUserQuests(userId: string): UserQuestData {
  let questData = storage.quests.get(userId);
  
  // Initialize quests for new users
  if (!questData) {
    questData = {
      userId,
      quests: generateUserQuests(),
      lastResetTime: new Date().toISOString(),
      dailyQuestsCompleted: 0,
    };
    storage.quests.set(userId, questData);
    saveQuests();
  }
  
  // Check if quests need to be reset (6 hour timer)
  if (shouldResetQuests(questData.lastResetTime)) {
    questData = {
      userId,
      quests: generateUserQuests(),
      lastResetTime: new Date().toISOString(),
      dailyQuestsCompleted: 0,
    };
    storage.quests.set(userId, questData);
    saveQuests();
  }
  
  return questData;
}

export function getQuestResetTimeRemaining(userId: string): number {
  const questData = storage.quests.get(userId);
  if (!questData) return 0;
  
  const lastReset = new Date(questData.lastResetTime).getTime();
  const nextReset = lastReset + QUEST_RESET_INTERVAL_MS;
  const remaining = nextReset - Date.now();
  
  return Math.max(0, remaining);
}

export function updateQuestProgress(userId: string, questType: string, amount: number = 1): { questCompleted: boolean; xpAwarded: number; quest?: Quest } | null {
  const questData = getUserQuests(userId);
  
  // Check daily limit
  if (questData.dailyQuestsCompleted >= DAILY_QUEST_LIMIT) {
    return { questCompleted: false, xpAwarded: 0 };
  }
  
  const quest = questData.quests.find(q => q.type === questType && !q.completed);
  if (!quest) return { questCompleted: false, xpAwarded: 0 };
  
  quest.progress = Math.min(quest.progress + amount, quest.requirement);
  
  let xpAwarded = 0;
  let questCompleted = false;
  
  if (quest.progress >= quest.requirement && !quest.completed) {
    quest.completed = true;
    questCompleted = true;
    xpAwarded = quest.xpReward;
    questData.dailyQuestsCompleted++;
    
    // Award XP for completing quest
    addXP(userId, xpAwarded);
  }
  
  storage.quests.set(userId, questData);
  saveQuests();
  
  return { questCompleted, xpAwarded, quest };
}

export function completeLoginQuest(userId: string): { questCompleted: boolean; xpAwarded: number } {
  const result = updateQuestProgress(userId, 'daily_login', 1);
  return result || { questCompleted: false, xpAwarded: 0 };
}

export function resetUserQuests(userId: string): UserQuestData {
  const questData: UserQuestData = {
    userId,
    quests: generateUserQuests(),
    lastResetTime: new Date().toISOString(),
    dailyQuestsCompleted: 0,
  };
  storage.quests.set(userId, questData);
  saveQuests();
  return questData;
}

export function resetAllUserQuests(): void {
  for (const userId of storage.quests.keys()) {
    resetUserQuests(userId);
  }
  // Also reset for all users who haven't had quests yet
  for (const user of storage.users.values()) {
    if (!storage.quests.has(user.id)) {
      resetUserQuests(user.id);
    }
  }
}
