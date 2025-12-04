import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { fetchRequestSchema, loginSchema, registerSchema, defaultQuickApps, aiChatRequestSchema, userRoleSchema } from "@shared/schema";
import * as storage from "./storage";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254',
  'metadata.google.internal',
  '10.',
  '172.16.',
  '172.17.',
  '172.18.',
  '172.19.',
  '172.20.',
  '172.21.',
  '172.22.',
  '172.23.',
  '172.24.',
  '172.25.',
  '172.26.',
  '172.27.',
  '172.28.',
  '172.29.',
  '172.30.',
  '172.31.',
  '192.168.',
];

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers['x-session-id'];
  if (!sessionId || !storage.storage.sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const userId = storage.storage.sessions.get(sessionId);
  if (storage.isUserBanned(userId!)) {
    return res.status(403).json({ error: 'Account banned' });
  }
  req.userId = userId;
  next();
}

// Middleware to check admin
function requireAdmin(req: any, res: any, next: any) {
  const user = storage.getUser(req.userId);
  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Middleware to check moderator access (admin or mod)
function requireModerator(req: any, res: any, next: any) {
  if (!storage.hasModeratorAccess(req.userId)) {
    return res.status(403).json({ error: 'Moderator access required' });
  }
  next();
}

const MAX_RESPONSE_SIZE = 5 * 1024 * 1024;
const REQUEST_TIMEOUT = 10000;

function isBlockedHost(hostname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  
  for (const blocked of BLOCKED_HOSTS) {
    if (lowerHost === blocked || lowerHost.startsWith(blocked)) {
      return true;
    }
  }
  
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
    const parts = hostname.split('.').map(Number);
    if (parts[0] === 10) return true;
    if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;
    if (parts[0] === 192 && parts[1] === 168) return true;
    if (parts[0] === 127) return true;
    if (parts[0] === 0) return true;
  }
  
  return false;
}

function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return false;
    }
    if (isBlockedHost(url.hostname)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(input: string): string {
  let url = input.trim();
  
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    }
  }
  
  return url;
}

function isSearchQuery(input: string): boolean {
  const normalized = input.trim();
  
  if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
    return false;
  }
  
  if (normalized.includes(' ')) {
    return true;
  }
  
  if (!normalized.includes('.')) {
    return true;
  }
  
  const domainPattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/;
  if (domainPattern.test(normalized)) {
    return false;
  }
  
  return true;
}

function extractTextContent(html: string): { title: string; content: string } {
  const $ = cheerio.load(html);
  
  $('script').remove();
  $('style').remove();
  $('noscript').remove();
  $('iframe').remove();
  $('nav').remove();
  $('footer').remove();
  $('header').remove();
  $('[role="navigation"]').remove();
  $('[role="banner"]').remove();
  $('[role="contentinfo"]').remove();
  $('.nav').remove();
  $('.navigation').remove();
  $('.menu').remove();
  $('.sidebar').remove();
  $('.advertisement').remove();
  $('.ad').remove();
  $('.ads').remove();
  $('[class*="cookie"]').remove();
  $('[id*="cookie"]').remove();
  
  const title = $('title').first().text().trim() || 
                $('h1').first().text().trim() || 
                'Untitled Page';
  
  const mainContent = $('main, article, [role="main"], .content, .main, #content, #main').first();
  
  let textContent = '';
  
  if (mainContent.length) {
    textContent = extractFormattedText($, mainContent);
  } else {
    textContent = extractFormattedText($, $('body'));
  }
  
  textContent = textContent
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
  
  if (textContent.length > 15000) {
    textContent = textContent.substring(0, 15000) + '\n\n... [Content truncated]';
  }
  
  return { title, content: textContent };
}

function extractFormattedText($: cheerio.CheerioAPI, element: cheerio.Cheerio<any>): string {
  let result = '';
  
  element.contents().each((_, node) => {
    if (node.type === 'text') {
      const text = $(node).text().trim();
      if (text) {
        result += text + ' ';
      }
    } else if (node.type === 'tag') {
      const tagName = node.name.toLowerCase();
      const $el = $(node);
      
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        const headingText = $el.text().trim();
        if (headingText) {
          result += '\n\n## ' + headingText + '\n\n';
        }
      } else if (tagName === 'p') {
        const pText = extractFormattedText($, $el);
        if (pText.trim()) {
          result += '\n\n' + pText.trim() + '\n';
        }
      } else if (tagName === 'a') {
        const linkText = $el.text().trim();
        const href = $el.attr('href');
        if (linkText && href) {
          result += `[${linkText}](${href}) `;
        } else if (linkText) {
          result += linkText + ' ';
        }
      } else if (tagName === 'li') {
        const liText = extractFormattedText($, $el);
        if (liText.trim()) {
          result += '\n- ' + liText.trim();
        }
      } else if (tagName === 'br') {
        result += '\n';
      } else if (['div', 'section', 'article'].includes(tagName)) {
        result += extractFormattedText($, $el);
      } else if (['strong', 'b'].includes(tagName)) {
        const strongText = $el.text().trim();
        if (strongText) {
          result += '**' + strongText + '** ';
        }
      } else if (['em', 'i'].includes(tagName)) {
        const emText = $el.text().trim();
        if (emText) {
          result += '*' + emText + '* ';
        }
      } else if (tagName === 'blockquote') {
        const quoteText = extractFormattedText($, $el);
        if (quoteText.trim()) {
          result += '\n\n> ' + quoteText.trim().replace(/\n/g, '\n> ') + '\n';
        }
      } else if (tagName === 'code') {
        const codeText = $el.text().trim();
        if (codeText) {
          result += '`' + codeText + '` ';
        }
      } else if (tagName === 'pre') {
        const preText = $el.text().trim();
        if (preText) {
          result += '\n\n```\n' + preText + '\n```\n\n';
        }
      } else {
        result += extractFormattedText($, $el);
      }
    }
  });
  
  return result;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validation = registerSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid registration data' });
      }

      const { username, password, email } = validation.data;
      
      if (storage.getUserByUsername(username)) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      const user = storage.createUser(username, password, email);
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      storage.storage.sessions.set(sessionId, user.id);

      // Initialize default quick apps for new user
      const userApps = defaultQuickApps.map((app, index) => ({
        ...app,
        userId: user.id,
        order: index,
      }));
      storage.setUserQuickApps(user.id, userApps);

      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword, sessionId });
    } catch (error) {
      return res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid login data' });
      }

      const { username, password } = validation.data;
      const user = storage.getUserByUsername(username);

      if (!user || user.password !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (storage.isUserBanned(user.id)) {
        return res.status(403).json({ error: 'Account has been banned' });
      }

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      storage.storage.sessions.set(sessionId, user.id);
      storage.updateUser(user.id, { lastLogin: new Date().toISOString() });

      const { password: _, ...userWithoutPassword } = user;
      return res.json({ user: userWithoutPassword, sessionId });
    } catch (error) {
      return res.status(500).json({ error: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', requireAuth, async (req: any, res) => {
    const sessionId = req.headers['x-session-id'];
    storage.storage.sessions.delete(sessionId);
    return res.json({ success: true });
  });

  app.get('/api/auth/me', requireAuth, async (req: any, res) => {
    const user = storage.getUser(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = user;
    return res.json({ user: userWithoutPassword });
  });

  app.put('/api/auth/profile', requireAuth, async (req: any, res) => {
    const { username, profilePicture } = req.body;
    const updated = storage.updateUser(req.userId, { username, profilePicture });
    if (!updated) {
      return res.status(404).json({ error: 'User not found' });
    }
    const { password: _, ...userWithoutPassword } = updated;
    return res.json({ user: userWithoutPassword });
  });

  // Quick apps routes
  app.get('/api/quick-apps', requireAuth, async (req: any, res) => {
    const apps = storage.getUserQuickApps(req.userId);
    return res.json({ apps });
  });

  app.post('/api/quick-apps', requireAuth, async (req: any, res) => {
    const apps = req.body.apps;
    storage.setUserQuickApps(req.userId, apps);
    return res.json({ success: true, apps });
  });

  // History routes
  app.get('/api/history', requireAuth, async (req: any, res) => {
    const history = storage.getUserHistory(req.userId);
    return res.json({ history });
  });

  // Admin routes
  app.get('/api/admin/users', requireAuth, requireAdmin, async (req, res) => {
    const users = storage.getAllUsers();
    return res.json({ users });
  });

  app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req, res) => {
    const analytics = storage.getAnalytics();
    return res.json(analytics);
  });

  app.post('/api/admin/ban-user', requireAuth, requireAdmin, async (req, res) => {
    const { userId } = req.body;
    storage.banUser(userId);
    return res.json({ success: true });
  });

  app.post('/api/admin/unban-user', requireAuth, requireAdmin, async (req, res) => {
    const { userId } = req.body;
    storage.unbanUser(userId);
    return res.json({ success: true });
  });

  app.post('/api/admin/block-website', requireAuth, requireAdmin, async (req: any, res) => {
    const { url, reason } = req.body;
    const blocked = storage.addBlockedWebsite(url, req.userId, reason);
    return res.json({ success: true, blocked });
  });

  app.post('/api/admin/unblock-website', requireAuth, requireAdmin, async (req, res) => {
    const { id } = req.body;
    storage.removeBlockedWebsite(id);
    return res.json({ success: true });
  });

  app.get('/api/admin/blocked-websites', requireAuth, requireModerator, async (req, res) => {
    const blocked = storage.getBlockedWebsites();
    return res.json({ blocked });
  });

  // Role management (admin only)
  app.post('/api/admin/set-role', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, role } = req.body;
      
      const validation = userRoleSchema.safeParse(role);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid role. Must be user, mod, or admin' });
      }
      
      const user = storage.setUserRole(userId, validation.data);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to update role' });
    }
  });

  // AI Chat endpoint
  app.post('/api/ai/chat', requireAuth, async (req: any, res) => {
    try {
      const validation = aiChatRequestSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid request' });
      }

      const { message, history = [] } = validation.data;

      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({ error: 'AI service not configured' });
      }

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for a web browser application called Illing Star. You can help users with questions, provide information, and assist with various tasks. Be friendly, concise, and helpful.'
        },
        ...history.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
        { role: 'user', content: message }
      ];

      const response = await openai.chat.completions.create({
        model: 'gpt-5',
        messages,
        max_completion_tokens: 1024,
      });

      const assistantMessage = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

      return res.json({
        success: true,
        message: assistantMessage,
      });
    } catch (error: any) {
      console.error('AI chat error:', error);
      return res.status(500).json({ 
        error: error.message || 'Failed to get AI response' 
      });
    }
  });
  
  app.post('/api/browse', async (req, res) => {
    try {
      const validation = fetchRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          url: '',
          error: 'Invalid request: URL is required',
        });
      }
      
      const { url: inputUrl } = validation.data;
      
      if (isSearchQuery(inputUrl)) {
        const searchQuery = encodeURIComponent(inputUrl);
        const searchUrl = `https://duckduckgo.com/?q=${searchQuery}`;
        const htmlUrl = `https://html.duckduckgo.com/html/?q=${searchQuery}`;
        
        try {
          const response = await axios.get(htmlUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: REQUEST_TIMEOUT,
            maxRedirects: 3,
            maxContentLength: MAX_RESPONSE_SIZE,
            maxBodyLength: MAX_RESPONSE_SIZE,
          });
          
          const $ = cheerio.load(response.data);
          
          let searchResults = '';
          
          $('.result').each((index, element) => {
            if (index >= 15) return false;
            
            const $result = $(element);
            const title = $result.find('.result__title').text().trim();
            const snippet = $result.find('.result__snippet').text().trim();
            const link = $result.find('.result__url').text().trim();
            
            if (title) {
              searchResults += `\n\n### ${title}\n`;
              if (link) {
                searchResults += `*${link}*\n`;
              }
              if (snippet) {
                searchResults += snippet;
              }
            }
          });
          
          if (!searchResults) {
            searchResults = 'No search results found. Try a different search term.';
          }
          
          return res.json({
            success: true,
            url: searchUrl,
            title: `Search: ${inputUrl}`,
            content: `# Search Results for "${inputUrl}"\n\nResults from DuckDuckGo:\n${searchResults}`,
            isSearch: true,
            searchUrl: searchUrl,
          });
          
        } catch (searchError) {
          return res.json({
            success: true,
            url: searchUrl,
            title: `Search: ${inputUrl}`,
            content: `# Search: "${inputUrl}"\n\nClick "Open in new tab" to view search results on DuckDuckGo.`,
            isSearch: true,
            searchUrl: searchUrl,
          });
        }
      }
      
      const normalizedUrl = normalizeUrl(inputUrl);
      
      if (!isValidUrl(normalizedUrl)) {
        return res.status(400).json({
          success: false,
          url: inputUrl,
          error: 'Invalid URL format. Please enter a valid website address.',
        });
      }

      // Check if website is blocked
      if (storage.isWebsiteBlocked(normalizedUrl)) {
        return res.status(403).json({
          success: false,
          url: normalizedUrl,
          error: 'This website has been blocked by an administrator.',
        });
      }

      // Track page view and add to history
      storage.incrementPageViews();
      const sessionId = req.headers['x-session-id'];
      if (sessionId && storage.storage.sessions.has(sessionId)) {
        const userId = storage.storage.sessions.get(sessionId);
        if (userId) {
          storage.addToHistory(userId, {
            url: normalizedUrl,
            title: '',
            visitedAt: new Date().toISOString(),
            userId,
          });
        }
      }
      
      const response = await axios.get(normalizedUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        timeout: REQUEST_TIMEOUT,
        maxRedirects: 3,
        maxContentLength: MAX_RESPONSE_SIZE,
        maxBodyLength: MAX_RESPONSE_SIZE,
        responseType: 'text',
        validateStatus: (status) => status >= 200 && status < 400,
      });
      
      const contentType = response.headers['content-type'] || '';
      
      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return res.json({
          success: true,
          url: normalizedUrl,
          title: 'File Content',
          content: `This URL points to a non-HTML resource (${contentType}).\n\nThe content cannot be displayed as text. Click "Open in new tab" to view it directly.`,
          isSearch: false,
        });
      }
      
      const { title, content } = extractTextContent(response.data);

      // Update history with title
      if (sessionId && storage.storage.sessions.has(sessionId)) {
        const userId = storage.storage.sessions.get(sessionId);
        if (userId) {
          const history = storage.getUserHistory(userId);
          if (history.length > 0 && history[0].url === normalizedUrl) {
            history[0].title = title;
          }
        }
      }
      
      return res.json({
        success: true,
        url: normalizedUrl,
        title,
        content,
        isSearch: false,
      });
      
    } catch (error) {
      let errorMessage = 'Failed to fetch the page';
      
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          errorMessage = 'Could not connect to the website. The server may be down.';
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. The website took too long to respond.';
        } else if (error.code === 'ENOTFOUND') {
          errorMessage = 'Website not found. Please check the URL and try again.';
        } else if (error.response) {
          const status = error.response.status;
          if (status === 403) {
            errorMessage = 'Access denied. This website blocks automated requests.';
          } else if (status === 404) {
            errorMessage = 'Page not found. The URL may be incorrect.';
          } else if (status >= 500) {
            errorMessage = 'The website is experiencing server issues. Please try again later.';
          } else {
            errorMessage = `Request failed with status ${status}`;
          }
        }
      }
      
      return res.status(500).json({
        success: false,
        url: req.body?.url || '',
        error: errorMessage,
      });
    }
  });

  return httpServer;
}
