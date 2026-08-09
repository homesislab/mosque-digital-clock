# 🎨 Mosque Digital Clock - Design System & UI/UX Guidelines

**Version:** 2.0  
**Last Updated:** August 9, 2026  
**Status:** Living document — normative for new UI and incremental refactoring

---

## 📋 Design System Overview

This document establishes the visual and interaction guidelines for the Mosque Digital Clock application to ensure consistency across the admin dashboard and public kiosk display.

### Scope and precedence

- **Admin dashboard:** data entry, configuration, monitoring, and device management.
- **Kiosk/TV display:** glanceable information viewed from a distance, prayer-state overlays, media, and offline operation.
- Existing screens may contain legacy styles. New work **MUST** follow this document; touched legacy UI **SHOULD** be migrated incrementally.
- Design tokens are preferred over literal colors, arbitrary radii, and undocumented z-index values.
- Accessibility and legibility take precedence over decorative effects.

### Requirement language

- **MUST:** required for acceptance.
- **SHOULD:** expected unless there is a documented reason not to follow it.
- **MAY:** optional enhancement.

---

## 🎯 Design Principles

1. **Khidmat & Modern** - Respectful Islamic aesthetics with contemporary design
2. **Accessibility First** - Ensure all features work for diverse users (elderly, children, disabilities)
3. **Information Clarity** - Prayer times and important info must be immediately clear
4. **User Trust** - Transparent operations, no surprises
5. **Performance** - Fast, responsive, works on slow connections

---

## 🌈 Color Palette

### Primary Colors
```
Brand Green:     #10b981 (Emerald-500)  - Islamic, Quranic
Deep Navy:       #1e293b (Slate-900)    - Serious, professional
White:           #ffffff               - Clean, spiritual

Usage:
- Brand Green: CTAs, prayer times, positive actions
- Deep Navy: Headers, borders, serious content
- White: Backgrounds, text on dark
```

### Secondary Colors
```
Warning Orange:   #f97316 (Orange-500)  - Alerts, Iqamah
Error Red:        #ef4444 (Red-500)     - Errors, critical
Success Green:    #22c55e (Green-500)   - Success states
Neutral Gray:     #64748b (Slate-500)   - Supporting text
```

### Backgrounds
```
Light Mode:
- Primary BG:     #ffffff
- Secondary BG:   #f8fafc (Slate-50)
- Elevated:       #f1f5f9 (Slate-100)

Dark Mode:
- Primary BG:     #0f172a (Slate-950)
- Secondary BG:   #1e293b (Slate-900)
- Elevated:       #334155 (Slate-700)

Islamic Gradient (for headers):
- Linear: from-blue-600 to-emerald-600
- Or: from-emerald-600 to-teal-600
```

### Accessibility Contrast Rules

Do not rely on remembered ratios; verify the exact foreground/background pair with a contrast checker.

```text
WCAG 2.2 AA minimum:
- Normal text:             4.5:1
- Large text:              3:1 (≥24px regular or ≥18.66px bold)
- UI controls and icons:   3:1 against adjacent colors
- Disabled/decorative UI:  exempt, but must remain understandable
```

Rules:

- `emerald-600` on white is suitable for emphasized text; lighter emerald shades are backgrounds, not body text.
- `slate-500` on white is only for non-essential secondary copy after verification; prefer `slate-600` for important help text.
- Text over images MUST use a scrim/overlay and be tested against the brightest and darkest image regions.
- Never communicate success, warning, error, connectivity, or prayer state by color alone; pair color with text and/or icon.

---

## 📝 Typography

### Font Stack
```typescript
// Headings (from Poppins / Inter)
font-family: 'Inter', system-ui, -apple-system, sans-serif;

// Body text
font-family: 'Inter', system-ui, -apple-system, sans-serif;

// Monospace (for times/numbers)
font-family: 'IBM Plex Mono', 'Courier New', monospace;
font-size: 14px for displays
font-size: 12px for secondary times
```

### Font Sizes
```
Display XL:   48px (Arabic text, main prayer time)
Display LG:   40px (Prayer names in slider)
Display MD:   32px (Section headers)
Display SM:   28px (Card titles)

Heading 1:    24px (Page titles)
Heading 2:    20px (Section titles)
Heading 3:    18px (Card headers)

Body Large:   16px (Main body text)
Body:         14px (Regular text)
Body Small:   12px (Secondary text, timestamps)
Caption:      11px (Very small info)
```

### Font Weights
```
Light:   300 (Rarely used, low emphasis)
Regular: 400 (Default body text)
Medium:  500 (Slightly emphasized)
SemiBold:600 (Subheadings, important text)
Bold:    700 (Headers, CTAs)
Black:   900 (Main headlines only)
```

### Example Usage
```jsx
// Prayer times display
<h2 className="text-4xl font-black tracking-tight">Subuh</h2>
<p className="text-5xl font-mono font-bold">04:32</p>

// Card header
<h3 className="text-xl font-semibold text-emerald-600">Jadwal Sholat</h3>

// Secondary info
<p className="text-sm text-gray-500">Updated 2 minutes ago</p>
```

---

## 📦 Spacing System

### Scale (4px primitive, 8px preferred rhythm)
```
scale-0:  0px    (no space)
scale-0.5: 4px   (micro)
scale-1:  8px    (xs)
scale-2:  16px   (sm)
scale-3:  24px   (md)
scale-4:  32px   (lg)
scale-5:  40px   (xl)
scale-6:  48px   (2xl)
scale-8:  64px   (3xl)
scale-10: 80px   (4xl)
```

### Usage Guidelines
```
Padding:
- Containers:     24px (scale-3)
- Cards:          16px (scale-2)
- Buttons:        12px h, 16px w (scale-2)
- Input fields:   10px (scale-1.5)

Gaps (flex/grid):
- Component gap:  16px (scale-2)
- Grid gap:       24px (scale-3)
- Card spacing:   32px (scale-4)

Margins:
- Section margin:  32px (scale-4)
- Element margin:  16px (scale-2)
- Text margin:     8px (scale-1)
```

### Implementation
```jsx
// Component padding
<div className="p-6">      {/* 24px = scale-3 */}

// Component gap
<div className="flex gap-4">{/* 16px = scale-2 */}

// Grid spacing
<div className="grid gap-6">{/* 24px = scale-3 */}
```

---

## 🔘 Component Guidelines

### Buttons

#### Primary Button (Main Action)
```jsx
<button className="px-6 py-2 bg-emerald-600 text-white rounded-lg 
                   hover:bg-emerald-700 transition-colors font-medium
                   focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2">
  Simpan Konfigurasi
</button>
```

**Specs:**
- Background: Emerald-600
- Hover: Emerald-700
- Padding: 12px vertical, 24px horizontal
- Border radius: 8px
- Font: Medium (600)
- Focus: 2px emerald ring + 2px offset

#### Secondary Button (Alternative Action)
```jsx
<button className="px-6 py-2 border-2 border-slate-300 text-slate-700 
                   rounded-lg hover:bg-slate-50 transition-colors font-medium
                   focus:ring-2 focus:ring-slate-400">
  Batal
</button>
```

#### Destructive Button (Delete/Dangerous)
```jsx
<button className="px-6 py-2 bg-red-600 text-white rounded-lg 
                   hover:bg-red-700 transition-colors font-medium
                   focus:ring-2 focus:ring-red-500">
  Hapus
</button>
```

#### Icon Button (Compact)
```jsx
<button className="p-2 rounded-full hover:bg-slate-100 
                   transition-colors text-slate-700"
        aria-label="Close menu">
  <XIcon size={20} />
</button>
```

---

### Cards

#### Standard Card
```jsx
<div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm 
                hover:shadow-md transition-shadow">
  <h3 className="text-lg font-bold text-slate-900 mb-3">Card Title</h3>
  <p className="text-slate-600">Content goes here...</p>
</div>
```

**Specs:**
- Background: White
- Border: 1px slate-200
- Border radius: 16px
- Padding: 24px
- Shadow: Small on default, medium on hover
- Shadow color: rgba(0,0,0,0.05)

#### Highlighted Card (Featured)
```jsx
<div className="bg-gradient-to-r from-emerald-50 to-teal-50 
                rounded-2xl border-2 border-emerald-200 p-6">
  <div className="flex items-start gap-3">
    <div className="p-3 bg-emerald-100 rounded-lg">
      <CheckCircle className="text-emerald-600" size={24} />
    </div>
    <div>
      <h3 className="font-bold text-emerald-900">Sukses</h3>
      <p className="text-emerald-700 text-sm">Konfigurasi tersimpan</p>
    </div>
  </div>
</div>
```

---

### Input Fields

#### Text Input
```jsx
<input 
  type="text"
  placeholder="Masukkan nama masjid"
  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg
             focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100
             transition-all outline-none text-slate-900"
/>
```

**Specs:**
- Height: 40px (py-2.5)
- Padding: 16px (px-4)
- Border: 1px slate-300
- Focus: Green ring + green border
- Radius: 8px

#### With Error State
```jsx
<div>
  <label className="block text-sm font-medium text-slate-700 mb-2">
    YouTube URL
  </label>
  <input 
    type="text"
    className="w-full px-4 py-2.5 border-2 border-red-500 rounded-lg
               bg-red-50 text-red-900"
  />
  <p className="text-sm text-red-600 mt-1">Invalid YouTube URL</p>
</div>
```

---

### Forms

#### Label + Input Group
```jsx
<div className="space-y-2">
  <label htmlFor="mosque-name" className="block text-sm font-semibold 
                                       text-slate-700">
    Nama Masjid *
  </label>
  <input 
    id="mosque-name"
    type="text"
    required
    aria-required="true"
    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg..."
  />
  <p className="text-xs text-slate-500">Nama masjid akan tampil di perangkat</p>
</div>
```

#### Checkbox
```jsx
<label className="flex items-center gap-3 cursor-pointer">
  <input 
    type="checkbox"
    className="w-4 h-4 border border-slate-300 rounded text-emerald-600
               focus:ring-2 focus:ring-emerald-500"
  />
  <span className="text-sm text-slate-700">
    Tampilkan live stream di slideshow
  </span>
</label>
```

#### Toggle Switch
```jsx
<div className="flex items-center justify-between">
  <span className="text-sm font-medium text-slate-700">Enable Stream</span>
  <button
    onClick={() => setEnabled(!enabled)}
    className={`w-12 h-6 rounded-full transition-colors relative
                ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
    role="switch"
    aria-checked={enabled}
    aria-label="Enable live stream"
  >
    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full 
                    transition-transform
                    ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
</div>
```

---

### Alerts & Notifications

#### Info Alert
```jsx
<div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
  <div className="flex gap-3">
    <InfoIcon className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
    <div>
      <h4 className="font-semibold text-blue-900">Informasi</h4>
      <p className="text-blue-700 text-sm mt-1">Internet harus aktif untuk live stream</p>
    </div>
  </div>
</div>
```

#### Warning Alert
```jsx
<div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
  <div className="flex gap-3">
    <AlertTriangle className="text-yellow-600 flex-shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-yellow-900">Peringatan</h4>
      <p className="text-yellow-700 text-sm">Durasi stream kurang dari 2 menit</p>
    </div>
  </div>
</div>
```

#### Success Alert
```jsx
<div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
  <div className="flex gap-3">
    <CheckCircle className="text-green-600 flex-shrink-0" size={20} />
    <div>
      <h4 className="font-semibold text-green-900">Sukses</h4>
      <p className="text-green-700 text-sm">Konfigurasi tersimpan</p>
    </div>
  </div>
</div>
```

---

## 📱 Breakpoints & Responsive Design

### Tailwind Breakpoints
```
xs:  0px    (Mobile)
sm:  640px  (Mobile landscape)
md:  768px  (Tablet)
lg:  1024px (Desktop)
xl:  1280px (Large desktop)
2xl: 1536px (Extra large)
```

### Mobile-First Approach
```jsx
// Default for mobile, override for larger screens
<div className="text-base sm:text-lg md:text-2xl lg:text-4xl">
  {/* Grows on larger screens */}
</div>

// Grid example
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* 1 column on mobile, 2 on tablet, 4 on desktop */}
</div>
```

### Desktop Admin vs Mobile TV Display

**Admin Dashboard (Desktop-first):**
- Sidebar navigation
- Multi-column layouts
- Detailed forms
- Rich data tables

**TV Display (Mobile-responsive):**
- Full-screen prayer times
- Larger fonts
- Landscape orientation
- Touch-friendly (if touchscreen)

---

## 🎬 Animations & Transitions

### Smooth Transitions
```jsx
// State changes
className="transition-all duration-300 ease-in-out"

// Color changes
className="transition-colors duration-200"

// Opacity fades
className="transition-opacity duration-150"

// All properties
className="transition-all duration-500"
```

### Motion Preferences
```jsx
// Respect user's motion preferences
className="motion-safe:transition-all motion-reduce:transition-none"

// Heavy animations should have disable option
{shouldAnimateSlides && (
  <motion.div animate={{ opacity: 1 }} />
)}
```

### Prayer Time Highlight Animation
```jsx
// Active prayer pulses gently
<div className="animate-pulse">
  <h3 className="text-emerald-600">Dzuhur</h3>
</div>

// Slide transitions
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  exit={{ opacity: 0, scale: 1.05 }}
  transition={{ duration: 0.8 }}
>
  {/* Content */}
</motion.div>
```

---

## 🌙 Dark Mode Support

### Implementation
```jsx
// Use Tailwind dark: prefix
className="bg-white dark:bg-slate-950 text-slate-900 dark:text-white"

// Media query approach
@media (prefers-color-scheme: dark) {
  // Dark mode styles
}
```

### Dark Mode Color Mapping
```
Light Mode  →  Dark Mode
---
White       →  Slate-950
Slate-50    →  Slate-900
Slate-100   →  Slate-800
Slate-200   →  Slate-700
Text Black  →  Text White
Text Gray   →  Text Gray-200
```

---

## ♿ Accessibility Features

### ARIA Labels
```jsx
// All interactive elements need labels
<button aria-label="Toggle live stream">
  <VideoIcon />
</button>

// Regions need roles
<div role="region" aria-label="Prayer times section">
  {/* Content */}
</div>

// Live updates
<div aria-live="polite" aria-label="Current prayer time">
  {currentTime}
</div>
```

### Keyboard Navigation
```jsx
// Tab order should be logical
<form>
  <input type="text" />           {/* Tab 1 */}
  <button>Submit</button>         {/* Tab 2 */}
</form>

// Skip to main content link
<a href="#main" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
```

### Screen Reader Considerations
```jsx
// Hide decorative icons
<Icon aria-hidden="true" />

// Descriptive button text
<button>Delete Prayer Time</button>  {/* Good */}
<button>❌</button>                  {/* Bad */}

// Form associations
<label htmlFor="mosque-name">Name</label>
<input id="mosque-name" />
```

---

## 📐 Layout Patterns

### Hero Section
```jsx
<section className="bg-gradient-to-r from-emerald-600 to-teal-600 
                    text-white py-16 md:py-24">
  <div className="max-w-4xl mx-auto px-6">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
      {title}
    </h1>
    <p className="text-lg text-emerald-50 mb-8">
      {description}
    </p>
  </div>
</section>
```

### Two-Column Layout
```jsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Sidebar on desktop, top on mobile */}
  <aside className="lg:col-span-1">
    {/* Navigation */}
  </aside>
  
  <main className="lg:col-span-2">
    {/* Content */}
  </main>
</div>
```

### Card Grid
```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map((item) => (
    <Card key={item.id} {...item} />
  ))}
</div>
```

---

## 🖼️ Image Guidelines

### Image Sizes
```
Hero images:    1920x1080 (16:9)
Card images:    400x300 (4:3)
Thumbnails:     200x150 (4:3)
Icons:          24x24, 32x32, 48x48, 64x64

Formats:        WebP (primary), PNG (fallback)
Optimization:   TinyPNG, ImageOptim
Max file size:  100KB per image
```

### Responsive Images
```jsx
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img 
    src="image.png" 
    alt="Descriptive text"
    className="w-full h-auto"
  />
</picture>
```

---

## 📋 Quality Checklist

Before shipping UI components:

```
[ ] Matches color palette exactly
[ ] Typography hierarchy correct
[ ] Proper spacing (8px grid)
[ ] Responsive on all breakpoints
[ ] Touch targets ≥ 44x44px
[ ] Color contrast ≥ 4.5:1
[ ] Focus states visible
[ ] Loading states shown
[ ] Error states apparent
[ ] Mobile optimized
[ ] Dark mode tested
[ ] Screen reader tested
[ ] No animations on prefers-reduced-motion
[ ] Internationalization ready (text sizing)
```

---

## 🔄 Design Review Process

1. **Component Review** (designer reviews)
   - [ ] Follows design system
   - [ ] Matches mockups
   - [ ] Consistent styling

2. **Accessibility Review** (a11y specialist)
   - [ ] WCAG AA compliance
   - [ ] Keyboard navigation
   - [ ] Screen reader compatible

3. **QA Testing**
   - [ ] Responsive design
   - [ ] Cross-browser
   - [ ] Performance

---

## 🧭 Product Surfaces

The two applications share semantics, but intentionally use different visual densities.

| Property | Admin dashboard | Kiosk/TV display |
|---|---|---|
| Primary task | Configure and monitor | Read from a distance |
| Density | Medium/high | Low |
| Base surface | Light/dark slate | Black/image background |
| Interaction | Keyboard, mouse, touch | Mostly passive; occasional touch/remote |
| Typography | 12–32px | Responsive, commonly 24px–18vw |
| Motion | Short feedback | State transitions and slideshow |
| Failure mode | Explain and allow retry | Preserve last valid config and remain legible |

Do not copy an admin card directly into kiosk UI. Preserve semantic colors and states, then adapt scale, contrast, spacing, and interaction for viewing distance.

---

## 🧩 Design Tokens

### Canonical token model

Admin tokens currently live in `apps/web-admin/app/globals.css`. The kiosk currently relies on utility classes and runtime `advancedDisplay` values; new kiosk work SHOULD introduce equivalent semantic variables rather than new literals.

```css
:root {
  /* Semantic surfaces */
  --ds-bg-canvas: #f8fafc;
  --ds-bg-surface: #ffffff;
  --ds-bg-subtle: #f1f5f9;
  --ds-bg-inverse: #0f172a;

  /* Semantic content */
  --ds-text-strong: #0f172a;
  --ds-text-default: #334155;
  --ds-text-muted: #64748b;
  --ds-text-inverse: #ffffff;

  /* Semantic actions/status */
  --ds-action-primary: #059669;
  --ds-action-primary-hover: #047857;
  --ds-status-info: #2563eb;
  --ds-status-success: #16a34a;
  --ds-status-warning: #ea580c;
  --ds-status-danger: #dc2626;

  /* Shape */
  --ds-radius-sm: 8px;
  --ds-radius-md: 12px;
  --ds-radius-lg: 16px;
  --ds-radius-xl: 24px;

  /* Motion */
  --ds-duration-fast: 150ms;
  --ds-duration-normal: 250ms;
  --ds-duration-slow: 500ms;
}
```

Token migration rules:

1. Use semantic tokens for reusable components.
2. Use palette utilities only for isolated illustrations or prototypes.
3. Runtime theme values MUST have safe defaults and retain readable contrast.
4. Do not define a token that has no semantic purpose.
5. Admin shadow behavior must be explicit. The current global `box-shadow: none !important` means shadow utilities do not take effect; new components MUST use borders/elevation consistently until that legacy rule is removed.

### Radius scale

| Token | Value | Usage |
|---|---:|---|
| Small | 8px | Inputs, compact buttons, badges |
| Medium | 12px | Standard controls and small cards |
| Large | 16px | Admin cards and modals |
| Extra large | 24px | Kiosk glass panels and major media cards |
| Full | 9999px | Pills, avatars, toggles |

Arbitrary radii such as `2.5rem` or `3.5rem` SHOULD be reserved for intentional kiosk hero treatments and documented in the component.

---

## 🔤 Typography by Surface

### Font policy

- **Sans:** Inter or Geist Sans, followed by system fallbacks.
- **Numeric/time:** Geist Mono or another tabular monospace face.
- **Arabic/Quran text:** use a verified Arabic-capable font and set suitable line height; never depend on a generic serif fallback for production Quran text.
- Limit each surface to two functional families: sans plus mono/Arabic as required.

### Numeric displays

Clock, countdown, balances, and prayer times MUST use tabular numerals:

```css
.numeric-display {
  font-variant-numeric: tabular-nums;
  font-feature-settings: "tnum" 1;
}
```

- Times use `HH:mm`; seconds are optional and visually subordinate.
- Do not let clock width shift as digits change.
- Kiosk clock sizes SHOULD use `clamp()` to avoid overflow.
- Countdown announcements MUST include a visible label, not a number alone.

### Kiosk distance hierarchy

| Content | Recommended behavior |
|---|---|
| Main clock | Largest element; `clamp(4rem, 15vw, 14rem)` |
| Prayer-state countdown | Comparable to main clock; high contrast |
| Mosque name | Large but subordinate to time/state |
| Prayer cards | Readable at expected installation distance |
| Running text | Minimum equivalent of 20px at 1080p |
| Device/debug controls | Hidden by default, focus/touch discoverable |

Test kiosk typography at 1280×720, 1920×1080, and 3840×2160, including browser zoom and long mosque names.

---

## 🧱 Component Contract and States

Every interactive component MUST define these states where applicable:

```text
default → hover → focus-visible → active → disabled
                  ↘ loading
                  ↘ error/success
```

### Buttons

- Minimum touch target: **44×44px**.
- Visible label is preferred. Icon-only buttons MUST have an accessible name.
- Loading buttons retain their width, expose `aria-busy="true"`, and prevent duplicate submission.
- Destructive actions use danger styling and require confirmation when irreversible.
- Focus MUST use `:focus-visible`; never remove outlines without a replacement.

### Inputs

- Inputs MUST have a persistent `<label>`; placeholders are examples, not labels.
- Help text precedes validation errors in reading order.
- Errors use `aria-invalid="true"` and `aria-describedby`.
- Required fields show both a visual indicator and native/ARIA semantics.
- Numeric fields specify valid range, unit, and increment.
- Coordinates, durations, offsets, opacity, and volume MUST be bounded.

### Select, checkbox, and switch

- Use checkbox when selecting an item; use switch for an immediate on/off setting.
- A switch MUST expose `role="switch"` and `aria-checked`, or use a native checkbox with equivalent semantics.
- Disabled controls explain why when the reason is not obvious.

### Cards and sections

- Card titles describe their contents; avoid decorative headings such as “Settings” repeated without context.
- Clickable cards MUST be keyboard operable and have one clear action.
- Do not place multiple unrelated nested click targets inside a clickable card.
- Admin section spacing: 24–32px; related fields: 12–16px.

### Tables and device lists

- Use a table when columns have relationships; use cards/list rows on narrow screens.
- Headers use `<th scope="col">`; row actions have the device/item name in their accessible label.
- Empty, loading, error, and partial states MUST be distinct.
- Last-seen timestamps SHOULD show relative time and exact time on hover/focus.

### Badges and status pills

| Status | Color | Required companion |
|---|---|---|
| Connected/active | Emerald | Text or check icon |
| Syncing/pending | Blue | Text and progress/spinner |
| Warning/degraded | Orange/amber | Warning icon and explanation |
| Error/blocked/offline | Red/rose | Text and recovery action where possible |
| Neutral/inactive | Slate | Explicit text |

### Loading and progress

- Use a spinner for indeterminate actions shorter than a few seconds.
- Use determinate progress for uploads and asset synchronization.
- Skeletons must approximate final layout and stop animating under reduced motion.
- Never replace the whole kiosk with a blank loading screen when a last-known valid configuration exists.

### Empty and error states

Each state includes:

1. what happened;
2. impact;
3. recommended action;
4. retry/support detail if useful.

Avoid exposing stack traces, credentials, internal paths, or raw server errors in UI.

---

## 🪟 Dialogs, Drawers, Toasts, and Overlays

### Admin dialog/drawer

- Use `role="dialog"`, `aria-modal="true"`, and an accessible title.
- Move focus into the dialog on open and restore it to the trigger on close.
- Trap focus while modal.
- Escape closes non-destructive dialogs.
- Clicking the backdrop MAY close simple dialogs, but MUST NOT discard unsaved destructive work without confirmation.
- Mobile navigation uses a drawer; desktop navigation becomes static at `lg`.

### Toasts

- Success toasts use `role="status"`/polite announcements.
- Errors requiring immediate attention use an assertive announcement sparingly.
- Toasts never contain the only copy of important information.
- Persistent failures belong inline near the affected content.

### Kiosk overlay state model

Kiosk overlays represent worship phases, not ordinary modals. The canonical priority is:

```text
Audio unlock / critical interaction
Setup and logout confirmation
Sholat in progress
Adzan / Iqamah / Imsak
Operational status and player controls
Normal kiosk content
Background media and decoration
```

Canonical z-index tokens:

| Layer | Token | z-index |
|---|---|---:|
| Background media | `--z-background` | 0 |
| Normal content | `--z-content` | 10 |
| Running text/status | `--z-status` | 30 |
| Decoration/noise | `--z-decoration` | 40 |
| Worship phase overlay | `--z-phase` | 60 |
| Setup/modal | `--z-modal` | 100 |
| Critical audio unlock | `--z-critical` | 1000 |

Do not introduce arbitrary z-index values. Decoration MUST NOT share a layer with phase overlays or intercept pointer events.

### Worship-phase semantics

- **Imsak:** warning/information, not an error.
- **Adzan:** clear prayer name and current time; avoid distracting controls.
- **Iqamah:** countdown with stable tabular numerals and an explicit “menuju iqamah” label.
- **Sholat:** minimal, calm screen; suppress non-essential media and announcements.
- State changes SHOULD be announced politely for assistive technology when interaction devices support it.

---

## 📺 Kiosk Layout and Safe Areas

The primary kiosk target is landscape TV, while setup and recovery screens must also work on tablets and narrow displays.

### Supported targets

| Target | Minimum validation |
|---|---|
| HD TV | 1280×720 landscape |
| Full HD TV | 1920×1080 landscape |
| 4K TV | 3840×2160 landscape |
| Tablet/setup | 768×1024 portrait and landscape |
| Narrow recovery | 360×640 |

### Overscan and safe zone

- Keep critical kiosk content at least **3vw/3vh** from physical edges.
- Running text must not be clipped by TV overscan.
- Avoid placing setup/logout controls only in extreme corners.
- Respect CSS safe-area environment variables when installed as a PWA.

```css
.kiosk-safe-area {
  padding:
    max(3vh, env(safe-area-inset-top))
    max(3vw, env(safe-area-inset-right))
    max(3vh, env(safe-area-inset-bottom))
    max(3vw, env(safe-area-inset-left));
}
```

### Prayer cards

- Prefer a grid that supports 5–7 items without text collision.
- At narrow widths, wrap or reduce non-essential metadata; never shrink prayer names below readable size.
- The active prayer state uses color, border/shape, and textual indication.
- Jumat may replace Dzuhur on Friday; Imsak may add an item during Ramadan. Layout testing MUST include both cases.

### Background media

- Always provide a fallback color/gradient.
- Use `object-fit: cover` for decorative media; use `contain` for information-bearing images.
- Apply a configurable scrim when text overlays media.
- Video/stream failures must fall back to the next slide or static background.
- Media controls remain hidden during normal kiosk playback unless interaction is requested.

### Running text

- Keep announcements concise and avoid all caps for long messages.
- Separate multiple messages clearly.
- Pause or replace marquee movement under reduced-motion preference.
- Do not use a non-standard ARIA `marquee` role; expose important text through an appropriate live region only when updates warrant announcement.

---

## 🎛️ Runtime Theme Customization

`advancedDisplay` can customize colors, opacity, blur, font scale, backgrounds, and performance behavior. Customization MUST remain inside these guardrails:

- Validate colors as supported CSS color values before applying them.
- Clamp opacity to `0–1`, blur to a documented maximum, font scale to a safe range, and volume to `0–1`.
- Preserve minimum contrast after customization; provide a preview warning when contrast fails.
- Custom CSS is an expert feature and SHOULD be disabled or sandboxed for untrusted users.
- Always provide “Reset to safe defaults”.
- Theme preview MUST include normal, active-prayer, Imsak, Adzan, Iqamah, Sholat, offline, and error states.

Recommended font-scale range:

```text
Admin preview:  0.80–1.50
Kiosk runtime:  0.75–1.75
```

Values outside the range require an explicit advanced override and overflow testing.

---

## 🎞️ Motion and Performance Policy

### Duration and easing

| Motion | Duration | Guidance |
|---|---:|---|
| Hover/focus feedback | 100–200ms | Immediate, no bounce |
| Expand/collapse | 200–300ms | Preserve spatial context |
| Dialog/overlay | 200–400ms | Fade plus small transform |
| Kiosk slide | 400–800ms | Calm; no rapid flashing |
| Worship state transition | 300–800ms | Respectful and restrained |

### Reduced motion

All continuous/decorative animation MUST honor OS preference:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Application behavior SHOULD also disable or simplify:

- pulse/ping/glow;
- decorative stars/noise;
- parallax and scale transitions;
- marquee movement;
- autoplay transitions that are not operationally required.

The existing `data-perf="lite"` mode is the low-end-device control. Reduced motion and performance mode are related but separate: one honors user preference, the other protects device performance.

### Performance budgets

- Avoid layout-shifting animations.
- Animate opacity and transform instead of layout properties.
- Do not generate random decorative positions during React render; precompute stable values.
- Keep concurrent full-screen blur layers to a minimum.
- Kiosk must remain usable when media, SSE, or network requests fail.

---

## ♿ Accessibility Acceptance Criteria

Target: **WCAG 2.2 AA** for admin and all interactive kiosk/recovery screens.

### Global requirements

- Set document language to Indonesian (`lang="id"`) unless the page content is primarily another language.
- Do not disable browser zoom with `userScalable: false`.
- Provide a skip link in admin.
- Maintain logical heading order.
- Every icon-only control has an accessible name.
- All controls are operable by keyboard.
- Focus order follows visual order.
- Focus indicators remain visible against light, dark, and image backgrounds.
- Pointer gestures have a simple alternative.
- Status messages use appropriate live-region behavior.

### Focus style

```css
:focus-visible {
  outline: 3px solid #10b981;
  outline-offset: 3px;
}
```

### Interactive kiosk overlays

Setup, logout confirmation, and audio unlock MUST:

- use actual buttons for click actions;
- expose dialog semantics when modal;
- move focus appropriately;
- support Enter/Space and Escape where safe;
- retain a visible focus indicator;
- avoid relying on hover-only discovery.

### Language and content

- UI uses clear Indonesian terms consistently: “Salat” or the approved product spelling, not mixed variants without reason.
- Prayer names follow one approved vocabulary set across admin and kiosk.
- Error messages explain recovery without blaming the user.
- Arabic text requires correct direction/language metadata where appropriate, e.g. `lang="ar" dir="rtl"`.

---

## ✍️ Content Design

### Voice and tone

- Calm, respectful, concise, and operational.
- Use sentence case for labels and actions.
- Start button labels with a verb: “Simpan konfigurasi”, “Hubungkan WhatsApp”, “Coba lagi”.
- Avoid unexplained technical terms in normal UI.
- Confirmation text states the object and consequence.

### Standard terminology

| Concept | Preferred label |
|---|---|
| Save | Simpan |
| Cancel | Batal |
| Delete | Hapus |
| Retry | Coba lagi |
| Connected | Terhubung |
| Disconnected | Terputus |
| Offline cached state | Offline — memakai data tersimpan |
| Device | Perangkat display |
| Mosque key | Kode masjid |
| Last update | Terakhir diperbarui |

### Error pattern

```text
Title: Konfigurasi belum tersimpan
Detail: Server tidak dapat dihubungi. Perubahan masih tersedia di halaman ini.
Action: Coba lagi
```

Do not display raw exception messages to end users.

---

## 🖼️ Media and Iconography

- Use Lucide icons consistently in admin controls.
- Default icon sizes: 16px compact, 20px standard, 24px prominent, 32px+ illustration.
- Decorative icons use `aria-hidden="true"`.
- Do not mix outlined and filled icon families within the same control group.
- User-uploaded images require descriptive alt text when informational; decorative slideshow backgrounds use empty alt text or CSS backgrounds.
- Prefer WebP/AVIF for images and optimized audio/video formats supported by target devices.
- File-size guidance is a budget, not a fixed universal 100KB limit; choose an appropriate budget by resolution and installation bandwidth.
- Quran/media artwork must respect licensing and attribution requirements.

---

## 🌐 Offline, Connectivity, and Synchronization UI

Kiosk is offline-first and MUST distinguish:

| State | UI behavior |
|---|---|
| Online/current | No persistent interruption |
| Syncing | Small status pill/progress; keep display usable |
| Offline with cache | Show subtle offline status and last update |
| Offline without config | Show setup/recovery instructions |
| Partial asset failure | Continue with available assets; identify missing count |
| Device blocked | Full recovery screen with admin contact instruction |

- Never show a blank screen because synchronization failed.
- Connectivity indicators use text plus icon.
- Retry uses backoff; UI must not flash repeatedly.
- Show exact last successful synchronization time in admin diagnostics.

---

## 🧪 UI Validation Matrix

Every significant UI change MUST be checked against applicable cases:

### Admin

- 360px, 768px, 1024px, and 1440px widths.
- Light and dark theme.
- Keyboard-only operation.
- 200% browser zoom.
- Empty, loading, success, validation error, server error, and offline states.
- Long mosque/device names and large datasets.

### Kiosk

- 720p, 1080p, and 4K landscape.
- Tablet portrait setup/recovery.
- Normal, Jumat, and Ramadan/Imsak schedules.
- Adzan, Iqamah, Sholat, simulation, offline, syncing, blocked-device, and audio-unlock states.
- Bright and dark background images.
- Reduced motion and `data-perf="lite"`.
- Five, six, and seven prayer cards.
- Very long running text and empty running text.

### Automated checks

- ESLint and TypeScript pass.
- Automated accessibility scan on key routes.
- Component interaction tests for dialogs, forms, toggles, and keyboard navigation.
- Visual regression snapshots for canonical admin and kiosk states.
- Lighthouse checks are interpreted by surface: admin interaction and kiosk stability/performance.

---

## 🗂️ Implementation Governance

### Component placement

- Shared visual primitives SHOULD live in a dedicated component layer rather than inside page files.
- Product-specific behavior stays in feature components.
- Repeated class combinations SHOULD become typed variants or reusable primitives.
- Components MUST accept semantic props (`variant="danger"`) instead of arbitrary color props where possible.

### Definition of done

```text
[ ] Uses semantic tokens or an approved runtime theme value
[ ] Covers default, hover, focus, active, disabled, loading, and error states
[ ] Keyboard and screen-reader behavior verified
[ ] Contrast verified on every supported theme/background
[ ] Responsive and kiosk target resolutions verified
[ ] Reduced-motion and low-end modes verified
[ ] Empty/offline/failure behavior defined
[ ] No raw server error or sensitive information exposed
[ ] Tests and screenshots updated where applicable
[ ] DESIGN_SYSTEM.md updated if a new pattern was introduced
```

### Known legacy gaps

These are migration targets, not approved patterns:

1. Admin shadow tokens exist while a global rule disables all shadows.
2. Admin loads both Inter and Geist without one explicit typography contract.
3. Kiosk lacks a complete semantic token layer.
4. Overlay z-index values are currently scattered and can conflict.
5. Some overlays lack dialog semantics, focus management, and keyboard support.
6. `prefers-reduced-motion` is not consistently implemented.
7. Some icon-only controls lack accessible names.
8. An `xs` responsive utility is used without a confirmed custom breakpoint.
9. Admin and kiosk root language metadata should reflect Indonesian content.
10. Prayer-card layouts need explicit narrow-screen and Ramadan/Jumat behavior.

New work MUST NOT copy these legacy gaps.

---

## 📚 Resources

- Tailwind CSS: https://tailwindcss.com/docs
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/
- Accessibility checklist: https://www.a11yproject.com/checklist/
- Contrast checker: https://webaim.org/resources/contrastchecker/
- Next.js Image: https://nextjs.org/docs/app/api-reference/components/image
- Framer Motion accessibility: https://motion.dev/docs/react-accessibility

Internal implementation references:

- Admin tokens: `apps/web-admin/app/globals.css`
- Admin shell: `apps/web-admin/app/page.tsx`
- Kiosk tokens/performance mode: `apps/web-client/app/globals.css`
- Kiosk composition: `apps/web-client/app/page.tsx`
- Shared configuration contract: `packages/shared-types/src/index.ts`

---

**Document owner:** Product/UI Engineering  
**Last Updated:** August 9, 2026  
**Next Review:** November 9, 2026 or when a new foundational UI pattern is introduced

