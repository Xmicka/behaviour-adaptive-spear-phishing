# 🚀 Quick Reference Guide

## Live Development Server

```bash
cd frontend
npm run dev
# Opens: http://localhost:5173
```

---

## Project Files Quick Map

| File | Purpose | Lines |
|------|---------|-------|
| `src/pages/Landing.tsx` | Main public landing page | 730 |
| `src/pages/Dashboard.tsx` | Authenticated risk dashboard | 550 |
| `src/components/Hero.tsx` | Hero section with 3D shield | 195 |
| `src/components/ScrollSections.tsx` | Scroll animation system | 180 |
| `src/components/DemoFlow.tsx` | Interactive pipeline demo | 270 |
| `src/components/Shield3D.tsx` | 3D shield visualization | 130 |
| `src/components/Navbar.tsx` | Dashboard navigation | 130 |
| `src/components/MicroTrainingModal.tsx` | Training modal | 320 |
| `src/auth/Login.tsx` | Login form modal | 210 |
| `src/App.tsx` | Router setup | 15 |
| `src/styles.css` | Global styles + animations | 270 |

---

## Key Components & Their Features

### Hero Component
```typescript
<Hero onCtaClick={() => setShowLogin(true)} />
```
- Fullscreen with 3D shield
- Animated background orbs
- Scroll indicator
- CTA button

### Landing Page Sections
1. What We Do (Feature cards)
2. Adaptive Pipeline (Interactive demo)
3. Enterprise Features (Grid layout)
4. Industry Results (Metrics)
5. CTA Footer (Call to action)

### Dashboard Components
- MetricCard (Animated numbers)
- RiskRow (Clickable employee)
- EmployeeDetailPanel (Info card)
- Campaign status board

---

## Color Usage

```typescript
// Primary cyan
className="text-cyan-400"
className="from-cyan-500 to-blue-600"

// Gradients
className="bg-gradient-to-r from-cyan-500 to-blue-600"

// Status colors
critical: "from-red-500 to-red-600"
high: "from-orange-500 to-orange-600"
medium: "from-yellow-500 to-yellow-600"
low: "from-green-500 to-green-600"

// Glass effect
className="glass"
className="glass-dark"
```

---

## Animation Patterns

### Fade & Scale
```typescript
initial={{ opacity: 0, scale: 0.9 }}
animate={{ opacity: 1, scale: 1 }}
```

### Slide Up
```typescript
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
```

### Hover Lift
```typescript
whileHover={{ scale: 1.05, translateY: -5 }}
```

### Infinite Loop
```typescript
animate={{ y: [0, 40, 0] }}
transition={{ duration: 8, repeat: Infinity }}
```

### Stagger Children
```typescript
variants={{
  container: { staggerChildren: 0.1 },
  item: { ... }
}}
```

---

## Common Modifications

### Change Primary Color
In `src/styles.css`:
```css
.gradient-text {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Adjust Animation Speed
In component:
```typescript
transition={{ duration: 0.3 }} // Change this value
```

### Modify Glassmorphism
In `src/styles.css`:
```css
.glass {
  backdrop-filter: blur(10px); /* Increase for more blur */
}
```

### Add New Section to Landing
In `Landing.tsx`, add to sections array:
```typescript
{
  id: 'new-section',
  title: 'New Title',
  subtitle: 'New subtitle',
  content: <YourComponent />,
}
```

---

## API Integration Checklist

- [ ] Replace mock employee data in `Dashboard.tsx`
- [ ] Connect login to real auth in `Login.tsx`
- [ ] Add API endpoints in `Dashboard.tsx` useEffect
- [ ] Replace localStorage with proper auth
- [ ] Add error handling for API calls
- [ ] Implement loading states
- [ ] Add WebSocket for real-time updates
- [ ] Connect training endpoints

Example:
```typescript
// In Dashboard.tsx
useEffect(() => {
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees');
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      setError('Failed to load employees');
    } finally {
      setIsLoading(false);
    }
  };
  fetchEmployees();
}, []);
```

---

## Responsive Breakpoints

```typescript
// Mobile first
<div className="text-base lg:text-lg">
  Text size changes at 1024px
</div>

<div className="grid grid-cols-1 lg:grid-cols-3">
  1 column on mobile, 3 on desktop
</div>

<div className="hidden lg:block">
  Hidden on mobile, shown on desktop
</div>
```

---

## Testing Locally

### Flow 1: Landing Page
1. Open http://localhost:5173
2. See hero with 3D shield
3. Scroll to see content reveal
4. Click "View Demo" → Login modal opens
5. Enter any email/password
6. Navigate to dashboard

### Flow 2: Dashboard Exploration
1. Click employee row → Detail panel opens
2. Hover over metric cards → Animation
3. View campaign status → Progress bars animate
4. Click "Assign Training" → Training modal
5. Complete training → Success screen

### Flow 3: Responsive Test
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test at mobile (375px), tablet (768px), desktop (1024px)
4. Check typography scales
5. Verify layouts stack correctly

---

## Troubleshooting Quick Fixes

### Dev Server Won't Start
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### Build Fails
```bash
npx tsc --noEmit  # Check TypeScript
rm -rf .vite      # Clear cache
npm run build     # Rebuild
```

### Animations Janky
- Check browser GPU acceleration (DevTools)
- Reduce animation complexity
- Use transform/opacity only (avoid height/width)

### 3D Shield Not Showing
- Check WebGL support (DevTools → Capture settings)
- Ensure Three.js loaded correctly
- Check for JavaScript errors in console

### Styling Issues
```bash
npm run build     # Tailwind may need rebuild
npm run dev       # Restart dev server
```

---

## Production Deployment

### Build
```bash
npm run build
# Creates: dist/ folder (~306 KB gzipped)
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
# Follow prompts
```

### Deploy to Netlify
```bash
npm run build
# Drag dist/ to Netlify drop zone
```

### Docker
```bash
docker build -t adaptive-guard:latest .
docker run -p 3000:3000 adaptive-guard:latest
```

---

## Key Statistics

| Metric | Value |
|--------|-------|
| Components | 9 |
| Pages | 2 |
| TypeScript Files | 15+ |
| CSS Lines | 270+ |
| Animation Types | 15+ |
| Responsive Breakpoints | 4 |
| Color Palette | 12 colors |
| Animations | 50+ instances |
| Build Size (gzipped) | 306 KB |
| Dev Server Start | < 1s |

---

## Documentation Files

1. **IMPLEMENTATION_SUMMARY.md** - What was built
2. **FRONTEND_DOCUMENTATION.md** - Technical deep dive
3. **README.md** (frontend) - Quick start guide
4. **README.md** (root) - Project overview
5. **This file** - Quick reference

---

## Useful Commands

```bash
# Development
npm run dev           # Start dev server
npm run build        # Production build
npm run preview      # Preview build

# Type checking
npx tsc --noEmit     # Check TypeScript errors

# Debugging
npm run dev -- --host  # Expose to network

# Clean install
rm -rf node_modules && npm install

# Check bundle size
npm run build && du -sh dist/
```

---

## Component Import Template

```typescript
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ComponentProps {
  // Your props
}

const Component: React.FC<ComponentProps> = (props) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Your content */}
    </motion.div>
  )
}

export default Component
```

---

## Next Tasks

After getting comfortable with the frontend:

1. ✅ Understand component structure
2. ✅ Review animation patterns
3. ✅ Test responsive design
4. ⏭️ Integrate backend API
5. ⏭️ Add authentication system
6. ⏭️ Implement real data
7. ⏭️ Deploy to production
8. ⏭️ Monitor and optimize

---

**Questions?** Check the comprehensive documentation files or review component source code with inline comments.
