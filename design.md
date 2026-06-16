# i-SOFTZONE Website Design System Guide

This document acts as the definitive design reference for the **i-SOFTZONE** digital ecosystem. It establishes the design philosophy, layout architectures, grid systems, and component interaction rules that ensure visual parity across all platforms.

---

## 🎨 1. Core Design Philosophy

The design system is engineered around two distinct user experience states:

### 🌟 Premium Glassmorphism
* **Dimensionality:** Soft layers built using varying backdrops (`backdrop-filter: blur()`), glowing borders, and drop shadows.
* **Ambient Lighting:** Uses dynamic gradients and moving radial elements to simulate a warm, lit environment.
* **Fluidity:** Fine micro-interactions on hover, active, and focus states.

### 🏛️ Classic Minimalism
* **Contrast:** High-contrast text on solid backgrounds.
* **Cleanliness:** Sharp margins, standard borders, and simple component shapes.
* **Focus:** Reduced background motion and decoration to emphasize structural content.

---

## 📊 2. Typography System

All typographic elements follow a hierarchical system optimized for screens.

### Fonts
* **Outfit** (Primary Headings - Modern Theme): A geometric, friendly sans-serif that works perfectly for large display headings.
* **Plus Jakarta Sans** (Primary Body - Modern Theme): An elegant, highly readable sans-serif optimized for tabular data and system labels.
* **Syne** (Headings - Classic Theme): An artistic, high-energy sans-serif for striking statistics and headers.
* **DM Sans** (Body - Classic Theme): A neutral, crisp sans-serif built for high-performance reading.

### Font Scale & Line Heights
| Usage | Weight | Font Size | Line Height |
| :--- | :--- | :--- | :--- |
| **H1 - Dashboard Hero** | 800 | `2.25rem` (36px) | `1.2` |
| **H2 - Section Titles** | 700 | `1.5rem` (24px) | `1.3` |
| **H3 - Card Headers** | 600 | `1.125rem` (18px) | `1.4` |
| **Body - Default** | 400 | `0.875rem` (14px) | `1.5` |
| **Subtext / Table Cells**| 400 | `0.75rem` (12px) | `1.6` |

---

## 📐 3. Layout Grid & Spacing Rules

The workspace relies on a standard **8px spacing grid** to define padding, margins, and component alignments.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 20px;
  --radius-full: 9999px;
}
```

* **Section Margin:** `24px` (horizontal and vertical margins between page panels).
* **Card Padding:** `24px` inside glass cards for readability.
* **Layout Max-Width:** Responsive containers max out at `1440px`.

---

## 🛠️ 4. Standard CSS Components & UI Controls

To ensure developer conformity, these classes should be used directly for UI builds.

### 🖼️ 1. Glass Containers and Cards
Provide depth and contrast over the background gradient.

```css
.glass-container {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 20px;
  box-shadow: 0 20px 40px -15px rgba(120, 70, 0, 0.05);
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 60px -15px rgba(120, 70, 0, 0.08), 0 0 30px -5px rgba(234, 88, 12, 0.2);
  border-color: rgba(234, 88, 12, 0.25);
}
```

### ⚡ 2. Action Buttons
Primary call-to-actions utilize gradients with glowing drop-shadows on hover.

```css
.glow-btn {
  background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
  color: var(--white);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5), 0 0 15px rgba(234, 88, 12, 0.15);
}
```

### 📝 3. Tables & Lists
Tables use transparent headers with uppercase, tracking headers.

```css
.glass-table th {
  background: rgba(240, 235, 225, 0.8);
  font-family: var(--font-head);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-primary);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}
```

### 🟢 4. Status Badges
Status indicators use a semi-transparent background with a glowing inner dot.

```css
.status-badge {
  padding: 6px 14px;
  border-radius: 30px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.status-badge::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
}
```
