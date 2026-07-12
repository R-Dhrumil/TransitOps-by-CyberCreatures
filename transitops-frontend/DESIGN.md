---
name: Deep Sea Professional
colors:
  surface: '#131314'
  surface-dim: '#131314'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1c'
  surface-container: '#201f20'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353535'
  on-surface: '#e5e2e2'
  on-surface-variant: '#c5c6cb'
  inverse-surface: '#e5e2e2'
  inverse-on-surface: '#313031'
  outline: '#8f9195'
  outline-variant: '#44474a'
  surface-tint: '#c2c7ce'
  primary: '#c2c7ce'
  on-primary: '#2c3136'
  primary-container: '#0b1015'
  on-primary-container: '#787c83'
  inverse-primary: '#5a5f65'
  secondary: '#c0c7d1'
  on-secondary: '#2a3139'
  secondary-container: '#434a52'
  on-secondary-container: '#b2b9c3'
  tertiary: '#bcc7de'
  on-tertiary: '#263143'
  tertiary-container: '#051021'
  on-tertiary-container: '#717c92'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dee3ea'
  primary-fixed-dim: '#c2c7ce'
  on-primary-fixed: '#171c21'
  on-primary-fixed-variant: '#42474d'
  secondary-fixed: '#dce3ed'
  secondary-fixed-dim: '#c0c7d1'
  on-secondary-fixed: '#151c23'
  on-secondary-fixed-variant: '#40474f'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#131314'
  on-background: '#e5e2e2'
  surface-variant: '#353535'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  data-mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  element-gap: 8px
---

## Brand & Style

The design system pivots from a conceptual "sketch" aesthetic to a high-fidelity, mission-critical operational interface. The brand personality is authoritative, precise, and nocturnal, designed specifically for high-density desktop environments like logistics hubs or dispatch centers. 

The style is **Corporate / Modern** with a lean toward **Minimalism**, utilizing dark-mode depth to reduce eye strain during long shifts. It evokes the feeling of a sophisticated radar or deep-sea sonar system—utilizing high-contrast accents against a vast, dark abyss to highlight essential data points. The UI prioritizes information density and clear status indicators over decorative elements.

## Colors

The palette is anchored in a "Deep Sea" spectrum. 
- **Surfaces**: The primary background (`#0B1015`) provides a near-black canvas, while the secondary surface (`#141B22`) defines cards and containers.
- **Accents**: Functional signaling is paramount. **Emerald** signifies operational availability, **Azure** denotes active transit/en route status, and **Amber** indicates maintenance or "In Shop" states.
- **Typography**: High-purity white is used for primary data to ensure maximum legibility against the dark background, while muted slate tones handle secondary metadata.

## Typography

This design system uses a tripartite typographic strategy:
1. **Hanken Grotesk** for headlines: Provides a sharp, contemporary professional feel.
2. **Geist** for body text: Offers exceptional clarity and a technical "developer-friendly" precision for operational descriptions.
3. **JetBrains Mono** for data and labels: Used for coordinates, timestamps, and status labels to ensure characters remain distinct and vertically aligned in dense tables.

All labels should use the `label-caps` style for structural headers within cards.

## Layout & Spacing

The layout follows a **Fluid Grid** logic optimized for 24-inch and larger desktop monitors. 
- **Rhythm**: A strict 4px base unit ensures mathematical alignment.
- **Grid**: A 12-column system is used for dashboard layouts.
- **Density**: Use "Compact" spacing for data-heavy views (8px padding in tables) and "Standard" spacing (16px) for configuration panels. 
- **Margins**: A fixed 24px safe area is maintained at the screen edges to prevent UI elements from feeling crowded against the bezel.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** rather than heavy shadows.
- **Level 0 (Base)**: `#0B1015` for the global background.
- **Level 1 (Cards/Panels)**: `#141B22` with a subtle 1px border of `#1E293B`.
- **Level 2 (Popovers/Modals)**: `#1E293B` with a refined ambient shadow (0px 8px 24px rgba(0,0,0,0.5)).

Avoid blurring or glassmorphism to maintain the sharp, "instrument-panel" clarity required for operational software. Use high-contrast outlines for active states.

## Shapes

The shape language is **Soft** but leans towards precision. A subtle 4px (`0.25rem`) corner radius is applied to buttons and input fields to maintain a professional, engineered look. Larger containers (cards) use the `rounded-lg` (8px) setting. Circular shapes are reserved strictly for status pips and user avatars to create a clear visual distinction between functional UI and status indicators.

## Components

- **Buttons**: Primary buttons use a solid `#FFFFFF` background with black text for maximum impact. Secondary buttons use an outline style with `#1E293B` borders.
- **Status Chips**: Use the functional colors (Emerald, Azure, Amber) as a 1px border and a subtle 10% opacity fill of the same color. Text within chips uses the `label-caps` typography.
- **Data Tables**: Remove all vertical lines. Use horizontal dividers in `#1E293B`. The header row uses `label-caps` in `#94A3B8`.
- **Input Fields**: Ghost-style inputs with `#1E293B` borders. On focus, the border transitions to `#3B82F6` (Azure).
- **Fleet Cards**: These should feature a prominent status pip in the top-right corner using the functional accent colors, with the ID of the asset set in `data-mono`.
- **Navigation**: A collapsed left-hand sidebar using high-contrast icons and subtle tooltips for maximum screen real estate.