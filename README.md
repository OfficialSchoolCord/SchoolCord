# Schoolcord

A powerful web browser and proxy application designed to bypass network restrictions at schools, workplaces, and other restricted environments.

## Features

### Web Proxy
- **Bypass Restrictions** - Access blocked websites at school, work, or any restricted network
- **Stealth Browsing** - Advanced anti-detection technology for sites like TikTok, Instagram, Facebook, and Twitter
- **URL Encoding** - All URLs are encoded to avoid detection by network filters
- **Ad Block Bypass** - Built-in scripts to bypass ad blocker detection on websites

### Built-in Apps
- Quick access to popular sites including:
  - Google
  - YouTube
  - TikTok
  - Discord
  - Spotify
  - Netflix
  - And many more

### AI Assistant
- Integrated AI chat powered by SambaNova
- Get help, ask questions, and have conversations

### Chat System
- Create and join chat servers
- Real-time messaging with other users
- Channel-based communication (similar to Discord)

### User System
- Account registration and login
- Customizable profiles with avatars
- Admin and moderator roles

## How It Works

The proxy works by:
1. Encoding the target URL
2. Fetching the content through our server
3. Rewriting all links and assets to go through the proxy
4. Injecting anti-detection scripts to avoid blocks

For heavily protected sites (TikTok, Instagram, etc.), we use Puppeteer with stealth plugins to emulate a real browser.

## Tech Stack

- **Frontend:** React, Vite, TailwindCSS, shadcn/ui
- **Backend:** Node.js, Express
- **Browser Automation:** Puppeteer with Stealth Plugin
- **Database:** PostgreSQL (optional, works with in-memory storage)

## Environment Variables

```
SAMBANOVA_API_KEY=your_api_key_here
SESSION_SECRET=your_random_secret_here
NODE_ENV=production
PORT=5000
```

## Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/schoolcord.git

# Navigate to the directory
cd schoolcord

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Deployment

This app can be deployed on:
- Render.com
- Railway.app
- Fly.io
- Any Node.js hosting platform

**Note:** Puppeteer requires a hosting platform that supports headless browsers.

## Legal Disclaimer

This tool is provided for educational purposes only. Users are responsible for complying with their network's acceptable use policies. The developers are not responsible for any misuse of this software.

---

## LICENSE & COPYRIGHT

**© 2024 Schoolcord. All Rights Reserved.**

This code is proprietary and protected by copyright law.

### Terms of Use:

1. **NO UNAUTHORIZED COPYING** - You may NOT copy, reproduce, distribute, or use this code without explicit written permission from the original author.

2. **ATTRIBUTION REQUIRED** - If you have been granted permission to use any part of this code, you MUST provide clear and visible credit to the original author.

3. **NO COMMERCIAL USE** - This code may NOT be used for commercial purposes without a separate licensing agreement.

4. **NO MODIFICATIONS** - You may NOT modify, adapt, or create derivative works without permission.

### Legal Action Warning:

**STEALING THIS CODE WITHOUT PROPER CREDIT OR PERMISSION WILL RESULT IN LEGAL ACTION.**

Violations of these terms may result in:
- DMCA takedown notices
- Copyright infringement lawsuits
- Monetary damages

If you wish to use this code, please contact the author for permission.

---

Made with determination to access the internet freely.
