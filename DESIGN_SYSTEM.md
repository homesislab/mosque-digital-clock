# 🎨 Mosque Digital Clock - Design System & UI/UX Guidelines

**Version:** 1.0  
**Last Updated:** April 8, 2026

---

## 📋 Design System Overview

This document establishes the visual and interaction guidelines for the Mosque Digital Clock application to ensure consistency across all platforms and features.

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

### Accessibility Contrast Ratios
```
WCAG AA Compliance (minimum 4.5:1 for normal text):
✅ Emerald on White:     17:1 ✓
✅ Navy on White:        17:1 ✓
✅ White on Navy:        17:1 ✓
✅ White on Emerald:     5.2:1 ✓
❌ Gray on White:        3.2:1 ✗ (Use for secondary only)

Always test with: WebAIM contrast checker
```

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

### Scale (8px base unit)
```
scale-0:  0px    (no space)
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
  {typeof items.map((item) => (
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

## 📚 Resources

- Figma Component Library: [Link to shared file]
- Tailwind Docs: https://tailwindcss.com
- WCAG 2.1 Guidelines: https://www.w3.org/WAI/WCAG21/quickref/
- Accessibility Checklist: https://www.a11yproject.com/checklist/
- Color Contrast Checker: https://webaim.org/resources/contrastchecker/

---

**Last Updated:** April 8, 2026  
**Next Review:** 3 months from implementation

