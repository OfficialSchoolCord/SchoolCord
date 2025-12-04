# Illing Star - Cloud Browser

## Overview

Illing Star is a cloud-based web browser application with a space-themed aesthetic. The application allows users to search the web using DuckDuckGo or navigate directly to URLs through a proxy browsing service. It features an immersive cosmic UI with a purple-to-crimson gradient theme, animated starfield background, and a persistent sidebar navigation system.

The project is a full-stack TypeScript application using React on the frontend and Express on the backend, with server-side web scraping capabilities to fetch and display external web content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript using Vite as the build tool

**UI Component System**: shadcn/ui components built on Radix UI primitives with custom space-themed styling

**State Management**: 
- React hooks for local component state
- TanStack Query (React Query) for server state and data fetching
- No global state management library - state is managed locally within the main `Home` component and passed down through props

**Routing**: Wouter for lightweight client-side routing

**Design System**:
- Tailwind CSS for utility-first styling
- Custom CSS variables for space theme with purple (#4C1D95, #581C87) to crimson (#DC2626, #B91C1B) gradients
- Space Grotesk and Orbitron fonts for space-tech aesthetic
- Glassmorphism effects (backdrop-blur, semi-transparent backgrounds)
- Animated starfield background component

**Key UI Components**:
- `Sidebar`: Fixed navigation with icon-based menu items
- `HomePage`: Landing page with hero search box
- `BrowserView`: Displays fetched web content with navigation controls
- `SearchBox`: Unified search/URL input component
- `Starfield`: Animated cosmic background with twinkling stars
- Panel components for Apps, History, Settings, and Profile

### Backend Architecture

**Framework**: Express.js with TypeScript

**Build System**: esbuild for server bundling, Vite for client bundling

**API Structure**:
- Single `/api/browse` POST endpoint for fetching web content
- Validates requests using Zod schemas
- Distinguishes between search queries and direct URLs
- For search queries: redirects to DuckDuckGo search results
- For URLs: fetches content via axios and parses with Cheerio

**Web Scraping**:
- Uses axios for HTTP requests to external sites
- Cheerio for HTML parsing and content extraction
- Extracts page title and body content
- Basic error handling for failed requests

**Development Server**:
- Custom Vite middleware integration for HMR (Hot Module Reload)
- Request logging with timestamp and duration tracking
- Serves static files in production from dist/public

**Data Storage**:
- Currently uses in-memory storage (`MemStorage` class)
- Designed with interface (`IStorage`) to allow swapping to database implementation
- User schema defined but not actively used in current implementation

### External Dependencies

**Database**: 
- Drizzle ORM configured for PostgreSQL via `@neondatabase/serverless`
- Schema defined in `shared/schema.ts` but database not currently active
- Migration setup via drizzle-kit pointing to Neon Database

**Third-Party Services**:
- DuckDuckGo for search functionality (redirects to their search results)
- Google Fonts for Space Grotesk, Space Mono, and Orbitron typefaces

**Key NPM Packages**:
- Frontend: React, React DOM, TanStack Query, Wouter, Radix UI components, Tailwind CSS
- Backend: Express, Axios, Cheerio for web scraping
- Shared: Zod for schema validation
- Development: TypeScript, Vite, esbuild, tsx

**Design Rationale**:
The application uses a proxy browsing approach where the backend fetches external web content and passes it to the frontend. This avoids CORS issues and allows for potential content filtering/modification. The space theme creates a distinctive brand identity while maintaining usability through high-contrast text and clear UI patterns.