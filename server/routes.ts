import type { Express } from "express";
import { createServer, type Server } from "http";
import http from "http";
import https from "https";
import axios from "axios";
import * as cheerio from "cheerio";
import OpenAI from "openai";
import { fetchRequestSchema, loginSchema, registerSchema, defaultQuickApps, aiChatRequestSchema, userRoleSchema, sendChatMessageSchema, createServerSchema, createChannelSchema, sendChannelMessageSchema } from "@shared/schema";
import type { ChatRoom, ChannelType } from "@shared/schema";
import * as storage from "./storage";
import _0xPupDefault from 'puppeteer-extra';
import _0xStealthPlugin from 'puppeteer-extra-plugin-stealth';
const _0xPup = _0xPupDefault as any;
_0xPup.use(_0xStealthPlugin());

const _0xHttpAgent = new http.Agent({ keepAlive: true, maxSockets: 100, maxFreeSockets: 20, timeout: 60000, scheduling: 'fifo' });
const _0xHttpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100, maxFreeSockets: 20, timeout: 60000 });
const _0xCache = new Map<string, { data: Buffer; contentType: string; timestamp: number }>();
const _0xCacheMaxSize = 500;
const _0xCacheTTL = 300000;
const _0xCacheableTypes = /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|gif|webp|ico|mp3|ogg|wav|wasm)$/i;
const _0xCleanCache = () => {
  const now = Date.now();
  if (_0xCache.size > _0xCacheMaxSize) {
    const entries = Array.from(_0xCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, entries.length - _0xCacheMaxSize + 50);
    toRemove.forEach(([key]) => _0xCache.delete(key));
  }
  for (const [key, value] of _0xCache.entries()) {
    if (now - value.timestamp > _0xCacheTTL) {
      _0xCache.delete(key);
    }
  }
};
setInterval(_0xCleanCache, 60000);

let _0xBrowser: any = null;
const _0xBrowserLock = { locked: false };
const _0xHardSites = /tiktok\.com|instagram\.com|facebook\.com|twitter\.com|x\.com/i;

async function _0xGetBrowser() {
  if (_0xBrowser && _0xBrowser.isConnected()) return _0xBrowser;
  while (_0xBrowserLock.locked) await new Promise(r => setTimeout(r, 100));
  _0xBrowserLock.locked = true;
  try {
    if (!_0xBrowser || !_0xBrowser.isConnected()) {
      const chromePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium';
      _0xBrowser = await _0xPup.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-web-security', '--disable-features=IsolateOrigins,site-per-process', '--single-process', '--no-zygote'],
        executablePath: chromePath,
        ignoreDefaultArgs: ['--enable-automation'],
      });
    }
    return _0xBrowser;
  } finally {
    _0xBrowserLock.locked = false;
  }
}

async function _0xStealthFetch(url: string, timeout = 30000): Promise<{ html: string; status: number }> {
  const browser = await _0xGetBrowser();
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      (window as any).chrome = { runtime: {} };
    });
    const response = await page.goto(url, { waitUntil: 'networkidle2', timeout });
    await new Promise(r => setTimeout(r, 3000));
    const html = await page.content();
    return { html, status: response?.status() || 200 };
  } finally {
    await page.close().catch(() => {});
  }
}

// SambaNova API client using OpenAI-compatible format
function getAIClient(): OpenAI | null {
  const apiKey = process.env.SAMBANOVA_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return null;
  }
  
  // Use SambaNova if key is available, otherwise fallback to OpenAI
  if (process.env.SAMBANOVA_API_KEY) {
    return new OpenAI({
      apiKey: process.env.SAMBANOVA_API_KEY,
      baseURL: 'https://api.sambanova.ai/v1',
    });
  }
  
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

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

const MAX_RESPONSE_SIZE = 50 * 1024 * 1024;
const REQUEST_TIMEOUT = 45000;

const _0x7b = [0x5A, 0x3F, 0x7C, 0x2B, 0x6E];
const _0x9c = (i: number) => _0x7b[i % _0x7b.length];
const _0x3e = (s: string): string => {
  const b = Buffer.from(s, 'utf-8');
  const r = Buffer.alloc(b.length);
  for (let i = 0; i < b.length; i++) { r[i] = b[i] ^ _0x9c(i); }
  return r.toString('base64url');
};
const _0x4d = (e: string): string => {
  try {
    const b = Buffer.from(e, 'base64url');
    const r = Buffer.alloc(b.length);
    for (let i = 0; i < b.length; i++) { r[i] = b[i] ^ _0x9c(i); }
    return r.toString('utf-8');
  } catch { return ''; }
};
const _0xUA = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
];
const _0xGetUA = () => _0xUA[Math.floor(Math.random() * _0xUA.length)];

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
  
  // Hidden proxy - encode URL endpoint
  app.post('/api/~e', async (req, res) => {
    try {
      const { u } = req.body;
      if (!u || typeof u !== 'string') {
        return res.status(400).json({ e: 1 });
      }
      const encoded = _0x3e(u);
      return res.json({ r: encoded });
    } catch {
      return res.status(500).json({ e: 1 });
    }
  });

  // Helper to resolve URL relative to base
  const resolveUrl = (href: string, baseUrl: URL): string | null => {
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('data:') || href.startsWith('blob:')) {
      return null;
    }
    try {
      if (href.startsWith('http://') || href.startsWith('https://')) {
        return href;
      } else if (href.startsWith('//')) {
        return baseUrl.protocol + href;
      } else if (href.startsWith('/')) {
        return baseUrl.origin + href;
      } else {
        return new URL(href, baseUrl.href).href;
      }
    } catch {
      return null;
    }
  };

  // Comprehensive HTML rewriter for proxy
  const rewriteHtml = (html: string, baseUrl: URL): string => {
    const $ = cheerio.load(html, { decodeEntities: false });
    
    // Remove existing base tags to prevent conflicts
    $('base').remove();
    
    // Remove target attributes that could escape iframe
    $('[target="_top"], [target="_parent"], [target="_blank"]').each((_, el) => {
      $(el).removeAttr('target');
    });
    
    // Remove onclick handlers that might navigate parent
    $('[onclick]').each((_, el) => {
      const onclick = $(el).attr('onclick') || '';
      if (onclick.includes('top.') || onclick.includes('parent.') || onclick.includes('window.open')) {
        $(el).removeAttr('onclick');
      }
    });
    
    // Rewrite all navigational URLs (links, forms)
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      const resolved = resolveUrl(href!, baseUrl);
      if (resolved) {
        $(el).attr('href', '/~s/' + _0x3e(resolved));
      }
    });

    $('form[action]').each((_, el) => {
      const action = $(el).attr('action') || baseUrl.href;
      const resolved = resolveUrl(action, baseUrl);
      if (resolved) {
        $(el).attr('action', '/~s/' + _0x3e(resolved));
      }
    });

    // Rewrite asset URLs (images, scripts, stylesheets, iframes, etc.)
    const assetAttrs: [string, string][] = [
      ['img', 'src'],
      ['img', 'srcset'],
      ['script', 'src'],
      ['link[rel="stylesheet"]', 'href'],
      ['link[rel="icon"]', 'href'],
      ['link[rel="preload"]', 'href'],
      ['source', 'src'],
      ['source', 'srcset'],
      ['video', 'src'],
      ['video', 'poster'],
      ['audio', 'src'],
      ['iframe', 'src'],
      ['embed', 'src'],
      ['object', 'data'],
    ];

    for (const [selector, attr] of assetAttrs) {
      $(`${selector}[${attr}]`).each((_, el) => {
        const value = $(el).attr(attr);
        if (value) {
          if (attr === 'srcset') {
            const parts = value.split(',').map(part => {
              const [url, descriptor] = part.trim().split(/\s+/);
              const resolved = resolveUrl(url, baseUrl);
              if (resolved) {
                return '/~s/' + _0x3e(resolved) + (descriptor ? ' ' + descriptor : '');
              }
              return part;
            });
            $(el).attr(attr, parts.join(', '));
          } else {
            const resolved = resolveUrl(value, baseUrl);
            if (resolved) {
              $(el).attr(attr, '/~s/' + _0x3e(resolved));
            }
          }
        }
      });
    }

    // Rewrite CSS url() references in style tags
    $('style').each((_, el) => {
      let css = $(el).html() || '';
      css = css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) {
          return `url('/~s/${_0x3e(resolved)}')`;
        }
        return match;
      });
      $(el).html(css);
    });

    // Rewrite inline style url() references
    $('[style]').each((_, el) => {
      let style = $(el).attr('style') || '';
      style = style.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
        const resolved = resolveUrl(url, baseUrl);
        if (resolved) {
          return `url('/~s/${_0x3e(resolved)}')`;
        }
        return match;
      });
      $(el).attr('style', style);
    });

    // Remove CSP meta tags that might block our scripts
    $('meta[http-equiv="Content-Security-Policy"]').remove();
    $('meta[http-equiv="X-Frame-Options"]').remove();
    
    // Inject anti-detection and iframe containment script at the start of head
    const antiDetectionScript = `
<script>
(function(){
  // Prevent parent/top navigation
  try {
    Object.defineProperty(window, 'top', { get: function() { return window; }, configurable: false });
    Object.defineProperty(window, 'parent', { get: function() { return window; }, configurable: false });
    Object.defineProperty(window, 'frameElement', { get: function() { return null; }, configurable: false });
  } catch(e) {}
  
  // Spoof ad blocker detection
  window.canRunAds = true;
  window.adBlockEnabled = false;
  window.adblockEnabled = false;
  window.AdBlockEnabled = false;
  
  // Create fake ad elements for detection scripts
  var fakeAd = document.createElement('div');
  fakeAd.className = 'ad ads adsbox ad-banner';
  fakeAd.id = 'ad-container';
  fakeAd.style.cssText = 'position:absolute;left:-9999px;width:1px;height:1px;';
  fakeAd.innerHTML = '<div class="adsbygoogle"></div>';
  document.addEventListener('DOMContentLoaded', function() {
    document.body.appendChild(fakeAd);
  });
  
  // Override common ad block detection methods
  var origGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(el) {
    var result = origGetComputedStyle.apply(this, arguments);
    if (el && (el.className || '').match(/ad|ads|adsbox|ad-banner|adsbygoogle/i)) {
      return new Proxy(result, {
        get: function(target, prop) {
          if (prop === 'display') return 'block';
          if (prop === 'visibility') return 'visible';
          if (prop === 'height') return '1px';
          if (prop === 'width') return '1px';
          return typeof target[prop] === 'function' ? target[prop].bind(target) : target[prop];
        }
      });
    }
    return result;
  };
  
  // Override fetch for ad-related checks
  var origFetch = window.fetch;
  window.fetch = function(url) {
    if (typeof url === 'string' && url.match(/ads|adblock|pagead|doubleclick|googlesyndication/i)) {
      return Promise.resolve(new Response('', { status: 200 }));
    }
    return origFetch.apply(this, arguments);
  };
  
  // Override XMLHttpRequest for ad-related checks
  var origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._url = url;
    return origXHROpen.apply(this, arguments);
  };
  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    if (this._url && typeof this._url === 'string' && this._url.match(/ads|adblock|pagead|doubleclick|googlesyndication/i)) {
      Object.defineProperty(this, 'status', { value: 200 });
      Object.defineProperty(this, 'readyState', { value: 4 });
      Object.defineProperty(this, 'responseText', { value: '' });
      if (this.onload) setTimeout(this.onload.bind(this), 0);
      if (this.onreadystatechange) setTimeout(this.onreadystatechange.bind(this), 0);
      return;
    }
    return origXHRSend.apply(this, arguments);
  };
  
  // Prevent window.open from escaping
  var origOpen = window.open;
  window.open = function(url, target) {
    if (url && typeof url === 'string') {
      window.location.href = url;
    }
    return null;
  };
  
  // Spoof navigator properties for bot detection
  Object.defineProperty(navigator, 'webdriver', { get: function() { return false; } });
  Object.defineProperty(navigator, 'plugins', { get: function() { return [1,2,3,4,5]; } });
  Object.defineProperty(navigator, 'languages', { get: function() { return ['en-US', 'en']; } });
})();
</script>`;

    // Insert the anti-detection script right after <head>
    const headTag = $('head');
    if (headTag.length) {
      headTag.prepend(antiDetectionScript);
    } else {
      // If no head, prepend to html or body
      const htmlTag = $('html');
      if (htmlTag.length) {
        htmlTag.prepend('<head>' + antiDetectionScript + '</head>');
      }
    }

    return $.html();
  };

  // Catch-all for /~s/ without a parameter - return error page
  app.all('/~s/', (req, res) => {
    return res.status(400).send(`
      <html>
        <body style="background:#1a1a1a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
          <div style="text-align:center;">
            <h2>Invalid Request</h2>
            <p style="color:#888;">No URL specified.</p>
          </div>
        </body>
      </html>
    `);
  });

  // Hidden proxy - serve proxied content (supports all HTTP methods)
  // Use wildcard to catch all paths under /~s/
  app.all('/~s/*', async (req, res) => {
    try {
      // Extract the encoded URL from the path (everything after /~s/)
      const encodedUrl = req.params[0] || '';
      const decoded = _0x4d(encodedUrl);
      if (!decoded || !isValidUrl(decoded)) {
        return res.status(400).send(`
          <html>
            <body style="background:#1a1a1a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
              <div style="text-align:center;">
                <h2>Invalid Request</h2>
                <p style="color:#888;">The requested URL could not be processed.</p>
              </div>
            </body>
          </html>
        `);
      }

      const method = req.method.toLowerCase();
      const isCacheable = method === 'get' && _0xCacheableTypes.test(decoded);
      const cacheKey = decoded;

      if (isCacheable && _0xCache.has(cacheKey)) {
        const cached = _0xCache.get(cacheKey)!;
        res.setHeader('Content-Type', cached.contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('X-Cache', 'HIT');
        return res.send(cached.data);
      }

      const targetUrl = new URL(decoded);
      const targetOrigin = targetUrl.origin;
      
      // Use stealth browser for hard-to-proxy sites (TikTok, Instagram, etc.)
      if (method === 'get' && _0xHardSites.test(targetUrl.hostname)) {
        try {
          const { html, status } = await _0xStealthFetch(decoded, 45000);
          const baseUrl = new URL(decoded);
          const rewrittenHtml = rewriteHtml(html, baseUrl);
          res.status(status);
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('X-Cache', 'STEALTH');
          return res.send(rewrittenHtml);
        } catch (stealthError: any) {
          console.error('Stealth fetch failed:', stealthError.message);
          // Fall through to regular axios if stealth fails
        }
      }
      
      const axiosConfig: any = {
        method,
        url: decoded,
        timeout: REQUEST_TIMEOUT,
        maxContentLength: MAX_RESPONSE_SIZE,
        maxBodyLength: MAX_RESPONSE_SIZE,
        httpAgent: _0xHttpAgent,
        httpsAgent: _0xHttpsAgent,
        decompress: true,
        headers: {
          'User-Agent': _0xGetUA(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Sec-CH-UA': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-CH-UA-Mobile': '?0',
          'Sec-CH-UA-Platform': '"Windows"',
          'Referer': targetOrigin + '/',
          'Origin': targetOrigin,
          'Cache-Control': 'max-age=0',
        },
        responseType: 'arraybuffer',
        validateStatus: () => true,
        maxRedirects: 10,
      };

      if (['post', 'put', 'patch'].includes(method)) {
        if (req.body && Object.keys(req.body).length > 0) {
          axiosConfig.data = req.body;
          axiosConfig.headers['Content-Type'] = req.headers['content-type'] || 'application/x-www-form-urlencoded';
        }
      }

      const response = await axios(axiosConfig);
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      
      if ([301, 302, 303, 307, 308].includes(response.status) && response.headers.location) {
        const baseUrl = new URL(decoded);
        const redirectUrl = resolveUrl(response.headers.location, baseUrl);
        if (redirectUrl) {
          return res.redirect(response.status, '/~s/' + _0x3e(redirectUrl));
        }
      }

      if (contentType.includes('text/html')) {
        const html = Buffer.from(response.data).toString('utf-8');
        const baseUrl = new URL(decoded);
        
        // Check if the site returned an error page or blocked the request
        const isBlockedOrError = response.status === 404 || response.status === 403 || 
          (response.status >= 400 && html.length < 5000 && 
           (html.includes('blocked') || html.includes('captcha') || html.includes('verify') ||
            html.includes('access denied') || html.includes('403') || html.includes('404')));
        
        // For sites that block or return errors, try with different headers
        if (isBlockedOrError && !req.query.retry) {
          try {
            const retryConfig = {
              ...axiosConfig,
              headers: {
                ...axiosConfig.headers,
                'Sec-Fetch-Site': 'same-origin',
                'Sec-Fetch-Mode': 'same-origin',
                'Cookie': `tt_webid=1234567890; tt_webid_v2=1234567890`,
              }
            };
            const retryResponse = await axios(retryConfig);
            if (retryResponse.status === 200 && retryResponse.data.length > html.length) {
              const retryHtml = Buffer.from(retryResponse.data).toString('utf-8');
              const rewrittenHtml = rewriteHtml(retryHtml, baseUrl);
              res.status(200);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('X-Cache', 'RETRY');
              return res.send(rewrittenHtml);
            }
          } catch (retryError) {
            // Continue with original response if retry fails
          }
        }
        
        const rewrittenHtml = rewriteHtml(html, baseUrl);
        
        res.status(response.status);
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('X-Cache', 'MISS');
        return res.send(rewrittenHtml);
      }

      if (contentType.includes('text/css')) {
        let css = Buffer.from(response.data).toString('utf-8');
        const baseUrl = new URL(decoded);
        css = css.replace(/url\(['"]?([^'")]+)['"]?\)/g, (match, url) => {
          const resolved = resolveUrl(url, baseUrl);
          if (resolved) {
            return `url('/~s/${_0x3e(resolved)}')`;
          }
          return match;
        });
        const cssBuffer = Buffer.from(css);
        if (isCacheable && cssBuffer.length < 2 * 1024 * 1024) {
          _0xCache.set(cacheKey, { data: cssBuffer, contentType, timestamp: Date.now() });
        }
        res.status(response.status);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.setHeader('X-Cache', 'MISS');
        return res.send(css);
      }
      
      const responseData = Buffer.from(response.data);
      if (isCacheable && responseData.length < 5 * 1024 * 1024) {
        _0xCache.set(cacheKey, { data: responseData, contentType, timestamp: Date.now() });
      }

      res.status(response.status);
      res.setHeader('Content-Type', contentType);
      
      if (isCacheable) {
        res.setHeader('Cache-Control', 'public, max-age=31536000');
      } else if (response.headers['cache-control']) {
        res.setHeader('Cache-Control', response.headers['cache-control']);
      }
      
      res.setHeader('X-Cache', 'MISS');
      return res.send(responseData);
    } catch (error: any) {
      console.error('Proxy error:', error.message);
      return res.status(500).send(`
        <html>
          <body style="background:#1a1a1a;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
            <div style="text-align:center;">
              <h2>Unable to load page</h2>
              <p style="color:#888;">The requested resource could not be fetched.</p>
            </div>
          </body>
        </html>
      `);
    }
  });

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

      if (!user || !storage.verifyPassword(password, user.password)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (storage.isUserBanned(user.id)) {
        return res.status(403).json({ error: 'Account has been banned' });
      }

      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      storage.storage.sessions.set(sessionId, user.id);
      storage.updateUser(user.id, { lastLogin: new Date().toISOString() });
      
      // Complete daily login quest
      storage.completeLoginQuest(user.id);

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

  // Admin routes - viewing allowed for mods, modifying only for admins
  app.get('/api/admin/users', requireAuth, requireModerator, async (req, res) => {
    const users = storage.getAllUsers();
    return res.json({ users });
  });


  app.get('/api/admin/analytics', requireAuth, requireModerator, async (req, res) => {
    const analytics = storage.getAnalytics();
    return res.json(analytics);
  });

  app.post('/api/admin/ban-user', requireAuth, requireModerator, async (req, res) => {
    const { userId } = req.body;
    storage.banUser(userId);
    return res.json({ success: true });
  });

  app.post('/api/admin/unban-user', requireAuth, requireModerator, async (req, res) => {
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
  app.post('/api/admin/set-role', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId, role } = req.body;
      
      const validation = userRoleSchema.safeParse(role);
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid role. Must be user, mod, or admin' });
      }

      // Prevent changing role of protected accounts unless it's the account owner
      if (storage.isProtectedUser(userId) && req.userId !== userId) {
        return res.status(403).json({ error: 'Cannot change role of protected account' });
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

  // Password management (admin only)
  app.post('/api/admin/change-password', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId, newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }

      // Prevent changing password of protected accounts unless it's the account owner
      if (storage.isProtectedUser(userId) && req.userId !== userId) {
        return res.status(403).json({ error: 'Cannot change password of protected account' });
      }
      
      const user = storage.changeUserPassword(userId, newPassword);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to change password' });
    }
  });

  // Level management (admin only)
  app.post('/api/admin/change-level', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId, newLevel } = req.body;
      
      if (typeof newLevel !== 'number' || newLevel < 1 || newLevel > 10000000000) {
        return res.status(400).json({ error: 'Level must be between 1 and 10 billion' });
      }
      
      const user = storage.changeUserLevel(userId, newLevel);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to change level' });
    }
  });

  // Quest endpoints
  app.get('/api/quests', requireAuth, async (req: any, res) => {
    try {
      const questData = storage.getUserQuests(req.userId);
      const resetTimeRemaining = storage.getQuestResetTimeRemaining(req.userId);
      return res.json({ 
        quests: questData.quests, 
        dailyQuestsCompleted: questData.dailyQuestsCompleted,
        lastResetTime: questData.lastResetTime,
        resetTimeRemaining,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get quests' });
    }
  });

  // Admin quest reset endpoints
  app.post('/api/admin/reset-user-quests', requireAuth, requireAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      const questData = storage.resetUserQuests(userId);
      return res.json({ success: true, quests: questData });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reset user quests' });
    }
  });

  app.post('/api/admin/reset-all-quests', requireAuth, requireAdmin, async (req, res) => {
    try {
      storage.resetAllUserQuests();
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to reset all quests' });
    }
  });

  // Leaderboard endpoint
  app.get('/api/leaderboard', async (req, res) => {
    const leaderboard = storage.getLeaderboard(50);
    return res.json({ leaderboard });
  });

  // Announcement endpoints
  app.post('/api/admin/announce', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { message } = req.body;
      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Message is required' });
      }
      
      const announcement = storage.createAnnouncement(req.userId, message.trim());
      return res.json({ success: true, announcement });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create announcement' });
    }
  });

  app.get('/api/announcements', async (req, res) => {
    const announcements = storage.getActiveAnnouncements();
    return res.json({ announcements });
  });

  // Admin terminal command execution
  app.post('/api/admin/terminal', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { command } = req.body;
      if (!command || typeof command !== 'string') {
        return res.status(400).json({ error: 'Command is required' });
      }

      const result = storage.executeAdminCommand(req.userId, command.trim());
      return res.json(result);
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to execute command' });
    }
  });

  // Admin login as user (for backup purposes)
  app.post('/api/admin/login-as-user', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const user = storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent anyone from logging into protected accounts
      if (storage.isProtectedUser(userId)) {
        return res.status(403).json({ error: 'Cannot login to protected account' });
      }

      // Create new session for the target user
      const newSessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      storage.storage.sessions.set(newSessionId, userId);
      
      return res.json({ success: true, sessionId: newSessionId });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to login as user' });
    }
  });

  // Delete user account (admin only)
  app.post('/api/admin/delete-user', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { userId, transferToUserId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Prevent deletion of protected accounts
      if (storage.isProtectedUser(userId)) {
        return res.status(403).json({ error: 'Cannot delete protected account' });
      }

      const success = storage.deleteUserAccount(userId, transferToUserId);
      if (!success) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      return res.json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // PIN management endpoints
  app.post('/api/admin/verify-pin', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { pin } = req.body;
      if (!pin) {
        return res.status(400).json({ error: 'PIN is required' });
      }
      
      const isValid = storage.verifyAdminPin(req.userId, pin);
      return res.json({ success: isValid });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to verify PIN' });
    }
  });

  app.post('/api/admin/set-pin', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { pin } = req.body;
      if (!pin || pin.length < 4) {
        return res.status(400).json({ error: 'PIN must be at least 4 characters' });
      }
      
      const success = storage.setAdminPin(req.userId, pin);
      return res.json({ success });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to set PIN' });
    }
  });

  app.get('/api/admin/has-pin', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const hasPin = storage.getAdminPin(req.userId) !== undefined;
      return res.json({ hasPin });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to check PIN' });
    }
  });

  // Chat endpoints
  app.get('/api/chat/:room', async (req: any, res) => {
    const room = req.params.room as ChatRoom;
    
    if (!['global', 'mod', 'admin'].includes(room)) {
      return res.status(400).json({ error: 'Invalid chat room' });
    }
    
    // Check access for protected rooms
    if (room !== 'global') {
      const sessionId = req.headers['x-session-id'];
      const userId = sessionId ? storage.storage.sessions.get(sessionId) : undefined;
      
      if (!storage.canAccessChatRoom(userId, room)) {
        return res.status(403).json({ error: 'Access denied to this chat room' });
      }
    }
    
    const messages = storage.getChatMessages(room);
    return res.json({ messages });
  });

  app.post('/api/chat/:room', async (req: any, res) => {
    try {
      const room = req.params.room as ChatRoom;
      const validation = sendChatMessageSchema.safeParse({ 
        room, 
        message: req.body.message,
        imageUrl: req.body.imageUrl,
        linkUrl: req.body.linkUrl,
      });
      
      if (!validation.success) {
        return res.status(400).json({ error: 'Invalid message' });
      }
      
      const { message, imageUrl, linkUrl } = validation.data;
      const sessionId = req.headers['x-session-id'];
      const userId = sessionId ? storage.storage.sessions.get(sessionId) : undefined;
      
      // Check for /announce command (admin only)
      if (message.startsWith('/announce ') || message === '/announce') {
        if (!userId) {
          return res.status(401).json({ error: 'Must be logged in to use commands' });
        }
        
        const user = storage.getUser(userId);
        if (!user || user.role !== 'admin') {
          return res.status(403).json({ error: 'Only admins can use /announce' });
        }
        
        const announceMessage = message.substring('/announce '.length).trim();
        if (!announceMessage) {
          return res.status(400).json({ error: 'Announcement message cannot be empty. Usage: /announce <message>' });
        }
        
        const announcement = storage.createAnnouncement(userId, announceMessage);
        return res.json({ success: true, announcement, isCommand: true });
      }
      
      // Check access for protected rooms
      if (room !== 'global') {
        if (!storage.canAccessChatRoom(userId, room)) {
          return res.status(403).json({ error: 'Access denied to this chat room' });
        }
      }
      
      let username = 'Guest';
      let profilePicture: string | undefined;
      let userLevel = 1;
      let userBadge: string | undefined;
      let levelUpData = null;
      
      if (userId) {
        const user = storage.getUser(userId);
        if (user) {
          username = user.username;
          profilePicture = user.profilePicture;
          userLevel = user.level || 1;
          userBadge = user.badges[user.badges.length - 1];
          
          // Check link permissions
          if (linkUrl && !storage.canUserSendLinks(userId)) {
            return res.status(403).json({ error: 'You must be level 5 or higher to send links' });
          }
          
          // Check image permissions
          if (imageUrl && !storage.canUserSendImages(userId)) {
            return res.status(403).json({ error: 'You must be level 10 or higher to send images' });
          }
          
          // Check for suspicious links and auto-ban
          if (linkUrl && storage.isSuspiciousLink(linkUrl)) {
            storage.tempBanUser(userId, 7 * 24 * 60 * 60 * 1000); // 7 days
            return res.status(403).json({ error: 'Suspicious link detected. You have been banned for 7 days.' });
          }
          
          // Award XP
          let xpGain = 2; // Base chat message XP
          if (imageUrl) xpGain += 10;
          if (linkUrl) xpGain += 5;
          
          levelUpData = storage.addXP(userId, xpGain);
          
          // Update quest progress
          storage.updateQuestProgress(userId, 'daily_chat', 1);
          if (imageUrl || linkUrl) {
            storage.updateQuestProgress(userId, 'daily_share', 1);
          }
        }
      } else {
        // Guests cannot send links or images
        if (linkUrl || imageUrl) {
          return res.status(403).json({ error: 'You must be signed in to send links or images' });
        }
      }
      
      const chatMessage = storage.addChatMessage(room, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        room,
        userId,
        username,
        profilePicture,
        message,
        timestamp: new Date().toISOString(),
        imageUrl,
        linkUrl,
        level: userLevel,
        badge: userBadge,
      });
      
      return res.json({ success: true, message: chatMessage, levelUp: levelUpData });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to send message' });
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

      const aiClient = getAIClient();
      if (!aiClient) {
        return res.status(503).json({ error: 'AI service not configured. Please add your SambaNova API key to Secrets.' });
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

      // Use Meta-Llama-3.1-70B-Instruct or another SambaNova model
      const model = process.env.SAMBANOVA_API_KEY ? 'Meta-Llama-3.1-70B-Instruct' : 'gpt-5';
      
      const response = await aiClient.chat.completions.create({
        model,
        messages,
        max_tokens: 1024,
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
      let levelUpData = null;
      if (sessionId && storage.storage.sessions.has(sessionId)) {
        const userId = storage.storage.sessions.get(sessionId);
        if (userId) {
          storage.addToHistory(userId, {
            url: normalizedUrl,
            title: new URL(normalizedUrl).hostname,
            visitedAt: new Date().toISOString(),
            userId,
          });
          // Award XP for browsing
          levelUpData = storage.addXP(userId, 5);
          
          // Update quest progress
          storage.updateQuestProgress(userId, 'daily_search', 1);
          storage.updateQuestProgress(userId, 'daily_browse', 1);
        }
      }
      
      // Return empty content to trigger iframe proxy mode for full website browsing
      return res.json({
        success: true,
        url: normalizedUrl,
        title: new URL(normalizedUrl).hostname,
        content: '', // Empty content triggers iframe proxy mode
        isSearch: false,
        useProxy: true,
        levelUp: levelUpData,
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

  // ==================== FRIENDS API ====================

  app.get("/api/friends", requireAuth, (req: any, res) => {
    const friends = storage.getFriends(req.userId);
    return res.json({ friends });
  });

  app.get("/api/friend-requests", requireAuth, (req: any, res) => {
    const incoming = storage.getPendingFriendRequests(req.userId);
    const outgoing = storage.getSentFriendRequests(req.userId);
    return res.json({ incoming, outgoing });
  });

  app.post("/api/friend-requests", requireAuth, (req: any, res) => {
    const { addresseeId } = req.body;
    if (!addresseeId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }
    if (addresseeId === req.userId) {
      return res.status(400).json({ error: 'Cannot send friend request to yourself' });
    }
    
    const result = storage.sendFriendRequest(req.userId, addresseeId);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ request: result });
  });

  app.post("/api/friend-requests/:id/accept", requireAuth, (req: any, res) => {
    const result = storage.acceptFriendRequest(req.params.id, req.userId);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ request: result });
  });

  app.post("/api/friend-requests/:id/decline", requireAuth, (req: any, res) => {
    const success = storage.declineFriendRequest(req.params.id, req.userId);
    if (!success) {
      return res.status(400).json({ error: 'Request not found or not authorized' });
    }
    return res.json({ success: true });
  });

  app.post("/api/friends/:id/remove", requireAuth, (req: any, res) => {
    const success = storage.removeFriend(req.userId, req.params.id);
    if (!success) {
      return res.status(400).json({ error: 'Friend not found' });
    }
    return res.json({ success: true });
  });

  app.post("/api/users/:id/block", requireAuth, (req: any, res) => {
    const result = storage.blockUser(req.userId, req.params.id);
    return res.json({ blocked: result });
  });

  app.post("/api/users/:id/unblock", requireAuth, (req: any, res) => {
    const success = storage.unblockUser(req.userId, req.params.id);
    return res.json({ success });
  });

  // ==================== USER SETTINGS API ====================

  app.get("/api/settings/friends", requireAuth, (req: any, res) => {
    const settings = storage.getUserSettings(req.userId);
    return res.json({ settings });
  });

  app.patch("/api/settings/friends", requireAuth, (req: any, res) => {
    const { allowFriendRequests, messagePrivacy } = req.body;
    const updates: any = {};
    if (typeof allowFriendRequests === 'boolean') updates.allowFriendRequests = allowFriendRequests;
    if (messagePrivacy) updates.messagePrivacy = messagePrivacy;
    
    const settings = storage.updateUserSettings(req.userId, updates);
    return res.json({ settings });
  });

  // ==================== DM API ====================

  app.get("/api/dms/threads", requireAuth, (req: any, res) => {
    const threads = storage.getDMThreads(req.userId);
    return res.json({ threads });
  });

  app.post("/api/dms/start", requireAuth, (req: any, res) => {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ error: 'Target user ID required' });
    }
    
    const recipientSettings = storage.getUserSettings(targetUserId);
    if (recipientSettings.messagePrivacy === 'off') {
      return res.status(403).json({ error: 'User has disabled messages' });
    }
    if (recipientSettings.messagePrivacy === 'friends' && !storage.areFriends(req.userId, targetUserId)) {
      return res.status(403).json({ error: 'User only accepts messages from friends' });
    }
    
    const thread = storage.getOrCreateDMThread(req.userId, targetUserId);
    return res.json({ thread });
  });

  app.get("/api/dms/threads/:id/messages", requireAuth, (req: any, res) => {
    const messages = storage.getDMMessages(req.params.id, req.userId);
    return res.json({ messages });
  });

  app.post("/api/dms/threads/:id/messages", requireAuth, (req: any, res) => {
    const { message, imageUrl } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    const result = storage.sendDMMessage(req.params.id, req.userId, message, imageUrl);
    if (!result) {
      return res.status(403).json({ error: 'Cannot send message to this user' });
    }
    return res.json({ message: result });
  });

  // ==================== SERVERS API ====================

  app.get("/api/servers", requireAuth, (req: any, res) => {
    const servers = storage.getUserServers(req.userId);
    return res.json({ servers });
  });

  app.post("/api/servers", requireAuth, (req: any, res) => {
    const parseResult = createServerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid server data' });
    }
    
    const { name, description, icon, discoverable, tags } = parseResult.data;
    const server = storage.createServer(req.userId, name, description, icon, discoverable, tags);
    return res.json({ server });
  });

  app.get("/api/servers/discover", (req: any, res) => {
    const { search, tags } = req.query;
    const tagArray = tags ? (tags as string).split(',') : undefined;
    const servers = storage.getDiscoverableServers(search as string, tagArray);
    return res.json({ servers });
  });

  app.get("/api/servers/:id", requireAuth, (req: any, res) => {
    const server = storage.getServer(req.params.id);
    if (!server) {
      return res.status(404).json({ error: 'Server not found' });
    }
    const isMember = storage.isServerMember(req.params.id, req.userId);
    const isAdmin = storage.isServerAdmin(req.params.id, req.userId);
    return res.json({ server, isMember, isAdmin });
  });

  app.patch("/api/servers/:id", requireAuth, (req: any, res) => {
    const result = storage.updateServer(req.params.id, req.userId, req.body);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ server: result });
  });

  app.delete("/api/servers/:id", requireAuth, (req: any, res) => {
    const success = storage.deleteServer(req.params.id, req.userId);
    if (!success) {
      return res.status(403).json({ error: 'Not authorized or server not found' });
    }
    return res.json({ success: true });
  });

  app.post("/api/servers/:id/join", requireAuth, (req: any, res) => {
    const result = storage.joinServer(req.params.id, req.userId);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ member: result });
  });

  app.post("/api/servers/:id/leave", requireAuth, (req: any, res) => {
    const success = storage.leaveServer(req.params.id, req.userId);
    if (!success) {
      return res.status(400).json({ error: 'Cannot leave server (owner must delete)' });
    }
    return res.json({ success: true });
  });

  app.get("/api/servers/:id/members", requireAuth, (req: any, res) => {
    if (!storage.isServerMember(req.params.id, req.userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    const members = storage.getServerMembers(req.params.id);
    return res.json({ members });
  });

  // ==================== CHANNELS API ====================

  app.get("/api/servers/:id/channels", requireAuth, (req: any, res) => {
    if (!storage.isServerMember(req.params.id, req.userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    const channels = storage.getServerChannels(req.params.id);
    return res.json({ channels });
  });

  app.post("/api/servers/:id/channels", requireAuth, (req: any, res) => {
    const parseResult = createChannelSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid channel data' });
    }
    
    const { name, type, topic } = parseResult.data;
    const result = storage.createChannel(req.params.id, req.userId, name, type, topic);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ channel: result });
  });

  app.patch("/api/channels/:id", requireAuth, (req: any, res) => {
    const result = storage.updateChannel(req.params.id, req.userId, req.body);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ channel: result });
  });

  app.delete("/api/channels/:id", requireAuth, (req: any, res) => {
    const success = storage.deleteChannel(req.params.id, req.userId);
    if (!success) {
      return res.status(403).json({ error: 'Not authorized or channel not found' });
    }
    return res.json({ success: true });
  });

  app.get("/api/channels/:id/messages", requireAuth, (req: any, res) => {
    const messages = storage.getChannelMessages(req.params.id);
    return res.json({ messages });
  });

  app.post("/api/channels/:id/messages", requireAuth, (req: any, res) => {
    const parseResult = sendChannelMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Invalid message' });
    }
    
    const { message, imageUrl, quotedMessageId } = parseResult.data;
    const result = storage.sendChannelMessage(req.params.id, req.userId, message, imageUrl, quotedMessageId);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ message: result });
  });

  // ==================== BOTS API (STUBS) ====================

  app.get("/api/servers/:id/bots", requireAuth, (req: any, res) => {
    if (!storage.isServerMember(req.params.id, req.userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    const bots = storage.getServerBots(req.params.id);
    return res.json({ bots });
  });

  app.post("/api/servers/:id/bots", requireAuth, (req: any, res) => {
    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Bot name required' });
    }
    const result = storage.addBot(req.params.id, req.userId, name, description);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ bot: result });
  });

  app.delete("/api/bots/:id", requireAuth, (req: any, res) => {
    const success = storage.removeBot(req.params.id, req.userId);
    if (!success) {
      return res.status(403).json({ error: 'Not authorized or bot not found' });
    }
    return res.json({ success: true });
  });

  // ==================== SERVER BOOST API ====================

  app.post("/api/servers/:id/boost", requireAuth, (req: any, res) => {
    const { amount } = req.body;
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid boost amount' });
    }
    
    const result = storage.boostServer(req.params.id, req.userId, amount);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ boost: result });
  });

  app.get("/api/servers/:id/boosts", requireAuth, (req: any, res) => {
    const boosts = storage.getServerBoosts(req.params.id);
    return res.json({ boosts });
  });

  app.post("/api/servers/:id/use-boost", requireAuth, (req: any, res) => {
    const { feature, amount } = req.body;
    const result = storage.useServerBoost(req.params.id, req.userId, feature, amount);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ server: result });
  });

  // ==================== SERVER ROLES API ====================

  app.get("/api/servers/:id/roles", requireAuth, (req: any, res) => {
    if (!storage.isServerMember(req.params.id, req.userId)) {
      return res.status(403).json({ error: 'Not a member' });
    }
    const roles = storage.getServerRoles(req.params.id);
    return res.json({ roles });
  });

  app.post("/api/servers/:id/roles", requireAuth, (req: any, res) => {
    const { name, permissions, color } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Role name required' });
    }
    
    const result = storage.createServerRole(req.params.id, req.userId, name, permissions, color);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ role: result });
  });

  app.patch("/api/roles/:id", requireAuth, (req: any, res) => {
    const result = storage.updateServerRole(req.params.id, req.userId, req.body);
    if ('error' in result) {
      return res.status(400).json(result);
    }
    return res.json({ role: result });
  });

  app.delete("/api/roles/:id", requireAuth, (req: any, res) => {
    const success = storage.deleteServerRole(req.params.id, req.userId);
    if (!success) {
      return res.status(403).json({ error: 'Not authorized or role not found' });
    }
    return res.json({ success: true });
  });

  app.post("/api/members/:id/roles", requireAuth, (req: any, res) => {
    const { roleId } = req.body;
    const result = storage.assignRoleToMember(req.params.id, req.userId, roleId);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ member: result });
  });

  app.delete("/api/members/:id/roles/:roleId", requireAuth, (req: any, res) => {
    const result = storage.removeRoleFromMember(req.params.id, req.userId, req.params.roleId);
    if ('error' in result) {
      return res.status(403).json(result);
    }
    return res.json({ member: result });
  });

  // ==================== VOICE API (STUB) ====================

  app.post("/api/voice/:channelId/connect", requireAuth, (req: any, res) => {
    return res.status(501).json({ 
      error: 'Voice channels are not yet implemented',
      message: 'Voice functionality will be available in a future update'
    });
  });

  app.post("/api/voice/:channelId/disconnect", requireAuth, (req: any, res) => {
    return res.status(501).json({ 
      error: 'Voice channels are not yet implemented'
    });
  });

  // ==================== USER LOOKUP API ====================

  app.get("/api/users/search", requireAuth, (req: any, res) => {
    const { q } = req.query;
    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.json({ users: [] });
    }
    
    const allUsers = storage.getAllUsers();
    const matches = allUsers
      .filter(u => u.username.toLowerCase().includes(q.toLowerCase()) && u.id !== req.userId)
      .slice(0, 10)
      .map(u => ({
        id: u.id,
        username: u.username,
        profilePicture: u.profilePicture,
        level: u.level || 1,
      }));
    
    return res.json({ users: matches });
  });

  app.get("/api/users/:id/profile", requireAuth, (req: any, res) => {
    const user = storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const { password, ...userWithoutPassword } = user;
    const isFriend = storage.areFriends(req.userId, req.params.id);
    const isBlocked = storage.isBlocked(req.userId, req.params.id);
    
    return res.json({ 
      user: userWithoutPassword,
      isFriend,
      isBlocked,
    });
  });

  // ==================== BROWSER TABS API ====================

  app.get("/api/tabs", requireAuth, (req: any, res) => {
    const tabs = storage.getUserTabs(req.userId);
    return res.json({ tabs });
  });

  app.post("/api/tabs", requireAuth, (req: any, res) => {
    const { tabs } = req.body;
    if (!Array.isArray(tabs)) {
      return res.status(400).json({ error: 'Invalid tabs format' });
    }
    const userTabs = storage.saveUserTabs(req.userId, tabs);
    return res.json({ success: true, tabs: userTabs.tabs });
  });

  return httpServer;
}
