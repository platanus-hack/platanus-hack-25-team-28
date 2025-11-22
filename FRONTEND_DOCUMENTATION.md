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
│   ├── page.tsx            # Main page orchestrating the flow (Search -> Results -> Cart)
│   └── globals.css         # Global styles and design tokens
├── components/
│   ├── Hero.tsx            # Landing page with input form
│   ├── CartSidebar.tsx     # The "Sticky" Cart Sidebar
│   ├── SmartShoppingGrid.tsx # Results grid with "fly-to-cart" animation logic
│   ├── ConvexClientProvider.tsx  # Convex backend integration
│   ├── SmoothScroll.tsx    # Smooth scrolling wrapper
│   └── Footer.tsx          # Footer component
├── types/
│   └── index.ts            # TypeScript type definitions
└── utils/
    └── cartUtils.ts        # Cart building and formatting utilities
```

## User Flow (Updated)

### 1. Initial State (Hero View)

When users first land on the application, they see the **Hero** component:

- **Visuals**: Animated text, floating 3D card preview, gradient backgrounds.
- **Input**: Users type a natural language prompt (e.g., "Asado para 6 personas").
- **Action**: Upon clicking "Llenar carro", the button transforms into a loading state ("Pensando...") to simulate AI processing.

### 2. Results & Animation Sequence

After a simulated delay (approx 2s), the application transitions to the results view without changing routes:

- **Auto-Scroll**: The page automatically scrolls down to snap the `#results-section` to the very top of the viewport.
- **Smart Grid**: A grid of AI-selected products (`SmartShoppingGrid`) appears on the left.
- **Sticky Sidebar**: The Cart Sidebar (`CartSidebar`) appears as a fixed/sticky column on the right, initially empty.
- **Fly-to-Cart Animation**:
  - Products in the grid animate ("fly") one by one into the open cart.
  - **Morphing Effect**: The flying element visually clones the card, moves to the exact calculated screen coordinates of the target cart slot, and morphs (resizes) to match the cart item dimensions.
  - **Populate**: As the item "lands", it is added to the actual cart state, appearing in the list.

### 3. Cart Interaction

- **Desktop**: The cart sidebar remains sticky on the right as the user scrolls through the results.
- **Mobile**: The cart is accessible via a floating trigger or drawer overlay, though the fly animation is optimized for the desktop layout.
- **Features**:
  - Live total calculation.
  - "Gratis" shipping badge.
  - Item count.

## Component Details

### SmartShoppingGrid (`SmartShoppingGrid.tsx`)

**Purpose**: Displays the grid of products and orchestrates the complex entry animations.

**Key Logic**:

- **GSAP Timeline**: Creates a sequenced timeline for staggering product entry.
- **Coordinate Calculation**: Uses the `CartSidebarRef` API to ask the sidebar "Where should the Nth item land?".
- **Robustness**: Includes fallback logic. If the destination coordinates are invalid (e.g., hidden sidebar), items are added immediately without animation to ensure functionality.
- **Ref Safety**: Waits for the sidebar to be fully mounted and ready before starting the flight sequence.

### CartSidebar (`CartSidebar.tsx`)

**Purpose**: Displays the list of added items and provides coordinate data for animations.

**Key Logic**:

- **Imperative Handle (`useImperativeHandle`)**: Exposes a `getDestinationRect(index)` method.
- **Position Estimation**: If an item hasn't been rendered yet (because it's about to be added), the component calculates where it _will_ be based on current list height and item dimensions.

### Main Page (`page.tsx`)

**Purpose**: Orchestrates the state and layout.

**State**:

- `isLoading`: Controls the Hero button state.
- `showResults`: Toggles the rendering of the results section.
- `allProducts`: The full list of "AI-generated" results.
- `cartItems`: The actual items currently in the cart (grows one by one during animation).
- `isSidebarReady`: Flag to ensure animations don't start until the UI is stable.

## Design System

### Color Palette

- **Background**: `#F5F5F7`
- **Text**: `#020617`
- **Accent**: `#2563EB` (Blue)
- **Success**: `#22C55E` (Green)

### Animations

- **GSAP**: Used extensively for:
  - ScrollTo (auto-scroll behavior).
  - Morphing (Fly-to-cart).
  - Staggered entrances.

## Development Notes

### Running the Application

```bash
pnpm install
pnpm dev
```

### Key Dependencies

- `gsap`: Critical for the complex flight paths and morphing effects.
- `lucide-react`: Icons.
- `clsx`: Class name utilities.

## Summary

The updated frontend features a highly immersive, single-page experience. By replacing standard page transitions with auto-scrolling and "literal" animations (where products physically travel to the cart), the application provides immediate visual feedback and a sense of magic to the "AI Shopping" concept.
