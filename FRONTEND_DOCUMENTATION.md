# Frontend Documentation - SuperTracker (Carrito IA)

## Overview

**SuperTracker** (also known as "Carrito IA") is a modern, AI-powered supermarket shopping assistant built with Next.js 16 and React 19. The application allows users to fill their shopping cart by simply describing their needs in natural language, simulating an intelligent shopping experience powered by artificial intelligence.

## Architecture

### Technology Stack

- **Framework**: Next.js 16.0.3 (App Router)
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4 with custom design system
- **Animations**: GSAP (GreenSock Animation Platform) for smooth, performant animations
- **Icons**: Lucide React
- **State Management**: React Hooks (useState, useEffect)
- **Backend Integration**: Convex (real-time database)
- **Type Safety**: TypeScript 5.9.3

### Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts and providers
│   ├── page.tsx             # Main page orchestrating the app flow
│   └── globals.css          # Global styles and design tokens
├── components/
│   ├── Hero.tsx             # Landing page with input form
│   ├── ChatInterface.tsx    # AI chat conversation UI
│   ├── CartSidebar.tsx      # Shopping cart display
│   ├── ConvexClientProvider.tsx  # Convex backend integration
│   ├── SmoothScroll.tsx     # Smooth scrolling wrapper
│   └── Footer.tsx           # Footer component
├── types/
│   └── index.ts             # TypeScript type definitions
└── utils/
    └── cartUtils.ts         # Cart building and formatting utilities
```

## User Flow

### 1. Initial State (Hero View)

When users first land on the application, they see the **Hero** component:

- **Animated Landing Page**: Features a large, centered hero section with:
  - Animated text entrance using GSAP
  - A floating 3D card preview (desktop only) that responds to mouse movement
  - Gradient background effects
  - Primary call-to-action input field

- **User Input**: Users can:
  - Type their shopping needs in natural language (e.g., "Quiero armar un asado para 6 personas")
  - Click on quick suggestion buttons ("Desayuno rápido", "Limpieza mensual", "Once con amigos")
  - Submit the form to trigger the AI shopping experience

- **Visual Feedback**: 
  - Input field pulses with a blue glow animation when submitted
  - Smooth transitions between states

### 2. Chat Interface (Conversation View)

After submitting the initial prompt, the app transitions to a **conversation view**:

- **Layout Change**: 
  - Hero section disappears
  - Full-screen chat interface appears
  - Cart sidebar becomes available (initially hidden)

- **Chat Features**:
  - **Message History**: Displays conversation between user and AI assistant
  - **Message Bubbles**: 
    - User messages appear on the right (white background)
    - AI messages appear on the left (white background with bot avatar)
  - **Typing Indicator**: Shows animated dots when AI is "thinking"
  - **Auto-scroll**: Automatically scrolls to latest message
  - **Input Field**: Allows users to continue the conversation

- **AI Simulation**:
  - After 2 seconds, AI responds acknowledging the request
  - AI message indicates products have been added to cart
  - Triggers cart generation and display

### 3. Cart Display

Once AI recommendations are ready:

- **Cart Sidebar**:
  - Slides in from the right (desktop: fixed sidebar, mobile: overlay)
  - Displays all selected products with:
    - Product images
    - Product names and categories
    - Individual prices
    - Total cart value
  - Animated entrance for each cart item (staggered GSAP animation)
  - Total price animates when updated

- **Cart Features**:
  - Product count badge
  - Estimated shipping (shown as "Gratis" - free)
  - Total price calculation
  - "Ir a pagar" (Go to checkout) button (demo only)
  - Mobile-friendly with overlay and close button

## Component Details

### Hero Component (`Hero.tsx`)

**Purpose**: Landing page that captures user intent

**Key Features**:
- **GSAP Animations**:
  - Text elements fade in with staggered timing
  - Floating card with 3D parallax effect (follows mouse movement)
  - Continuous floating animation (up/down motion)
  
- **Interactive Elements**:
  - Form submission with visual feedback
  - Quick suggestion buttons
  - Responsive design (mobile/desktop)

- **Visual Design**:
  - Gradient background blurs
  - 3D card preview showing mock shopping cart
  - Modern, clean aesthetic

### ChatInterface Component (`ChatInterface.tsx`)

**Purpose**: Manages the conversation between user and AI

**Key Features**:
- **Message Management**:
  - Stores message history in React state
  - Handles user input and AI responses
  - Manages typing states

- **UI Elements**:
  - User and bot avatars
  - Message bubbles with proper styling
  - Typing indicator with animated dots
  - Auto-scrolling message container

- **Simulation Logic**:
  - Initial AI response after 2-second delay
  - Follow-up responses after 1.5-second delay
  - Calls `onRecommendationsReady` callback when cart should be shown

### CartSidebar Component (`CartSidebar.tsx`)

**Purpose**: Displays the shopping cart with all selected items

**Key Features**:
- **Responsive Design**:
  - Desktop: Fixed sidebar (350-400px wide)
  - Mobile: Full-screen overlay with backdrop

- **Animations**:
  - Items fade in with stagger effect
  - Total price animates on change (scale + color)
  - Smooth slide-in/out transitions

- **Cart Display**:
  - Product list with images, names, categories
  - Individual prices
  - Total calculation
  - Empty state handling

### Main Page Component (`page.tsx`)

**Purpose**: Orchestrates the entire application flow

**State Management**:
- `prompt`: User's initial shopping request
- `cart`: Array of products in cart
- `isChatActive`: Controls view transition (Hero vs Chat)
- `showCart`: Controls cart sidebar visibility

**View Logic**:
- Conditionally renders Hero or Chat interface
- Manages cart sidebar visibility
- Handles responsive cart behavior (mobile overlay vs desktop sidebar)

## Design System

### Color Palette

The app uses a custom color system defined in `globals.css`:

- **Background**: `#F5F5F7` (light gray)
- **Elevated Background**: `#FFFFFF` (white)
- **Text Main**: `#020617` (near black)
- **Text Muted**: `#6B7280` (gray)
- **Accent Primary**: `#2563EB` (blue)
- **Accent Success**: `#22C55E` (green)
- **Accent Warning**: `#F97316` (orange)

### Typography

- **Primary Font**: Inter (sans-serif)
- **Monospace Font**: Roboto Mono
- Fonts loaded via Next.js Google Fonts optimization

### Animations

All animations use **GSAP** for smooth, performant transitions:

- **Entrance Animations**: Fade in with upward motion
- **Hover Effects**: Scale and shadow changes
- **Cart Animations**: Staggered item appearances
- **3D Effects**: Parallax and rotation based on mouse position

## Data Flow

### Product Data

- Products are stored in `src/data/lider_products.json`
- Type definitions in `src/types/index.ts`
- Cart building logic in `src/utils/cartUtils.ts`

### Cart Generation

The `buildMockCart()` function:
- Randomly selects 12-18 products from available inventory
- Creates `CartItem` objects with quantity = 1
- Returns array ready for display

**Note**: This is currently a mock implementation. In production, this would be replaced with actual AI logic that analyzes the user's prompt and selects appropriate products.

## Responsive Design

### Mobile (< 1024px)
- Hero: Single column layout
- Chat: Full-width interface
- Cart: Overlay with backdrop, slides in from right
- Touch-friendly button sizes

### Desktop (≥ 1024px)
- Hero: Two-column grid (content + floating card)
- Chat: Centered with max-width
- Cart: Fixed sidebar, always visible when active
- Hover effects and mouse interactions

## Backend Integration

### Convex Setup

The app is configured to work with **Convex** backend:

- `ConvexClientProvider` wraps the application
- Environment variable `NEXT_PUBLIC_CONVEX_URL` required
- Currently used for potential real-time features

**Note**: The current implementation uses mock data, but the infrastructure is in place for real backend integration.

## Key Features

1. **Natural Language Input**: Users describe shopping needs in plain Spanish
2. **AI Simulation**: Simulated AI assistant that "understands" requests
3. **Smart Cart Building**: Automatically generates relevant product selections
4. **Real-time Chat**: Interactive conversation interface
5. **Animated Transitions**: Smooth, polished user experience
6. **Responsive Design**: Works seamlessly on mobile and desktop
7. **Modern UI**: Clean, Apple-inspired design aesthetic

## Future Enhancements

Potential improvements for production:

1. **Real AI Integration**: Connect to actual AI service (OpenAI, etc.)
2. **Product Search**: Real-time product database queries
3. **Price Comparison**: Compare prices across multiple stores
4. **User Accounts**: Save shopping lists and preferences
5. **Checkout Flow**: Complete purchase integration
6. **Product Recommendations**: ML-based personalized suggestions
7. **Multi-language Support**: Expand beyond Spanish

## Development Notes

### Running the Application

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

### Environment Variables

Required:
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL

### Key Dependencies

- `gsap`: Animation library
- `lucide-react`: Icon library
- `clsx`: Conditional class names
- `convex`: Backend integration
- `tailwindcss`: Styling framework

## Summary

SuperTracker is a modern, interactive shopping assistant that demonstrates how AI can simplify the grocery shopping experience. Through natural language processing simulation, animated UI components, and a polished user interface, it provides users with an intuitive way to build their shopping cart by simply describing their needs.

The application showcases modern web development practices including:
- Component-based architecture
- Smooth animations and transitions
- Responsive design
- Type-safe development with TypeScript
- Clean, maintainable code structure

