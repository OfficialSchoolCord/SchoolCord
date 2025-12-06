import { z } from "zod";

// User roles
export const userRoleSchema = z.enum(['user', 'mod', 'admin']);
export type UserRole = z.infer<typeof userRoleSchema>;

// Browser fetch request schema
export const fetchRequestSchema = z.object({
  url: z.string().min(1, "URL is required"),
});

export type FetchRequest = z.infer<typeof fetchRequestSchema>;

// Browser fetch response schema
export const fetchResponseSchema = z.object({
  success: z.boolean(),
  url: z.string(),
  title: z.string().optional(),
  content: z.string().optional(),
  error: z.string().optional(),
  isSearch: z.boolean().optional(),
  searchUrl: z.string().optional(),
});

export type FetchResponse = z.infer<typeof fetchResponseSchema>;

// Badge schema - must be defined before userSchema
export const badgeSchema = z.enum(['star', 'shield', 'goat', 'crown', 'fire']);
export type Badge = z.infer<typeof badgeSchema>;

// User schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string().email().optional(),
  role: userRoleSchema.default('user'),
  isAdmin: z.boolean().default(false),
  profilePicture: z.string().optional(),
  googleAccountLinked: z.boolean().default(false),
  googleEmail: z.string().optional(),
  createdAt: z.string(),
  lastLogin: z.string().optional(),
  level: z.number().default(1),
  xp: z.number().default(0),
  badges: z.array(badgeSchema).default([]),
});

export type User = z.infer<typeof userSchema>;

// AI chat message schema
export const aiMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type AIMessage = z.infer<typeof aiMessageSchema>;

// AI chat request schema
export const aiChatRequestSchema = z.object({
  message: z.string().min(1),
  history: z.array(aiMessageSchema).optional(),
});

// Chat system schemas
export const chatRoomSchema = z.enum(['global', 'mod', 'admin']);
export type ChatRoom = z.infer<typeof chatRoomSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  room: chatRoomSchema,
  userId: z.string().optional(),
  username: z.string(),
  profilePicture: z.string().optional(),
  message: z.string(),
  timestamp: z.string(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().optional(),
  level: z.number().optional(),
  badge: badgeSchema.optional(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const sendChatMessageSchema = z.object({
  room: chatRoomSchema,
  message: z.string().min(1).max(500),
  imageUrl: z.string().url().optional(),
  linkUrl: z.string().url().optional(),
});

export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;

// Quick app schema
export const quickAppSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  url: z.string(),
  icon: z.string(),
  color: z.string(),
  order: z.number(),
});

export type QuickApp = z.infer<typeof quickAppSchema>;

// Blocked website schema
export const blockedWebsiteSchema = z.object({
  id: z.string(),
  url: z.string(),
  blockedBy: z.string(),
  blockedAt: z.string(),
  reason: z.string().optional(),
});

export type BlockedWebsite = z.infer<typeof blockedWebsiteSchema>;

// User analytics schema
export const userAnalyticsSchema = z.object({
  totalUsers: z.number(),
  activeUsers: z.number(),
  totalPageViews: z.number(),
  bannedUsers: z.number(),
});

export type UserAnalytics = z.infer<typeof userAnalyticsSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(6),
  email: z.string().email().optional(),
});

export type LoginRequest = z.infer<typeof loginSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;

// History item schema
export const historyItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  visitedAt: z.string(),
  favicon: z.string().optional(),
  userId: z.string().optional(),
});

export type HistoryItem = z.infer<typeof historyItemSchema>;

// Bookmark schema
export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  createdAt: z.string(),
  favicon: z.string().optional(),
  userId: z.string().optional(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Sidebar navigation items
export const sidebarNavItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'games', label: 'Games', icon: 'gamepad' }, // Added games tab
  { id: 'ai', label: 'AI Assistant', icon: 'ai' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
  { id: 'admin', label: 'Admin Panel', icon: 'admin' },
] as const;

export type NavItemId = typeof sidebarNavItems[number]['id'];

// Default quick apps
export const defaultQuickApps = [
  { id: 'google', name: 'Google', url: 'https://google.com', icon: 'Search', color: '#4285F4' },
  { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com', icon: 'Search', color: '#DE5833' },
  { id: 'wikipedia', name: 'Wikipedia', url: 'https://wikipedia.org', icon: 'BookOpen', color: '#000000' },
  { id: 'github', name: 'GitHub', url: 'https://github.com', icon: 'Code', color: '#6e5494' },
  { id: 'reddit', name: 'Reddit', url: 'https://reddit.com', icon: 'Globe', color: '#FF4500' },
  { id: 'hackernews', name: 'Hacker News', url: 'https://news.ycombinator.com', icon: 'Newspaper', color: '#FF6600' },
  { id: 'amazon', name: 'Amazon', url: 'https://amazon.com', icon: 'ShoppingBag', color: '#FF9900' },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com', icon: 'Film', color: '#FF0000' },
  { id: 'spotify', name: 'Spotify', url: 'https://spotify.com', icon: 'Music', color: '#1DB954' },
];



// Leaderboard entry
export const leaderboardEntrySchema = z.object({
  userId: z.string(),
  username: z.string(),
  profilePicture: z.string().optional(),
  level: z.number(),
  xp: z.number(),
  badge: badgeSchema.optional(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;

// Level perks and requirements
export const LEVEL_PERKS = {
  1: { name: 'Newcomer', xpRequired: 0, canSendLinks: false, canSendImages: false },
  5: { name: 'Explorer', xpRequired: 100, canSendLinks: true, canSendImages: false },
  10: { name: 'Adventurer', xpRequired: 300, canSendLinks: true, canSendImages: true, badge: 'star' as Badge },
  25: { name: 'Veteran', xpRequired: 1000, canSendLinks: true, canSendImages: true, badge: 'shield' as Badge },
  50: { name: 'Expert', xpRequired: 3000, canSendLinks: true, canSendImages: true, badge: 'goat' as Badge },
  100: { name: 'Master', xpRequired: 7500, canSendLinks: true, canSendImages: true, badge: 'crown' as Badge },
  5000: { name: 'Legend', xpRequired: 500000, canSendLinks: true, canSendImages: true, badge: 'fire' as Badge },
} as const;

export const XP_REWARDS = {
  chatMessage: 2,
  search: 5,
  imageShare: 10,
  linkShare: 5,
  questComplete: 50,
} as const;

// Quest system schemas
export const questTypeSchema = z.enum(['daily_chat', 'daily_search', 'daily_browse', 'daily_login', 'daily_share']);
export type QuestType = z.infer<typeof questTypeSchema>;

export const questSchema = z.object({
  id: z.string(),
  type: questTypeSchema,
  title: z.string(),
  description: z.string(),
  xpReward: z.number(),
  requirement: z.number(),
  progress: z.number().default(0),
  completed: z.boolean().default(false),
});

export type Quest = z.infer<typeof questSchema>;

export const userQuestDataSchema = z.object({
  userId: z.string(),
  quests: z.array(questSchema),
  lastResetTime: z.string(),
  dailyQuestsCompleted: z.number().default(0),
});

export type UserQuestData = z.infer<typeof userQuestDataSchema>;

// Quest constants
export const DAILY_QUEST_LIMIT = 5000;
export const QUEST_RESET_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// Default quests that reset every 6 hours
export const DEFAULT_QUESTS: Omit<Quest, 'id' | 'progress' | 'completed'>[] = [
  { type: 'daily_chat', title: 'Chat Champion', description: 'Send 5 messages in chat', xpReward: 50, requirement: 5 },
  { type: 'daily_search', title: 'Web Explorer', description: 'Search 3 websites', xpReward: 75, requirement: 3 },
  { type: 'daily_browse', title: 'Page Turner', description: 'Visit 5 different pages', xpReward: 60, requirement: 5 },
  { type: 'daily_login', title: 'Daily Check-in', description: 'Log in today', xpReward: 25, requirement: 1 },
  { type: 'daily_share', title: 'Sharing is Caring', description: 'Share a link or image', xpReward: 100, requirement: 1 },
];

// ==================== FRIENDS SYSTEM ====================

export const friendStatusSchema = z.enum(['pending', 'accepted', 'blocked']);
export type FriendStatus = z.infer<typeof friendStatusSchema>;

export const friendRequestSchema = z.object({
  id: z.string(),
  requesterId: z.string(),
  addresseeId: z.string(),
  status: friendStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type FriendRequest = z.infer<typeof friendRequestSchema>;

export const messagePrivacySchema = z.enum(['public', 'friends', 'off']);
export type MessagePrivacy = z.infer<typeof messagePrivacySchema>;

export const userSettingsSchema = z.object({
  userId: z.string(),
  allowFriendRequests: z.boolean().default(true),
  messagePrivacy: messagePrivacySchema.default('public'),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// ==================== DIRECT MESSAGES ====================

export const dmThreadSchema = z.object({
  id: z.string(),
  memberIds: z.array(z.string()).length(2),
  lastMessageAt: z.string(),
  createdAt: z.string(),
});

export type DMThread = z.infer<typeof dmThreadSchema>;

export const dmMessageSchema = z.object({
  id: z.string(),
  threadId: z.string(),
  senderId: z.string(),
  message: z.string(),
  timestamp: z.string(),
  imageUrl: z.string().optional(),
});

export type DMMessage = z.infer<typeof dmMessageSchema>;

// ==================== SERVERS ====================

export const serverThemeSchema = z.enum([
  'dark', 'light', 'cyberpunk', 'neon', 'minimal', 'gradient', 'sunset', 
  'ocean', 'forest', 'lavender', 'matrix', 'candy', 'midnight', 'retro',
  'synthwave', 'space', 'fire', 'ice', 'gold', 'silver', 'rainbow'
]);

export type ServerTheme = z.infer<typeof serverThemeSchema>;

export const serverBoostSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  userId: z.string(),
  amount: z.number(),
  timestamp: z.string(),
});

export type ServerBoost = z.infer<typeof serverBoostSchema>;

export const serverSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
  discoverable: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
  createdAt: z.string(),
  theme: serverThemeSchema.default('dark'),
  boostBalance: z.number().default(0),
  boostLevel: z.number().default(0),
  features: z.object({
    animatedUsernames: z.boolean().default(false),
    customEmojis: z.boolean().default(false),
    bannerImage: z.string().optional(),
    promotionSlots: z.number().default(0),
  }).default({}),
});

export type Server = z.infer<typeof serverSchema>;

export const createServerSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  discoverable: z.boolean().default(false),
  tags: z.array(z.string()).default([]),
});

export type CreateServerRequest = z.infer<typeof createServerSchema>;

export const serverRoleSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  name: z.string(),
  permissions: z.array(z.string()).default([]),
  color: z.string().optional(),
  position: z.number().default(0),
  createdBy: z.string(),
  createdAt: z.string(),
});

export type ServerRole = z.infer<typeof serverRoleSchema>;

export const createRoleSchema = z.object({
  name: z.string().min(1).max(50),
  permissions: z.array(z.string()).default([]),
  color: z.string().optional(),
});

export type CreateRoleRequest = z.infer<typeof createRoleSchema>;

export const serverMemberSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  userId: z.string(),
  roles: z.array(z.string()).default([]),
  joinedAt: z.string(),
  nickname: z.string().optional(),
});

export type ServerMember = z.infer<typeof serverMemberSchema>;

// ==================== CHANNELS ====================

export const channelTypeSchema = z.enum(['text', 'voice', 'quote', 'bot']);
export type ChannelType = z.infer<typeof channelTypeSchema>;

export const channelSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  name: z.string(),
  type: channelTypeSchema,
  topic: z.string().optional(),
  position: z.number().default(0),
  createdAt: z.string(),
});

export type Channel = z.infer<typeof channelSchema>;

export const createChannelSchema = z.object({
  name: z.string().min(1).max(100),
  type: channelTypeSchema,
  topic: z.string().max(1024).optional(),
});

export type CreateChannelRequest = z.infer<typeof createChannelSchema>;

export const channelMessageSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  userId: z.string(),
  username: z.string(),
  profilePicture: z.string().optional(),
  message: z.string(),
  timestamp: z.string(),
  imageUrl: z.string().optional(),
  quotedMessageId: z.string().optional(),
  level: z.number().optional(),
  badge: badgeSchema.optional(),
});

export type ChannelMessage = z.infer<typeof channelMessageSchema>;

export const sendChannelMessageSchema = z.object({
  message: z.string().min(1).max(2000),
  imageUrl: z.string().url().optional(),
  quotedMessageId: z.string().optional(),
});

export type SendChannelMessageRequest = z.infer<typeof sendChannelMessageSchema>;

// ==================== BOTS ====================

export const botConfigSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  endpoint: z.string().optional(),
  enabled: z.boolean().default(true),
  createdAt: z.string(),
});

export type BotConfig = z.infer<typeof botConfigSchema>;

// ==================== EXTENDED NAV ITEMS ====================

export const extendedNavItems = [
  ...sidebarNavItems.slice(0, 5),
  { id: 'friends', label: 'Friends', icon: 'users' },
  { id: 'servers', label: 'Servers', icon: 'server' },
  { id: 'discovery', label: 'Discovery', icon: 'compass' },
  ...sidebarNavItems.slice(5),
] as const;

export type ExtendedNavItemId = typeof extendedNavItems[number]['id'] | 'chat' | 'leaderboard';

// ==================== BROWSER TABS ====================

export const browserTabSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  favicon: z.string().optional(),
  isActive: z.boolean().default(false),
});

export type BrowserTab = z.infer<typeof browserTabSchema>;

export const userTabsSchema = z.object({
  userId: z.string(),
  tabs: z.array(browserTabSchema),
  lastUpdated: z.string(),
});

export type UserTabs = z.infer<typeof userTabsSchema>;