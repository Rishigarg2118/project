# i-SOFTZONE Website Theme & Design System Guide

This document provides a comprehensive overview of the design themes, visual languages, design tokens, and CSS components used across the **i-SOFTZONE** platforms.

The workspace contains two distinct visual themes designed to offer a cohesive, modern experience:
1. **The Modern Enterprise theme** (Found in [I-soft-Project/frontend](file:///c:/Users/Rishi%20Garg/OneDrive/Desktop/I%20soft/I-soft-Project/frontend) - Premium Glassmorphic)
2. **The Classic/Minimalist theme** (Found in the root [workspace index.css](file:///c:/Users/Rishi%20Garg/OneDrive/Desktop/I%20soft/index.css) - Indigo & Slate)

---

## 🌟 1. Modern Enterprise theme (Premium Glassmorphic)

The flagship interface of the application is built on top of high-end **Glassmorphism**, leveraging soft gradients, background ambient drifts, micro-interactions, and visual transparency.

### 🎨 Color Palette & Tokens
These design tokens are defined in the CSS root of the client app ([frontend/src/index.css](file:///c:/Users/Rishi%20Garg/OneDrive/Desktop/I%20soft/I-soft-Project/frontend/src/index.css)):

| Token Variable | Visual Value / Representation | Hex / RGBA Code | Use Case |
| :--- | :--- | :--- | :--- |
| `--primary` | Warm Coral Orange | `#ea580c` | Brand colors, primary buttons, focal highlights |
| `--primary-glow` | Soft Orange Glow | `rgba(234, 88, 12, 0.15)` | Focus state outlines, active status indicators |
| `--secondary` | Warm Amber | `#d97706` | Secondary actions, alternative call-to-actions |
| `--secondary-glow` | Amber Glow | `rgba(217, 119, 6, 0.15)` | Focus accents, secondary hover glows |
| `--success` | Emerald Green | `#059669` | Approved leaves, clock-in status, active alerts |
| `--success-glow` | Emerald Glow | `rgba(5, 150, 105, 0.15)` | Glowing success indicators |
| `--danger` | Ruby Red | `#dc2626` | Rejected applications, deletion modals, error states |
| `--danger-glow` | Ruby Glow | `rgba(220, 38, 38, 0.15)` | Pulsing badges, alarm details |
| `--warning` | Amber Warning | `#d97706` | Pending approvals, warnings, pending items |
| `--warning-glow` | Warning Amber Glow | `rgba(217, 119, 6, 0.15)` | Soft warning badge shadows |
| `--text-primary` | Dark Slate | `#0f172a` | Headers, page titles, dominant text elements |
| `--text-secondary` | Medium Slate | `#475569` | Subtitles, labels, secondary details |
| `--text-muted` | Muted Grey-Blue | `#64748b` | Timestamps, placeholders, inactive states |
| `--white` | Pure White | `#ffffff` | Overlays, text contrast on gradients |

### 🌍 Layout & Background Gradients
- **Active Background**: `--bg-gradient` is `linear-gradient(135deg, #f8fafc 0%, #fdf8f0 50%, #fff3e3 100%)` (warm, clean off-white gradient).
- **Drifting Mesh Background**: Uses `::before` and `::after` pseudo-elements with `radial-gradient` circles that translate and scale dynamically on a loops:
  - Circle 1 (Top-Left): `rgba(234, 88, 12, 0.05)` (Coral) drifting on a 25s loop.
  - Circle 2 (Bottom-Right): `rgba(245, 158, 11, 0.04)` (Amber) drifting on a 30s reverse loop.

### ✍️ Typography
- **Headings Font**: `'Outfit', sans-serif` — A modern, geometric sans-serif font ideal for bold titles, branding, and widgets.
- **Body Font**: `'Plus Jakarta Sans', sans-serif` — An highly readable and clean sans-serif optimized for table values, forms, and general UI.

### 🖼️ Glassmorphism Token Rules
- **Glass Surfaces**:
  - `rgba(255, 255, 255, 0.45)` (`--surface-glass`)
  - `rgba(255, 255, 255, 0.75)` on hover (`--surface-glass-hover`)
- **Glass Borders**:
  - `rgba(0, 0, 0, 0.08)` (`--border-glass`)
  - `rgba(234, 88, 12, 0.25)` when active/focused (`--border-glass-active`)
- **Premium Box Shadows**:
  - Large Premium Shadow: `0 20px 40px -15px rgba(120, 70, 0, 0.05)` (`--shadow-premium`)
  - Glow Shadow: `0 0 30px -5px rgba(234, 88, 12, 0.1)` (`--shadow-glow`)
- **Transitions**: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)` (`--transition-smooth`)

---

## 🎨 2. Classic/Minimalist theme (Vibrant Indigo & Slate)

The root codebase utilizes a clean, high-contrast, flat theme powered by classic utility borders, white cards, and bright indigo highlights.

### 🎨 Color Palette & Tokens
These tokens are defined in the workspace's root [index.css](file:///c:/Users/Rishi%20Garg/OneDrive/Desktop/I%20soft/index.css):

| Token Variable | Visual Value / Representation | Hex / RGB Code | Use Case |
| :--- | :--- | :--- | :--- |
| `--bg` | Light Blue/Grey | `#f4f6fb` | Page viewport background |
| `--surface` | Solid White | `#ffffff` | Sidebar, main grid container panels |
| `--card` | Solid White | `#ffffff` | Information blocks and list cards |
| `--border` | Slate Border | `#e2e8f0` | Grid dividers, inputs, sidebar limits |
| `--accent` | Vibrant Blue | `#2563eb` | Core brand color, primary button background, links |
| `--accent2` | Purple | `#7c3aed` | Secondary badges and interactive components |
| `--accent3` | Red | `#ef4444` | Errors, negative metrics, actions |
| `--text` | Deep Slate | `#1e293b` | Main readable text |
| `--muted` | Muted Blue-Grey | `#94a3b8` | Subtext, icons, input placeholding |
| `--white` | White | `#fff` | Contrasting button elements |

### ✍️ Typography
- **Headings Font**: `'Syne', sans-serif` — Artful and punchy typography for big numbers and dashboard summaries.
- **Body Font**: `'DM Sans', sans-serif` — Neutral, sleek body typography.

---

## 🛠️ Main CSS Components & Styling Guide

The following layout helper classes are implemented globally to maintain design system conformity:

### 1. Glass Containers and Cards
Containers utilize standard backdrop blur and glass transparency parameters:
```css
/* Container Box */
.glass-container {
  background: var(--surface-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-glass);
  border-radius: 20px;
  box-shadow: var(--shadow-premium);
  transition: var(--transition-smooth);
}

/* Hover-Interactive Card */
.glass-card {
  background: var(--surface-glass);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  box-shadow: var(--shadow-premium);
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease, border-color 0.3s ease;
  overflow: hidden;
}

.glass-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 30px 60px -15px rgba(120, 70, 0, 0.08), 0 0 30px -5px rgba(234, 88, 12, 0.2);
  border-color: var(--border-glass-active);
}
```

### 2. Premium Buttons
The theme uses a gorgeous purple-to-orange gradient button that translates slightly on hover and casts a glowing shadow.
```css
.glow-btn {
  background: linear-gradient(135deg, var(--primary) 0%, #7c3aed 100%);
  color: var(--white);
  border: none;
  border-radius: 12px;
  font-weight: 600;
  box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
  transition: var(--transition-smooth);
}

.glow-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.5), 0 0 15px var(--primary-glow);
}
```

### 3. Glass Tables
Tables are rendered on top of soft, semi-transparent backdrops:
```css
.glass-table-container {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid var(--border-glass);
  background: rgba(255, 255, 255, 0.005);
  backdrop-filter: blur(12px);
  box-shadow: var(--shadow-premium);
}

.glass-table th {
  background: rgba(240, 235, 225, 0.8);
  font-family: var(--font-head);
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-glass);
}
```

### 4. Status Badges
Pills with active glowing dots representing status values:
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

/* Success State example */
.status-badge.success {
  background: rgba(16, 185, 129, 0.08);
  color: var(--success);
  border: 1px solid rgba(16, 185, 129, 0.25);
}
.status-badge.success::before {
  background: var(--success);
  box-shadow: 0 0 8px var(--success);
}
```

### 5. Interactive Sidebars
Navigation links shift sideways slightly and light up when hovered or active:
```css
.sidebar-link:hover {
  color: var(--primary);
  background: rgba(234, 88, 12, 0.06);
  border-color: rgba(234, 88, 12, 0.12);
  transform: translateX(4px);
}

.sidebar-link.active {
  color: var(--white);
  background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
  border: 1px solid rgba(234, 88, 12, 0.2);
  box-shadow: 0 8px 20px -6px rgba(234, 88, 12, 0.35);
}
```
