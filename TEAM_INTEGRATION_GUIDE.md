# 🔗 Team Integration Guide - Unified Dashboard

**How to integrate 4 different cybersecurity modules into ONE unified dashboard**

---

## **The Strategy**

Instead of:
```
Team 1 Dashboard → https://team1.onrender.com
Team 2 Dashboard → https://team2.onrender.com
Team 3 Dashboard → https://team3.onrender.com
Team 4 Dashboard → https://team4.onrender.com
```

Create:
```
Unified Dashboard → https://unified-dashboard.onrender.com
├── Spear Phishing Module (Your Team)
├── Team 2 Module
├── Team 3 Module
└── Team 4 Module
```

---

## **Option 1: iFrame Integration (Easiest, ~1 hour)**

### **For the Unified Dashboard:**

```tsx
// unified-dashboard/src/pages/SpearPhishingModule.tsx
export function SpearPhishingModule() {
  return (
    <div className="h-full w-full bg-slate-950">
      <iframe 
        src="https://your-spear-phishing-app.onrender.com"
        title="Spear Phishing Module"
        style={{
          width: '100%',
          height: 'calc(100vh - 80px)',
          border: 'none',
          background: '#050810'
        }}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
      />
    </div>
  )
}
```

### **Main Unified Dashboard Router:**

```tsx
// unified-dashboard/src/App.tsx
import { Routes, Route } from 'react-router-dom'
import MainNavbar from './components/MainNavbar'
import Sidebar from './components/Sidebar'
import SpearPhishingModule from './pages/SpearPhishingModule'
import Team2Module from './pages/Team2Module'
import Team3Module from './pages/Team3Module'
import Team4Module from './pages/Team4Module'

export default function App() {
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Unified Sidebar */}
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Unified Header */}
        <MainNavbar />
        
        {/* Content Area */}
        <Routes>
          <Route path="/" element={<SpearPhishingModule />} />
          <Route path="/spear-phishing" element={<SpearPhishingModule />} />
          <Route path="/team-2" element={<Team2Module />} />
          <Route path="/team-3" element={<Team3Module />} />
          <Route path="/team-4" element={<Team4Module />} />
        </Routes>
      </div>
    </div>
  )
}
```

### **Pros & Cons:**

| Pros | Cons |
|------|------|
| ✅ Zero code changes needed | ❌ Cross-origin issues possible |
| ✅ Each team stays independent | ❌ Styling doesn't perfectly match |
| ✅ Easy to deploy separately | ❌ Performance slightly slower |
| ✅ ~1 hour to integrate | ❌ Deep linking issues |

---

## **Option 2: Component Library Integration (Better, ~4-6 hours)**

### **Step 1: Extract Your Dashboard as Reusable Component**

```typescript
// spear-phishing-dashboard-lib/src/index.ts
export { AdminDashboard } from './pages/AdminDashboard'
export { SecurityPostureOverview } from './dashboard/SecurityPostureOverview'
export { EmailGenerator } from './dashboard/EmailGenerator'
export { EmployeeDirectory } from './dashboard/EmployeeDirectory'
// ... export all components

// Also export types
export type { DashboardUser, GeneratedEmail, DashboardAlert } from './api/client'

// And API client
export { fetchDashboardData, generatePhishingEmail } from './api/client'
```

### **Step 2: Publish to npm (Optional) or Use Git Submodule**

```bash
# Option A: Publish to npm (requires npm account)
npm publish

# Option B: Use as Git submodule
cd unified-dashboard
git submodule add https://github.com/yourname/spear-phishing-lib.git node_modules/spear-phishing-lib
```

### **Step 3: Use in Unified Dashboard**

```tsx
// unified-dashboard/src/pages/SpearPhishingModule.tsx
import { AdminDashboard } from 'spear-phishing-dashboard-lib'

export function SpearPhishingModule() {
  return <AdminDashboard />
}
```

### **Step 4: Unified Theme Provider**

```tsx
// unified-dashboard/src/theme/ThemeProvider.tsx
import React from 'react'

// Shared CSS variables for all 4 modules
const sharedTheme = `
  :root {
    --bg-deep: #050810;
    --bg-dark: #0a0e1a;
    --accent-cyan: #22d3ee;
    --accent-blue: #3b82f6;
    --accent-purple: #a855f7;
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
  }
`

export function ThemeProvider({ children }) {
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = sharedTheme
    document.head.appendChild(style)
  }, [])

  return <>{children}</>
}
```

### **Pros & Cons:**

| Pros | Cons |
|------|------|
| ✅ Perfect visual consistency | ❌ Requires code refactoring |
| ✅ Better performance | ❌ ~4-6 hours setup |
| ✅ Easy deep linking | ❌ More complex deployment |
| ✅ Shared authentication | ❌ Tight coupling possible |

---

## **Option 3: Monorepo (Best, ~8-12 hours)**

### **File Structure:**

```
unified-platform/
├── packages/
│   ├── ui-library/              # Shared components
│   │   ├── src/components/
│   │   ├── src/hooks/
│   │   └── package.json
│   ├── spear-phishing/          # Your module (refactored)
│   │   ├── src/
│   │   └── package.json
│   ├── team-2-module/
│   ├── team-3-module/
│   ├── team-4-module/
│   └── shared-api-client/       # Common API logic
├── apps/
│   └── unified-dashboard/       # Main app
│       ├── src/
│       └── package.json
├── lerna.json                   # or yarn workspaces
└── package.json
```

### **Setup (using Lerna):**

```bash
# Install Lerna
npm install -g lerna

# Initialize monorepo
lerna init

# Add packages
lerna create @platform/ui-library packages/ui-library
lerna create @platform/spear-phishing packages/spear-phishing

# Install dependencies across all packages
lerna bootstrap

# Build all packages
lerna run build
```

### **Pros & Cons:**

| Pros | Cons |
|------|------|
| ✅ Perfect code sharing | ❌ Complex setup |
| ✅ Atomic deployments | ❌ Steep learning curve |
| ✅ Version consistency | ❌ CI/CD complexity |
| ✅ Team scalability | ❌ ~12 hours setup |

---

## **My Recommendation: Option 2 (Component Library)**

### **Why?**

1. ✅ Balance of simplicity and quality
2. ✅ You keep control of your code
3. ✅ Visual consistency guaranteed
4. ✅ Other teams can do the same
5. ✅ Easy to transition to monorepo later

### **Quick Start (4 hours):**

#### **Step 1: Create a lib branch**

```bash
git checkout -b refactor/component-library
```

#### **Step 2: Create package structure**

```bash
# In your repo root
mkdir -p packages/spear-phishing-lib
mkdir -p packages/unified-dashboard-plugin
```

#### **Step 3: Extract exports**

```typescript
// packages/spear-phishing-lib/src/index.ts
// Export all components, hooks, types, API clients

// packages/spear-phishing-lib/package.json
{
  "name": "@cyber-platform/spear-phishing",
  "version": "1.0.0",
  "main": "dist/index.js",
  "module": "dist/index.esm.js"
}
```

#### **Step 4: Create unified dashboard plugin**

```typescript
// packages/unified-dashboard-plugin/src/SpearPhishingPlugin.tsx
import { AdminDashboard } from '@cyber-platform/spear-phishing'

export default function SpearPhishingPlugin() {
  return <AdminDashboard />
}

export const plugin = {
  name: 'Spear Phishing',
  icon: '🎯',
  route: '/spear-phishing',
  component: SpearPhishingPlugin
}
```

#### **Step 5: Merge to main**

```bash
git add .
git commit -m "refactor: extract dashboard as reusable component library"
git push origin refactor/component-library
# Create Pull Request on GitHub
```

---

## **GitHub Branching for Team Collaboration**

```
main (production - unified dashboard)
├── feature/spear-phishing-module (your work)
│   ├── docs/ui-design-system.md
│   ├── refactor/component-library
│   ├── feature/premium-version
│   └── ... your PRs
├── feature/team-2-module
├── feature/team-3-module
└── feature/team-4-module
```

### **Workflow:**

```bash
# You work in your branch
git checkout feature/spear-phishing-module
git pull origin feature/spear-phishing-module

# Make changes, commit
git add .
git commit -m "feat: add premium feature"

# Create PR to feature/spear-phishing-module (for your team)
git push origin feature/spear-phishing-module
# Open PR: feature/spear-phishing-module

# Once all 4 teams are ready:
# Create PR: feature/spear-phishing-module → main
# This pulls in your entire module to unified dashboard
```

---

## **Premium Version Strategy**

### **Using Environment Variables:**

```typescript
// src/config/features.ts
export const isPremium = process.env.REACT_APP_PREMIUM === 'true'

export const FEATURES = {
  advancedAnalytics: isPremium,
  customTemplates: isPremium,
  apiIntegration: isPremium,
  customizeScenarios: isPremium,
}
```

### **In Components:**

```tsx
import { FEATURES } from '../config/features'

export function EmailGenerator() {
  return (
    <div>
      <h2>Email Generator</h2>
      
      {FEATURES.customizeScenarios && (
        <button>Custom Scenarios</button>
      )}
      
      {!FEATURES.customizeScenarios && isPremium === false && (
        <div className="bg-purple-500/20 border border-purple-500/50 p-4 rounded">
          <h3>Upgrade to Premium</h3>
          <button onClick={() => window.location.href = '/pricing'}>
            Unlock Custom Scenarios
          </button>
        </div>
      )}
    </div>
  )
}
```

### **Deployment Options:**

```bash
# Free tier
REACT_APP_PREMIUM=false npm run build
npm run deploy:free

# Premium tier
REACT_APP_PREMIUM=true npm run build
npm run deploy:premium
```

Or using Render:

1. Create 2 services:
   - `spear-phishing-free` → Environment: `REACT_APP_PREMIUM=false`
   - `spear-phishing-premium` → Environment: `REACT_APP_PREMIUM=true`

2. Both deploy from same GitHub repo, different branches

---

## **Pricing Recommendation**

```
FREE TIER
✅ Basic Spear Phishing (up to 10 employees)
✅ Template-based emails
✅ Basic risk scoring
✅ Training assignments
$ 0/month

PREMIUM TIER ($29/month)
✅ Everything in Free
✅ Unlimited employees
✅ Advanced risk analytics
✅ Custom email templates
✅ LLM-powered personalization
✅ API access
✅ Extended training library
✅ Priority support
$ 29/month

ENTERPRISE (Custom)
✅ Everything in Premium
✅ On-premise deployment
✅ Custom integrations
✅ Dedicated support
$ Contact Sales
```

---

## **Quick Checklist for You**

- [ ] Create `refactor/component-library` branch
- [ ] Extract dashboard components to `packages/spear-phishing-lib`
- [ ] Create `packages/unified-dashboard-plugin`
- [ ] Test exports work in isolation
- [ ] Push to GitHub and create PR
- [ ] Add feature flag system for premium
- [ ] Document all changes in this repo
- [ ] Coordinate with other 3 teams on unified design
- [ ] Merge all 4 modules → main branch

---

## **Next Meeting with Your Team**

1. **Decide integration strategy** (I recommend Option 2)
2. **Agree on shared color palette** (Use `UI_DESIGN_SYSTEM.md`)
3. **Plan branching strategy** (Use the above structure)
4. **Assign integration owner** (Someone coordinates merges)
5. **Set timeline** (Option 2 = 4 hours/team × 4 teams = 1 day total)

---

**Need help with any of these steps? Ask!** 🚀
