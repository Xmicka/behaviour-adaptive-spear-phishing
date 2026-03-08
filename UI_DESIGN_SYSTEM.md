# UI/UX Design Documentation - Behaviour-Adaptive Spear Phishing Dashboard

**For Team Integration & Unified Dashboard Implementation**

---

## **1. Design System Overview**

### **Color Palette**

```css
/* Primary Colors */
--bg-deep:        #050810    (Darkest background)
--bg-dark:        #0a0e1a    (Dark background)
--bg-panel:       #0f1629    (Panel background)
--bg-card:        rgba(15, 22, 41, 0.6)  (Semi-transparent card)

/* Accent Colors */
--accent-cyan:    #22d3ee    (Primary accent - cyan/aqua)
--accent-blue:    #3b82f6    (Secondary accent - blue)
--accent-purple:  #a855f7    (Tertiary accent - purple)

/* Text Colors */
--text-primary:   #f1f5f9    (Main text - light gray/white)
--text-secondary: #94a3b8    (Secondary text - medium gray)
--text-muted:     #64748b    (Muted text - dark gray)

/* Border & Glow */
--border-subtle:  rgba(148, 163, 184, 0.08)    (Subtle gray border)
--border-glow:    rgba(34, 211, 238, 0.15)     (Cyan glow border)
--glow-cyan:      rgba(34, 211, 238, 0.15)     (Cyan glow effect)
--glow-purple:    rgba(168, 85, 247, 0.1)      (Purple glow effect)
```

### **Material Design Tokens (Tailwind)**

| Category | Values |
|----------|--------|
| **Background** | `bg-slate-900`, `bg-slate-950` |
| **Cyan** | `cyan-400`, `cyan-500`, `cyan-600` |
| **Blue** | `blue-500`, `blue-600` |
| **Purple** | `purple-500`, `purple-600` |
| **Red** (Warning) | `red-500`, `red-600` |
| **Yellow** (Alert) | `yellow-500`, `amber-500` |
| **Green** (Success) | `green-500`, `emerald-500` |

---

## **2. Typography**

```
Font Family: 'Inter', ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto
Line Height: 1.6
```

### **Type Scale**

| Size | Use Case | Example |
|------|----------|---------|
| `text-xs` | Labels, micro-text | "Logged in as", "Status badge" |
| `text-sm` | Secondary content | Descriptions, timestamps |
| `text-base` | Body text | Paragraph content |
| `text-lg` | Section headers | Component titles |
| `text-xl` | Large headers | Main dashboard title |
| `text-2xl` | XL headers | Page titles |
| `text-3xl` | Mega headers | Hero titles |
| `text-4xl` | Giant headers | Landing page hero |

### **Font Weights**

- **Regular** (400): Body text, descriptions
- **Semibold** (600): Component titles, labels
- **Bold** (700): Headers, important text
- **Black** (900): Hero text, logos

---

## **3. Component Library**

### **3.1 Buttons**

```tsx
// Primary CTA Button
<button className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/20 transition-all">
  Action Label
</button>

// Secondary Button
<button className="bg-gray-600/50 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors">
  Secondary
</button>

// Danger Button
<button className="bg-red-600/50 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
  Delete / Send
</button>

// Icon Button
<button className="w-10 h-10 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 flex items-center justify-center">
  ⚙️
</button>
```

### **3.2 Cards & Panels**

```tsx
// Glass Card (main pattern)
<div className="rounded-xl border border-white/5 p-6" style={{ background: 'rgba(20, 20, 30, 0.7)' }}>
  <h3 className="text-lg font-bold text-white">Title</h3>
  <p className="text-sm text-gray-400">Content</p>
</div>

// Status Card (with glow)
<div className="rounded-xl border border-cyan-600/50 p-4" style={{ background: 'rgba(0, 217, 255, 0.05)' }}>
  Content with cyan tint
</div>

// Error Card
<div className="rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 p-3 text-sm">
  ❌ Error message
</div>

// Success Card
<div className="rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 p-3 text-sm">
  ✅ Success message
</div>
```

### **3.3 Inputs & Selects**

```tsx
// Text Input
<input 
  type="text"
  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder-gray-500"
  placeholder="Enter text..."
/>

// Select Dropdown
<select className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-600 text-white text-sm focus:outline-none focus:border-cyan-500">
  <option>Option 1</option>
</select>

// Slider / Range
<input type="range" className="w-full accent-cyan-500" />
```

### **3.4 Status Badges**

```tsx
// High Risk (Red)
<span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs font-semibold">
  HIGH
</span>

// Medium Risk (Yellow)
<span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
  MEDIUM
</span>

// Low Risk (Green)
<span className="px-2 py-1 rounded bg-green-500/20 text-green-300 text-xs font-semibold">
  LOW
</span>

// Info Badge (Cyan)
<span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300 text-xs font-semibold">
  ACTIVE
</span>
```

### **3.5 Navbar/Header**

```tsx
<header className="fixed top-0 left-0 right-0 z-50 py-6" style={{ background: 'transparent' }}>
  <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
    {/* Logo */}
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
        🛡️
      </div>
      <div>
        <p className="font-bold text-white text-sm">Platform Name</p>
        <p className="text-xs text-cyan-400">Subtitle</p>
      </div>
    </div>

    {/* Nav Items */}
    <nav className="hidden lg:flex items-center gap-1">
      <button className="px-3 py-2 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-white/5">
        Section
      </button>
    </nav>

    {/* Right Side (User/Logout) */}
    <div className="flex items-center gap-4">
      <button className="px-4 py-2 rounded-lg bg-red-600/50 text-white text-sm hover:bg-red-600">
        Sign Out
      </button>
    </div>
  </div>
</header>
```

### **3.6 Sidebar Navigation**

```tsx
<aside className="fixed left-0 top-0 w-64 h-screen bg-slate-950 border-r border-slate-800 p-4 overflow-y-auto">
  <nav className="space-y-2">
    <button className="w-full px-4 py-3 rounded-lg text-left text-sm text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-400 transition-colors">
      📊 Dashboard
    </button>
    <button className="w-full px-4 py-3 rounded-lg text-left text-sm text-gray-300 hover:bg-cyan-500/20 hover:text-cyan-400">
      👥 Employees
    </button>
  </nav>
</aside>
```

### **3.7 Loading States**

```tsx
// Spinner
<div className="animate-spin w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full" />

// Skeleton Loader
<div className="h-4 w-24 bg-slate-800 rounded animate-pulse" />

// Loading Text
<span className="animate-pulse text-cyan-400">Loading...</span>
```

### **3.8 Modals & Overlays**

```tsx
// Modal Backdrop
<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />

// Modal Content
<div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-900 rounded-xl p-6 border border-slate-700 z-50 max-w-lg w-full mx-4">
  <h2 className="text-xl font-bold text-white mb-4">Modal Title</h2>
  <p className="text-sm text-gray-400 mb-6">Modal content</p>
  <div className="flex gap-3">
    <button className="flex-1 px-4 py-2 rounded-lg bg-slate-800 text-white hover:bg-slate-700">
      Cancel
    </button>
    <button className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 text-black font-semibold hover:bg-cyan-600">
      Confirm
    </button>
  </div>
</div>
```

---

## **4. Layout Patterns**

### **4.1 Full-Width Dashboard**

```
┌─────────────────────────────────────────┐
│  Header / Navbar                        │
├─────┬───────────────────────────────────┤
│     │                                   │
│ S   │      Main Content Area            │
│ i   │  (Scrollable, responsive)         │
│ d   │                                   │
│ e   │  Grid: 1-3 columns depending on   │
│ b   │  screen size                      │
│ a   │                                   │
│ r   │                                   │
│     │                                   │
└─────┴───────────────────────────────────┘
```

### **4.2 Grid Layouts**

```tsx
// 3-Column Grid (Desktop)
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <Card />
  <Card />
  <Card />
</div>

// 2-Column Grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <Card />
  <Card />
</div>

// 1-3 Column Responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards auto-respond to screen size */}
</div>
```

### **4.3 Spacing Scale**

```
Padding: p-2, p-3, p-4, p-5, p-6, p-8, p-12
Margin: m-2, m-3, m-4, m-6, m-8
Gap: gap-2, gap-3, gap-4, gap-6, gap-8
```

---

## **5. Animation & Microinteractions**

### **5.1 Framer Motion Patterns**

```tsx
// Fade In
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Slide + Fade
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4 }}
>
  Content
</motion.div>

// Stagger Children
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ staggerChildren: 0.1 }}
>
  {items.map(item => (
    <motion.div initial={{ y: 10 }} animate={{ y: 0 }}>
      {item}
    </motion.div>
  ))}
</motion.div>

// Hover Effects
<motion.button
  whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(34, 211, 238, 0.5)' }}
  whileTap={{ scale: 0.95 }}
>
  Interactive Button
</motion.button>
```

### **5.2 Hover States**

```css
.hover\:shadow-lg:hover {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.hover\:shadow-cyan-500\/20:hover {
  box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
}

.hover\:bg-white\/5:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.hover\:-translate-y-0.5:hover {
  transform: translateY(-2px);
}

.transition-all {
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## **6. Specific Component Examples**

### **6.1 Metric Card**

```tsx
<div className="rounded-xl border border-white/10 p-6" style={{ background: 'rgba(20, 20, 30, 0.8)' }}>
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Metric Label</p>
      <div className="text-3xl font-bold text-white">42</div>
      <p className="text-xs text-green-400 mt-2">↑ 12% vs last week</p>
    </div>
    <div className="text-3xl">📊</div>
  </div>
</div>
```

### **6.2 Data Table Row**

```tsx
<tr className="border-b border-slate-800 hover:bg-white/5 transition-colors">
  <td className="px-6 py-4 text-sm text-white font-medium">John Doe</td>
  <td className="px-6 py-4 text-sm text-gray-400">High</td>
  <td className="px-6 py-4 text-sm">
    <span className="px-2 py-1 rounded bg-red-500/20 text-red-300 text-xs">HIGH RISK</span>
  </td>
  <td className="px-6 py-4 text-right text-sm">
    <button className="text-cyan-400 hover:text-cyan-300">View</button>
  </td>
</tr>
```

### **6.3 Status Indicator**

```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
  <span className="text-sm text-gray-300">Active</span>
</div>
```

---

## **7. Dark Mode & Contrast**

- **All backgrounds**: Derived from `--bg-deep` (#050810)
- **Text on dark**: Always use light colors (`text-white`, `text-gray-300`)
- **Minimum contrast ratio**: WCAG AA (4.5:1 for text)
- **No pure white backgrounds** - use slate-900 or slate-950

---

## **8. Responsive Breakpoints**

| Breakpoint | Width | Usage |
|-----------|-------|-------|
| `sm` | 640px | Tablets (portrait) |
| `md` | 768px | Tablets (landscape) |
| `lg` | 1024px | Small laptops |
| `xl` | 1280px | Laptops |
| `2xl` | 1536px | Desktops |

**Pattern**: Mobile-first → `md:` → `lg:` → `xl:`

---

## **9. Integration for Unified Dashboard**

### **Option 1: Component-Based Integration**

Each team's dashboard = isolated React component with:
- Own routing (`/admin/spear-phishing-dashboard`)
- Consistent color palette (use CSS variables)
- Shared UI component library
- Theme provider wrapper

```tsx
// unified-dashboard/src/components/SpearPhishingModule.tsx
export function SpearPhishingDashboard() {
  return (
    <div className="space-y-8">
      {/* Your entire dashboard */}
      <SecurityPostureOverview />
      <EmailGenerator />
      {/* ... etc */}
    </div>
  )
}
```

### **Option 2: Embed as iFrame (Easiest)**

```tsx
<iframe 
  src="https://your-spear-phishing-app.onrender.com"
  style={{
    width: '100%',
    height: '100vh',
    border: 'none',
    background: '#050810'
  }}
/>
```

### **Option 3: Shared CSS Variables**

Create `theme.css` used by all 4 teams:

```css
:root {
  --bg-deep: #050810;
  --accent-cyan: #22d3ee;
  --accent-blue: #3b82f6;
  /* ... all other variables */
}
```

All teams import this single file → unified look without code duplication.

---

## **10. Branching Strategy Recommendations**

### **For Team Collaboration:**

```
main (production)
├── feature/unified-dashboard (integration branch)
│   ├── spear-phishing-module (your branch)
│   ├── team-2-module
│   ├── team-3-module
│   └── team-4-module
└── develop (staging)
```

### **Commands:**

```bash
# Create your feature branch
git checkout -b feature/unified-dashboard/spear-phishing-module

# Push to GitHub
git push -u origin feature/unified-dashboard/spear-phishing-module

# Create Pull Request to feature/unified-dashboard
# (Other teams do the same)

# Once all 4 are integrated and tested, merge feature/unified-dashboard → main
```

---

## **11. Premium Version Strategy**

### **Option A: Branch-Based**

```
main (free tier)
├── feature/premium-spear-phishing (premium version)
    ├── Advanced analytics
    ├── Custom templates
    ├── Integration APIs
    └── Extended training modules
```

**Pros:**
- Easy to maintain separately
- Can charge per feature module
- Clean separation

**Cons:**
- Duplicate code
- Hard to sync updates

### **Option B: Feature Flags (Recommended)**

```tsx
// config/features.ts
export const PREMIUM_FEATURES = {
  advancedAnalytics: isPremium,
  customTemplates: isPremium,
  apiIntegration: isPremium,
  extendedTraining: isPremium
}

// in component
{PREMIUM_FEATURES.advancedAnalytics && (
  <AdvancedAnalytics />
)}

// Show paywall if not premium
{!PREMIUM_FEATURES.advancedAnalytics && (
  <PremiumPaywall feature="Advanced Analytics" />
)}
```

**Pros:**
- Single codebase
- Easy A/B testing
- Simple to monetize
- Easy to sync updates

**Cons:**
- Need feature flag system
- Slightly more code

### **My Recommendation:**

**Use Option B (Feature Flags) + GitHub Sponsorship/Stripe for payments**

```
Free Tier:
✅ Basic dashboard
✅ Email generator
✅ 10 employees max
❌ Advanced analytics
❌ Custom templates

Premium Tier ($9-99/month):
✅ Everything in Free
✅ Advanced analytics
✅ Custom phishing templates
✅ Unlimited employees
✅ API access
✅ Extended training library
✅ Priority support
```

---

## **Summary: 3 Next Steps**

1. **Create shared UI component library** (if unified dashboard needs it)
2. **Choose branching strategy** (recommend: feature branches → feature/unified-dashboard)
3. **Decide premium model** (recommend: Feature flags in main branch)

Would you like me to:
- Create a reusable component library export?
- Set up the feature flag system?
- Create a branching guide for your team?
