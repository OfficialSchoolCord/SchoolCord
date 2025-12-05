import type { 
  User, QuickApp, BlockedWebsite, HistoryItem, UserRole, ChatMessage, ChatRoom, Quest, UserQuestData,
  FriendRequest, FriendStatus, UserSettings, MessagePrivacy,
  DMThread, DMMessage,
  Server, ServerMember, ServerRole, Channel, ChannelMessage, ChannelType, BotConfig
} from "@shared/schema";
import { DEFAULT_QUESTS, QUEST_RESET_INTERVAL_MS, DAILY_QUEST_LIMIT } from "@shared/schema";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Password hashing utilities
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 100000;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex');
  return hash === verifyHash;
}

function isPasswordHashed(password: string): boolean {
  return password.includes(':') && password.length > 100;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const CHAT_FILE = path.join(DATA_DIR, 'chat.json');
const QUESTS_FILE = path.join(DATA_DIR, 'quests.json');
const FRIENDS_FILE = path.join(DATA_DIR, 'friends.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const DMS_FILE = path.join(DATA_DIR, 'dms.json');
const SERVERS_FILE = path.join(DATA_DIR, 'servers.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load persisted data and migrate plaintext passwords to hashed
function loadUsers(): Map<string, User & { password: string }> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
      const users = new Map<string, User & { password: string }>(Object.entries(data));
      
      let needsSave = false;
      for (const [id, user] of users.entries()) {
        if (user.password && !isPasswordHashed(user.password)) {
          console.log(`Migrating password for user: ${user.username}`);
          user.password = hashPassword(user.password);
          users.set(id, user);
          needsSave = true;
        }
      }
      
      if (needsSave) {
        const migratedData = Object.fromEntries(users.entries());
        fs.writeFileSync(USERS_FILE, JSON.stringify(migratedData, null, 2));
        console.log('Password migration complete');
      }
      
      return users;
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

// ==================== FRIENDS SYSTEM ====================

function loadFriends(): Map<string, FriendRequest> {
  try {
    if (fs.existsSync(FRIENDS_FILE)) {
      const data = JSON.parse(fs.readFileSync(FRIENDS_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading friends:', error);
  }
  return new Map();
}

function saveFriends() {
  try {
    const data = Object.fromEntries(storage.friends.entries());
    fs.writeFileSync(FRIENDS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving friends:', error);
  }
}

function loadUserSettings(): Map<string, UserSettings> {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
      return new Map(Object.entries(data));
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return new Map();
}

function saveUserSettings() {
  try {
    const data = Object.fromEntries(storage.userSettings.entries());
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// ==================== DM SYSTEM ====================

interface DMData {
  threads: Record<string, DMThread>;
  messages: Record<string, DMMessage[]>;
}

function loadDMs(): { threads: Map<string, DMThread>; messages: Map<string, DMMessage[]> } {
  try {
    if (fs.existsSync(DMS_FILE)) {
      const data: DMData = JSON.parse(fs.readFileSync(DMS_FILE, 'utf-8'));
      return {
        threads: new Map(Object.entries(data.threads || {})),
        messages: new Map(Object.entries(data.messages || {})),
      };
    }
  } catch (error) {
    console.error('Error loading DMs:', error);
  }
  return { threads: new Map(), messages: new Map() };
}

function saveDMs() {
  try {
    const data: DMData = {
      threads: Object.fromEntries(storage.dmThreads.entries()),
      messages: Object.fromEntries(storage.dmMessages.entries()),
    };
    fs.writeFileSync(DMS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving DMs:', error);
  }
}

// ==================== SERVERS SYSTEM ====================

interface ServerData {
  servers: Record<string, Server>;
  members: Record<string, ServerMember[]>;
  roles: Record<string, ServerRole[]>;
  channels: Record<string, Channel[]>;
  channelMessages: Record<string, ChannelMessage[]>;
  bots: Record<string, BotConfig[]>;
}

function loadServers(): { 
  servers: Map<string, Server>; 
  members: Map<string, ServerMember[]>;
  roles: Map<string, ServerRole[]>;
  channels: Map<string, Channel[]>;
  channelMessages: Map<string, ChannelMessage[]>;
  bots: Map<string, BotConfig[]>;
} {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      const data: ServerData = JSON.parse(fs.readFileSync(SERVERS_FILE, 'utf-8'));
      return {
        servers: new Map(Object.entries(data.servers || {})),
        members: new Map(Object.entries(data.members || {})),
        roles: new Map(Object.entries(data.roles || {})),
        channels: new Map(Object.entries(data.channels || {})),
        channelMessages: new Map(Object.entries(data.channelMessages || {})),
        bots: new Map(Object.entries(data.bots || {})),
      };
    }
  } catch (error) {
    console.error('Error loading servers:', error);
  }
  return { 
    servers: new Map(), 
    members: new Map(), 
    roles: new Map(), 
    channels: new Map(), 
    channelMessages: new Map(),
    bots: new Map(),
  };
}

function saveServers() {
  try {
    const data: ServerData = {
      servers: Object.fromEntries(storage.servers.entries()),
      members: Object.fromEntries(storage.serverMembers.entries()),
      roles: Object.fromEntries(storage.serverRoles.entries()),
      channels: Object.fromEntries(storage.channels.entries()),
      channelMessages: Object.fromEntries(storage.channelMessages.entries()),
      bots: Object.fromEntries(storage.bots.entries()),
    };
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving servers:', error);
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
      if (isNaN(level) || level < 1 || level > 10000000000) {
        return { success: false, output: 'Level must be between 1 and 10 billion' };
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

// Load DM and server data
const dmData = loadDMs();
const serverData = loadServers();

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
  
  // Friends system
  friends: loadFriends(),
  userSettings: loadUserSettings(),
  
  // DM system
  dmThreads: dmData.threads,
  dmMessages: dmData.messages,
  
  // Servers system
  servers: serverData.servers,
  serverMembers: serverData.members,
  serverRoles: serverData.roles,
  channels: serverData.channels,
  channelMessages: serverData.channelMessages,
  bots: serverData.bots,
};

// Initialize admin account with hashed password from environment variable
const adminId = "admin-illingstar";
let adminRawPassword = process.env.ADMIN_PASSWORD;
if (!adminRawPassword) {
  adminRawPassword = crypto.randomUUID();
  console.log('='.repeat(60));
  console.log('ADMIN_PASSWORD not set. Generated temporary admin password:');
  console.log(`  Username: illingstar`);
  console.log(`  Password: ${adminRawPassword}`);
  console.log('Set ADMIN_PASSWORD environment variable for persistent admin access.');
  console.log('='.repeat(60));
}
const adminHashedPassword = hashPassword(adminRawPassword);
storage.users.set(adminId, {
  id: adminId,
  username: "illingstar",
  password: adminHashedPassword,
  email: "admin@illingstar.com",
  role: 'admin',
  isAdmin: true,
  profilePicture: undefined,
  googleAccountLinked: false,
  createdAt: new Date().toISOString(),
  lastLogin: undefined,
  level: 10000000000,
  xp: 49999999999315,
  badges: ['star', 'shield', 'goat', 'crown', 'fire'],
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
  const hashedPassword = hashPassword(password);
  const user = {
    id,
    username,
    password: hashedPassword,
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

  user.password = hashPassword(newPassword);
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
  return user.role === 'mod' || user.role === 'admin';
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
  
  // Allow admins to continue leveling up beyond max
  const newLevel = user.role === 'admin' ? calculateLevel(newXP) : Math.min(calculateLevel(newXP), 10000000000);

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
  // Keep fire badge as highest for 10 billion

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

// ==================== FRIENDS CRUD ====================

export function getUserSettings(userId: string): UserSettings {
  let settings = storage.userSettings.get(userId);
  if (!settings) {
    settings = {
      userId,
      allowFriendRequests: true,
      messagePrivacy: 'public' as MessagePrivacy,
    };
    storage.userSettings.set(userId, settings);
    saveUserSettings();
  }
  return settings;
}

export function updateUserSettings(userId: string, updates: Partial<UserSettings>): UserSettings {
  const settings = getUserSettings(userId);
  const updated = { ...settings, ...updates };
  storage.userSettings.set(userId, updated);
  saveUserSettings();
  return updated;
}

export function sendFriendRequest(requesterId: string, addresseeId: string): FriendRequest | { error: string } {
  // Check if addressee allows friend requests
  const addresseeSettings = getUserSettings(addresseeId);
  if (!addresseeSettings.allowFriendRequests) {
    return { error: 'User has disabled friend requests' };
  }
  
  // Check if already friends or pending request
  for (const request of storage.friends.values()) {
    if ((request.requesterId === requesterId && request.addresseeId === addresseeId) ||
        (request.requesterId === addresseeId && request.addresseeId === requesterId)) {
      if (request.status === 'accepted') {
        return { error: 'Already friends' };
      }
      if (request.status === 'pending') {
        return { error: 'Friend request already pending' };
      }
      if (request.status === 'blocked') {
        return { error: 'Unable to send request' };
      }
    }
  }
  
  const id = `friend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const request: FriendRequest = {
    id,
    requesterId,
    addresseeId,
    status: 'pending' as FriendStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  storage.friends.set(id, request);
  saveFriends();
  return request;
}

export function acceptFriendRequest(requestId: string, userId: string): FriendRequest | { error: string } {
  const request = storage.friends.get(requestId);
  if (!request) {
    return { error: 'Request not found' };
  }
  if (request.addresseeId !== userId) {
    return { error: 'Not authorized to accept this request' };
  }
  if (request.status !== 'pending') {
    return { error: 'Request is not pending' };
  }
  
  request.status = 'accepted' as FriendStatus;
  request.updatedAt = new Date().toISOString();
  storage.friends.set(requestId, request);
  saveFriends();
  return request;
}

export function declineFriendRequest(requestId: string, userId: string): boolean {
  const request = storage.friends.get(requestId);
  if (!request) return false;
  if (request.addresseeId !== userId) return false;
  
  storage.friends.delete(requestId);
  saveFriends();
  return true;
}

export function blockUser(userId: string, blockUserId: string): FriendRequest {
  // Remove any existing friendship
  for (const [id, request] of storage.friends.entries()) {
    if ((request.requesterId === userId && request.addresseeId === blockUserId) ||
        (request.requesterId === blockUserId && request.addresseeId === userId)) {
      storage.friends.delete(id);
    }
  }
  
  const id = `friend-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const blocked: FriendRequest = {
    id,
    requesterId: userId,
    addresseeId: blockUserId,
    status: 'blocked' as FriendStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  storage.friends.set(id, blocked);
  saveFriends();
  return blocked;
}

export function unblockUser(userId: string, blockedUserId: string): boolean {
  for (const [id, request] of storage.friends.entries()) {
    if (request.requesterId === userId && request.addresseeId === blockedUserId && request.status === 'blocked') {
      storage.friends.delete(id);
      saveFriends();
      return true;
    }
  }
  return false;
}

export function getFriends(userId: string): (User & { friendshipId: string })[] {
  const friends: (User & { friendshipId: string })[] = [];
  
  for (const [id, request] of storage.friends.entries()) {
    if (request.status !== 'accepted') continue;
    
    let friendId: string | null = null;
    if (request.requesterId === userId) {
      friendId = request.addresseeId;
    } else if (request.addresseeId === userId) {
      friendId = request.requesterId;
    }
    
    if (friendId) {
      const user = storage.users.get(friendId);
      if (user) {
        const { password, ...userWithoutPassword } = user;
        friends.push({ ...userWithoutPassword, friendshipId: id });
      }
    }
  }
  
  return friends;
}

export function getPendingFriendRequests(userId: string): (FriendRequest & { requesterUser?: Partial<User> })[] {
  const requests: (FriendRequest & { requesterUser?: Partial<User> })[] = [];
  
  for (const request of storage.friends.values()) {
    if (request.addresseeId === userId && request.status === 'pending') {
      const requester = storage.users.get(request.requesterId);
      if (requester) {
        const { password, ...requesterWithoutPassword } = requester;
        requests.push({ ...request, requesterUser: requesterWithoutPassword });
      } else {
        requests.push(request);
      }
    }
  }
  
  return requests;
}

export function getSentFriendRequests(userId: string): FriendRequest[] {
  const requests: FriendRequest[] = [];
  
  for (const request of storage.friends.values()) {
    if (request.requesterId === userId && request.status === 'pending') {
      requests.push(request);
    }
  }
  
  return requests;
}

export function areFriends(userId1: string, userId2: string): boolean {
  for (const request of storage.friends.values()) {
    if (request.status === 'accepted' &&
        ((request.requesterId === userId1 && request.addresseeId === userId2) ||
         (request.requesterId === userId2 && request.addresseeId === userId1))) {
      return true;
    }
  }
  return false;
}

export function isBlocked(userId: string, blockedById: string): boolean {
  for (const request of storage.friends.values()) {
    if (request.status === 'blocked' &&
        request.requesterId === blockedById &&
        request.addresseeId === userId) {
      return true;
    }
  }
  return false;
}

export function removeFriend(userId: string, friendId: string): boolean {
  for (const [id, request] of storage.friends.entries()) {
    if (request.status === 'accepted' &&
        ((request.requesterId === userId && request.addresseeId === friendId) ||
         (request.requesterId === friendId && request.addresseeId === userId))) {
      storage.friends.delete(id);
      saveFriends();
      return true;
    }
  }
  return false;
}

// ==================== DM CRUD ====================

export function getOrCreateDMThread(userId1: string, userId2: string): DMThread {
  // Sort user IDs to create consistent thread lookup
  const sortedIds = [userId1, userId2].sort();
  
  // Check for existing thread
  for (const thread of storage.dmThreads.values()) {
    const threadIds = [...thread.memberIds].sort();
    if (threadIds[0] === sortedIds[0] && threadIds[1] === sortedIds[1]) {
      return thread;
    }
  }
  
  // Create new thread
  const id = `dm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const thread: DMThread = {
    id,
    memberIds: [userId1, userId2],
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  
  storage.dmThreads.set(id, thread);
  storage.dmMessages.set(id, []);
  saveDMs();
  return thread;
}

export function getDMThreads(userId: string): (DMThread & { otherUser?: Partial<User> })[] {
  const threads: (DMThread & { otherUser?: Partial<User> })[] = [];
  
  for (const thread of storage.dmThreads.values()) {
    if (thread.memberIds.includes(userId)) {
      const otherUserId = thread.memberIds.find(id => id !== userId);
      const otherUser = otherUserId ? storage.users.get(otherUserId) : null;
      
      if (otherUser) {
        const { password, ...userWithoutPassword } = otherUser;
        threads.push({ ...thread, otherUser: userWithoutPassword });
      } else {
        threads.push(thread);
      }
    }
  }
  
  return threads.sort((a, b) => 
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

export function getDMMessages(threadId: string, userId: string): DMMessage[] {
  const thread = storage.dmThreads.get(threadId);
  if (!thread || !thread.memberIds.includes(userId)) {
    return [];
  }
  return storage.dmMessages.get(threadId) || [];
}

export function sendDMMessage(threadId: string, senderId: string, message: string, imageUrl?: string): DMMessage | null {
  const thread = storage.dmThreads.get(threadId);
  if (!thread || !thread.memberIds.includes(senderId)) {
    return null;
  }
  
  // Check message privacy settings for recipient
  const recipientId = thread.memberIds.find(id => id !== senderId);
  if (recipientId) {
    const recipientSettings = getUserSettings(recipientId);
    if (recipientSettings.messagePrivacy === 'off') {
      return null;
    }
    if (recipientSettings.messagePrivacy === 'friends' && !areFriends(senderId, recipientId)) {
      return null;
    }
  }
  
  const id = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const dmMessage: DMMessage = {
    id,
    threadId,
    senderId,
    message,
    timestamp: new Date().toISOString(),
    imageUrl,
  };
  
  const messages = storage.dmMessages.get(threadId) || [];
  messages.push(dmMessage);
  if (messages.length > 500) messages.shift(); // Keep last 500 messages
  storage.dmMessages.set(threadId, messages);
  
  // Update thread lastMessageAt
  thread.lastMessageAt = dmMessage.timestamp;
  storage.dmThreads.set(threadId, thread);
  
  saveDMs();
  return dmMessage;
}

// ==================== SERVERS CRUD ====================

export function createServer(ownerId: string, name: string, description?: string, icon?: string, discoverable: boolean = false, tags: string[] = []): Server {
  const id = `server-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const server: Server = {
    id,
    ownerId,
    name,
    description,
    icon,
    discoverable,
    tags,
    createdAt: new Date().toISOString(),
  };
  
  storage.servers.set(id, server);
  
  // Add owner as first member
  const memberId = `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const member: ServerMember = {
    id: memberId,
    serverId: id,
    userId: ownerId,
    roles: ['owner'],
    joinedAt: new Date().toISOString(),
  };
  storage.serverMembers.set(id, [member]);
  
  // Create default general channel
  const channelId = `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const generalChannel: Channel = {
    id: channelId,
    serverId: id,
    name: 'general',
    type: 'text' as ChannelType,
    position: 0,
    createdAt: new Date().toISOString(),
  };
  storage.channels.set(id, [generalChannel]);
  storage.channelMessages.set(channelId, []);
  
  saveServers();
  return server;
}

export function getServer(serverId: string): Server | null {
  return storage.servers.get(serverId) || null;
}

export function updateServer(serverId: string, userId: string, updates: Partial<Server>): Server | { error: string } {
  const server = storage.servers.get(serverId);
  if (!server) return { error: 'Server not found' };
  
  // Check if user has permission (owner or admin role)
  if (!isServerAdmin(serverId, userId)) {
    return { error: 'Not authorized' };
  }
  
  const updated = { ...server, ...updates, id: server.id, ownerId: server.ownerId };
  storage.servers.set(serverId, updated);
  saveServers();
  return updated;
}

export function deleteServer(serverId: string, userId: string): boolean {
  const server = storage.servers.get(serverId);
  if (!server || server.ownerId !== userId) return false;
  
  storage.servers.delete(serverId);
  storage.serverMembers.delete(serverId);
  storage.serverRoles.delete(serverId);
  
  // Delete all channels and messages
  const channels = storage.channels.get(serverId) || [];
  for (const channel of channels) {
    storage.channelMessages.delete(channel.id);
  }
  storage.channels.delete(serverId);
  storage.bots.delete(serverId);
  
  saveServers();
  return true;
}

export function getUserServers(userId: string): Server[] {
  const servers: Server[] = [];
  
  for (const [serverId, members] of storage.serverMembers.entries()) {
    if (members.some(m => m.userId === userId)) {
      const server = storage.servers.get(serverId);
      if (server) servers.push(server);
    }
  }
  
  return servers;
}

export function getDiscoverableServers(search?: string, tags?: string[]): Server[] {
  const servers: Server[] = [];
  
  for (const server of storage.servers.values()) {
    if (!server.discoverable) continue;
    
    if (search && !server.name.toLowerCase().includes(search.toLowerCase()) &&
        !server.description?.toLowerCase().includes(search.toLowerCase())) {
      continue;
    }
    
    if (tags && tags.length > 0) {
      const hasTag = tags.some(tag => server.tags.includes(tag));
      if (!hasTag) continue;
    }
    
    servers.push(server);
  }
  
  return servers;
}

export function joinServer(serverId: string, userId: string): ServerMember | { error: string } {
  const server = storage.servers.get(serverId);
  if (!server) return { error: 'Server not found' };
  
  const members = storage.serverMembers.get(serverId) || [];
  if (members.some(m => m.userId === userId)) {
    return { error: 'Already a member' };
  }
  
  const member: ServerMember = {
    id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    serverId,
    userId,
    roles: [],
    joinedAt: new Date().toISOString(),
  };
  
  members.push(member);
  storage.serverMembers.set(serverId, members);
  saveServers();
  return member;
}

export function leaveServer(serverId: string, userId: string): boolean {
  const server = storage.servers.get(serverId);
  if (!server) return false;
  
  // Owner can't leave, must delete or transfer
  if (server.ownerId === userId) return false;
  
  const members = storage.serverMembers.get(serverId) || [];
  const newMembers = members.filter(m => m.userId !== userId);
  
  if (newMembers.length === members.length) return false;
  
  storage.serverMembers.set(serverId, newMembers);
  saveServers();
  return true;
}

export function getServerMembers(serverId: string): (ServerMember & { user?: Partial<User> })[] {
  const members = storage.serverMembers.get(serverId) || [];
  
  return members.map(member => {
    const user = storage.users.get(member.userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      return { ...member, user: userWithoutPassword };
    }
    return member;
  });
}

export function isServerMember(serverId: string, userId: string): boolean {
  const members = storage.serverMembers.get(serverId) || [];
  return members.some(m => m.userId === userId);
}

export function isServerAdmin(serverId: string, userId: string): boolean {
  const server = storage.servers.get(serverId);
  if (!server) return false;
  if (server.ownerId === userId) return true;
  
  const members = storage.serverMembers.get(serverId) || [];
  const member = members.find(m => m.userId === userId);
  return member?.roles.includes('admin') || false;
}

// ==================== CHANNELS CRUD ====================

export function createChannel(serverId: string, userId: string, name: string, type: ChannelType, topic?: string): Channel | { error: string } {
  if (!isServerAdmin(serverId, userId)) {
    return { error: 'Not authorized' };
  }
  
  const channels = storage.channels.get(serverId) || [];
  const id = `channel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const channel: Channel = {
    id,
    serverId,
    name,
    type,
    topic,
    position: channels.length,
    createdAt: new Date().toISOString(),
  };
  
  channels.push(channel);
  storage.channels.set(serverId, channels);
  storage.channelMessages.set(id, []);
  saveServers();
  return channel;
}

export function getServerChannels(serverId: string): Channel[] {
  return (storage.channels.get(serverId) || []).sort((a, b) => a.position - b.position);
}

export function updateChannel(channelId: string, userId: string, updates: Partial<Channel>): Channel | { error: string } {
  for (const [serverId, channels] of storage.channels.entries()) {
    const channelIndex = channels.findIndex(c => c.id === channelId);
    if (channelIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) {
        return { error: 'Not authorized' };
      }
      
      const updated = { ...channels[channelIndex], ...updates, id: channelId, serverId };
      channels[channelIndex] = updated;
      storage.channels.set(serverId, channels);
      saveServers();
      return updated;
    }
  }
  
  return { error: 'Channel not found' };
}

export function deleteChannel(channelId: string, userId: string): boolean {
  for (const [serverId, channels] of storage.channels.entries()) {
    const channelIndex = channels.findIndex(c => c.id === channelId);
    if (channelIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) return false;
      
      channels.splice(channelIndex, 1);
      storage.channels.set(serverId, channels);
      storage.channelMessages.delete(channelId);
      saveServers();
      return true;
    }
  }
  return false;
}

export function getChannelMessages(channelId: string): ChannelMessage[] {
  return storage.channelMessages.get(channelId) || [];
}

export function sendChannelMessage(
  channelId: string, 
  userId: string, 
  message: string, 
  imageUrl?: string,
  quotedMessageId?: string
): ChannelMessage | { error: string } {
  // Find the channel and check membership
  let serverId: string | null = null;
  for (const [sId, channels] of storage.channels.entries()) {
    if (channels.some(c => c.id === channelId)) {
      serverId = sId;
      break;
    }
  }
  
  if (!serverId || !isServerMember(serverId, userId)) {
    return { error: 'Not a member of this server' };
  }
  
  const user = storage.users.get(userId);
  if (!user) return { error: 'User not found' };
  
  const id = `cmsg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const channelMessage: ChannelMessage = {
    id,
    channelId,
    userId,
    username: user.username,
    profilePicture: user.profilePicture,
    message,
    timestamp: new Date().toISOString(),
    imageUrl,
    quotedMessageId,
    level: user.level,
    badge: user.badges[user.badges.length - 1],
  };
  
  const messages = storage.channelMessages.get(channelId) || [];
  messages.push(channelMessage);
  if (messages.length > 500) messages.shift();
  storage.channelMessages.set(channelId, messages);
  saveServers();
  
  return channelMessage;
}

// ==================== BOTS CRUD ====================

export function addBot(serverId: string, userId: string, name: string, description?: string): BotConfig | { error: string } {
  if (!isServerAdmin(serverId, userId)) {
    return { error: 'Not authorized' };
  }
  
  const id = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const bot: BotConfig = {
    id,
    serverId,
    name,
    description,
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  
  const bots = storage.bots.get(serverId) || [];
  bots.push(bot);
  storage.bots.set(serverId, bots);
  saveServers();
  return bot;
}

export function getServerBots(serverId: string): BotConfig[] {
  return storage.bots.get(serverId) || [];
}

export function removeBot(botId: string, userId: string): boolean {
  for (const [serverId, bots] of storage.bots.entries()) {
    const botIndex = bots.findIndex(b => b.id === botId);
    if (botIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) return false;
      
      bots.splice(botIndex, 1);
      storage.bots.set(serverId, bots);
      saveServers();
      return true;
    }
  }
  return false;
}

// ==================== SERVER BOOST FUNCTIONS ====================

export function boostServer(serverId: string, userId: string, amount: number): any {
  const server = storage.servers.get(serverId);
  if (!server) return { error: 'Server not found' };
  
  const boost = {
    id: `boost-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    serverId,
    userId,
    amount,
    timestamp: new Date().toISOString(),
  };
  
  server.boostBalance = (server.boostBalance || 0) + amount;
  server.boostLevel = Math.floor(server.boostBalance / 100);
  
  storage.servers.set(serverId, server);
  saveServers();
  return boost;
}

export function getServerBoosts(serverId: string): any[] {
  return [];
}

export function useServerBoost(serverId: string, userId: string, feature: string, amount: number): any {
  const server = storage.servers.get(serverId);
  if (!server) return { error: 'Server not found' };
  if (!isServerAdmin(serverId, userId)) return { error: 'Not authorized' };
  
  if ((server.boostBalance || 0) < amount) {
    return { error: 'Insufficient boost balance' };
  }
  
  server.boostBalance = (server.boostBalance || 0) - amount;
  
  if (!server.features) {
    server.features = {
      animatedUsernames: false,
      customEmojis: false,
      promotionSlots: 0,
    };
  }
  
  switch (feature) {
    case 'animatedUsernames':
      server.features.animatedUsernames = true;
      break;
    case 'customEmojis':
      server.features.customEmojis = true;
      break;
    case 'promotion':
      server.features.promotionSlots = (server.features.promotionSlots || 0) + 1;
      break;
    case 'banner':
      break;
  }
  
  storage.servers.set(serverId, server);
  saveServers();
  return server;
}

// ==================== SERVER ROLE FUNCTIONS ====================

export function getServerRoles(serverId: string): any[] {
  return storage.serverRoles.get(serverId) || [];
}

export function createServerRole(serverId: string, userId: string, name: string, permissions: string[] = [], color?: string): any {
  if (!isServerAdmin(serverId, userId)) {
    return { error: 'Not authorized' };
  }
  
  const roles = storage.serverRoles.get(serverId) || [];
  const id = `role-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const role = {
    id,
    serverId,
    name,
    permissions,
    color,
    position: roles.length,
    createdBy: userId,
    createdAt: new Date().toISOString(),
  };
  
  roles.push(role);
  storage.serverRoles.set(serverId, roles);
  saveServers();
  return role;
}

export function updateServerRole(roleId: string, userId: string, updates: any): any {
  for (const [serverId, roles] of storage.serverRoles.entries()) {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) {
        return { error: 'Not authorized' };
      }
      
      const updated = { ...roles[roleIndex], ...updates, id: roleId, serverId };
      roles[roleIndex] = updated;
      storage.serverRoles.set(serverId, roles);
      saveServers();
      return updated;
    }
  }
  return { error: 'Role not found' };
}

export function deleteServerRole(roleId: string, userId: string): boolean {
  for (const [serverId, roles] of storage.serverRoles.entries()) {
    const roleIndex = roles.findIndex(r => r.id === roleId);
    if (roleIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) return false;
      
      roles.splice(roleIndex, 1);
      storage.serverRoles.set(serverId, roles);
      saveServers();
      return true;
    }
  }
  return false;
}

export function assignRoleToMember(memberId: string, userId: string, roleId: string): any {
  for (const [serverId, members] of storage.serverMembers.entries()) {
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) {
        return { error: 'Not authorized' };
      }
      
      const member = members[memberIndex];
      if (!member.roles.includes(roleId)) {
        member.roles.push(roleId);
      }
      
      storage.serverMembers.set(serverId, members);
      saveServers();
      return member;
    }
  }
  return { error: 'Member not found' };
}

export function removeRoleFromMember(memberId: string, userId: string, roleId: string): any {
  for (const [serverId, members] of storage.serverMembers.entries()) {
    const memberIndex = members.findIndex(m => m.id === memberId);
    if (memberIndex !== -1) {
      if (!isServerAdmin(serverId, userId)) {
        return { error: 'Not authorized' };
      }
      
      const member = members[memberIndex];
      member.roles = member.roles.filter(r => r !== roleId);
      
      storage.serverMembers.set(serverId, members);
      saveServers();
      return member;
    }
  }
  return { error: 'Member not found' };
}