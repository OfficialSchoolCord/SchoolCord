
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
});

export type User = z.infer<typeof userSchema>;

// AI chat message schema
export const aiMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export type AIMessage = z.infer<typeof aiMessageSchema>;

export type NavItemId = 'home' | 'search' | 'apps' | 'ai' | 'chat' | 'settings' | 'history' | 'profile' | 'admin';

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
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const sendChatMessageSchema = z.object({
  room: chatRoomSchema,
  message: z.string().min(1).max(500),
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
