import { z } from "zod";

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

// History item schema (for future use)
export const historyItemSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  visitedAt: z.string(),
  favicon: z.string().optional(),
});

export type HistoryItem = z.infer<typeof historyItemSchema>;

// Bookmark schema (for future use)
export const bookmarkSchema = z.object({
  id: z.string(),
  url: z.string(),
  title: z.string(),
  createdAt: z.string(),
  favicon: z.string().optional(),
});

export type Bookmark = z.infer<typeof bookmarkSchema>;

// Sidebar navigation items
export const sidebarNavItems = [
  { id: 'home', label: 'Home', icon: 'home' },
  { id: 'search', label: 'Search', icon: 'search' },
  { id: 'apps', label: 'Apps', icon: 'apps' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'history', label: 'History', icon: 'history' },
  { id: 'profile', label: 'Profile', icon: 'profile' },
] as const;

export type NavItemId = typeof sidebarNavItems[number]['id'];
