# SchoolCord - Design Guidelines

## Design Approach
**Reference-Based: Space/Astronomy Applications** (Stellarium, NASA websites, space exploration interfaces) combined with modern browser UI patterns (Arc Browser, Brave) to create an immersive stellar browsing experience.

## Core Design Principles
1. **Cosmic Immersion**: Deep space aesthetic with dynamic starfield creates an otherworldly browsing environment
2. **Gradient Mastery**: Purple-to-crimson gradient transitions establish brand identity and spatial depth
3. **Functional Beauty**: Every UI element floats elegantly against the cosmic backdrop while maintaining usability

## Typography
- **Primary Font**: 'Space Grotesk' or 'Orbitron' (Google Fonts) for space-tech aesthetic
- **Hero Headline**: 3xl-5xl, bold weight, white with subtle glow/text-shadow for "Explore the Web Beyond the Stars"
- **App Title "SchoolCord"**: 2xl-3xl, prominent placement, crimson accent color
- **Body Text**: Base-lg, light weight, white/gray-100 for maximum contrast against dark background
- **Search Placeholder**: text-gray-400, subtle and elegant

## Layout System
**Spacing Units**: Tailwind scale of 2, 4, 6, 8, 12, 16 for consistent rhythm

### Homepage Layout
- **Full viewport height** (h-screen) with centered content
- **Sidebar**: Fixed left position, w-16-20, vertical icon stack with py-6 spacing between icons
- **Main Content**: Centered vertically and horizontally (flex items-center justify-center)
- **Search Box**: max-w-2xl, positioned below hero text with mt-8-12

### Browser Mode Layout
- **Header Bar**: Appears at top with back/forward/refresh controls and URL display
- **Content Area**: Full remaining viewport height for embedded web content
- **Sidebar**: Persistent across all views

## Visual Treatment

### Background System
1. **Base Layer**: Deep space gradient from purple (#4C1D95, #581C87) to crimson (#991B1B, #7F1D1D)
2. **Starfield Animation**: Hundreds of white dots (1-3px) with varying opacity (0.3-1.0) and subtle twinkling animation
3. **Depth Effect**: Optional larger star clusters for parallax depth

### Color Palette
- **Primary Crimson**: #DC2626, #B91C1C (buttons, accents, active states)
- **Purple Base**: #6B21A8, #581C87 (gradient start)
- **White/Light**: #FFFFFF, #F3F4F6 (text, icons)
- **Dark Overlays**: rgba(0,0,0,0.3-0.5) for glassmorphism effects

## Component Library

### Search Box (Hero Element)
- **Container**: Glassmorphism effect with backdrop-blur-lg, bg-white/10, border border-white/20
- **Input Field**: Large (h-14-16), rounded-full or rounded-2xl, px-6-8
- **Placeholder**: "Search with DuckDuckGo or Enter URL"
- **Icon**: Magnifying glass or star icon on left side, pl-4
- **Styling**: White text, crimson focus ring (ring-2 ring-crimson-500)

### Sidebar Navigation
- **Container**: Fixed left, h-full, bg-black/20 with backdrop-blur-sm
- **Icon Buttons**: Each 12x12 or 14x14, rounded-lg
- **Icons**: White with hover:text-crimson-500 transition
- **Stack Order**: Home → Search → Apps → Settings → History → Profile
- **Spacing**: space-y-4-6 between buttons
- **Active State**: bg-crimson-600/20 with border-l-2 border-crimson-500

### Browser Controls (Browser Mode)
- **Container**: Top bar with bg-black/30, backdrop-blur, px-6, py-3
- **Buttons**: Compact circular or rounded buttons with crimson accents
- **Controls**: Back (←), Forward (→), Refresh (↻), arranged horizontally with gap-2-3
- **URL Display**: Center-aligned, truncated with ellipsis, text-sm, text-gray-300

### Buttons (General)
- **Primary CTA**: bg-crimson-600, hover:bg-crimson-700, rounded-full, px-6-8, py-3-4, white text
- **Blurred Background Buttons**: backdrop-blur-md, bg-white/10, border border-white/30 when placed over images/backgrounds
- **Icon Buttons**: p-3, hover scale-110 transform, transition-all duration-200

## Animations

### Starfield Animation
- **Twinkle Effect**: Subtle opacity animation (0.3 → 1.0 → 0.3) on random stars, stagger timing
- **Slow Drift**: Optional very slow vertical/horizontal movement for depth

### Transition Effects
- **Search → Browser**: Fade transition (300-400ms) with search box morphing into URL bar
- **Sidebar Hover**: Scale and color transitions (200ms)
- **Page Load**: Subtle fade-in for embedded content

## Accessibility
- High contrast white text on dark backgrounds (WCAG AAA)
- Focus indicators with crimson ring (ring-2 ring-crimson-500)
- Keyboard navigation support for all sidebar buttons
- Alt text for all icons/images

## Images
**No large hero image needed** - the animated starfield background IS the hero visual element. The design relies on the gradient + starfield for visual impact rather than photographic imagery.

## Interaction States
- **Hover**: Icons glow with crimson tint, scale 110%, smooth 200ms transition
- **Active/Focus**: Crimson accents, subtle glow effects
- **Loading**: Crimson-colored loading spinner when fetching web content