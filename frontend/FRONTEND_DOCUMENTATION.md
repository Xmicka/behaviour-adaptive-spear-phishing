# Adaptive Spear Guard - Premium Frontend

A premium, animation-heavy cybersecurity product frontend inspired by the Lando Norris website. Built with React, Vite, TypeScript, Framer Motion, and Three.js.

## 🎨 Design Philosophy

This frontend implements a **premium, immersive experience** with:

- ✨ **Smooth scroll-based animations** - Content reveals as you scroll, like the Lando Norris site
- 🎭 **Glassmorphism design** - Frosted glass effects with backdrop blur
- 🔵 **Cyan/Blue gradient aesthetic** - Modern cybersecurity color palette
- 📱 **Fully responsive** - Optimized for mobile, tablet, and desktop
- ⚡ **Framer Motion throughout** - Every interaction is animated and smooth
- 🎯 **No page reloads** - Seamless transitions between all sections
- 🌌 **3D animated elements** - Rotating shield object with Three.js

## 📁 Project Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.tsx        # Main landing page with hero + scroll sections
│   │   └── Dashboard.tsx       # Authenticated dashboard with risk metrics
│   ├── components/
│   │   ├── Hero.tsx           # Fullscreen hero with 3D shield
│   │   ├── Shield3D.tsx       # Three.js rotating shield component
│   │   ├── ScrollSections.tsx # Scroll-based content reveal system
│   │   ├── DemoFlow.tsx       # Interactive pipeline demo
│   │   ├── Navbar.tsx         # Smooth scrolling navbar (dashboard only)
│   │   └── MicroTrainingModal.tsx # Training modal on incident detection
│   ├── auth/
│   │   ├── Login.tsx          # Smooth floating login modal
│   │   └── RequireAuth.tsx    # Route protection (placeholder)
│   ├── App.tsx                # Main routing and app layout
│   ├── main.tsx               # Entry point
│   └── styles.css             # Global styles with Tailwind + custom CSS
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── package.json
```

## 🚀 Features & Pages

### 1. **Landing Page** (Public)
- **Hero Section**: Fullscreen immersive experience with 3D rotating shield
- **Smooth Scroll Sections**: Content reveals as you scroll
  - What We Do (3-column feature cards)
  - Adaptive Pipeline (interactive demo flow)
  - Enterprise Features (2x2 grid of capabilities)
  - Industry Results (metrics showcase)
  - CTA Footer (call-to-action section)
- **Floating Login Modal**: Smooth transition without page reload

### 2. **Dashboard** (Authenticated)
- **Real-time Metrics**: Organizational risk score, at-risk employees, campaigns, training completion
- **Employee Risk Table**: Interactive list with severity colors
- **Detail Panel**: Click employee to view expanded info
- **Campaign Status**: Progress tracking for phishing campaigns
- **Glassmorphic Design**: Floating panels with blur effects

### 3. **Micro-Training Modal**
- **3-Step Flow**: Intro → Training → Complete
- **Interactive Training**: Questions and best practices
- **Smooth Transitions**: AnimatePresence for step transitions
- **Integration Ready**: Can be triggered from dashboard or incident events

## 🎬 Animation Features

### Scroll-Based Animations
```typescript
// ScrollSections component uses:
- useScroll() for viewport tracking
- useTransform() to map scroll progress to opacity/position/scale
- Smooth staggered reveals of content
- Parallax background elements
```

### Framer Motion Animations
- **Page transitions**: Fade and scale effects on route changes
- **Button interactions**: Hover/tap animations with tactile feedback
- **Modal animations**: Smooth entrance and exit transitions
- **Floating elements**: Continuous subtle animations (float, glow, pulse)
- **Loading states**: Smooth spinner animations

### 3D Animations (Three.js)
- **Rotating shield**: Continuous rotation on X and Y axes
- **Glowing materials**: Emissive materials creating depth
- **Wireframe overlay**: Semi-transparent geometric layers
- **Lighting**: Multiple light sources for dynamic shadows

## 🛠️ Tech Stack

| Technology | Purpose | Version |
|-----------|---------|---------|
| React | UI framework | 18.2.0 |
| TypeScript | Type safety | 5.4.0 |
| Vite | Build tool | 5.0.0 |
| Framer Motion | Animations | 10.12.16 |
| Three.js | 3D graphics | 0.158.0 |
| @react-three/fiber | React integration for Three.js | 8.9.1 |
| @react-three/drei | 3D utilities | 10.7.7 |
| TailwindCSS | Utility CSS | 3.4.7 |
| React Router | Client-side routing | 6.14.1 |

## 🎯 Key Design Patterns

### 1. **Component Composition**
- Small, reusable components (Hero, DemoFlow, MetricCard, etc.)
- Props-based customization
- Responsive layouts using Tailwind

### 2. **Animation Wrapper Pattern**
```typescript
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
>
  Content
</motion.div>
```

### 3. **Glassmorphism Classes**
```typescript
className="glass" // rgba(20, 20, 30, 0.7) + blur(10px)
className="glass-dark" // rgba(10, 10, 15, 0.8) + blur(15px)
```

### 4. **Gradient Utilities**
- `.gradient-text`: Text with cyan→blue gradient
- `.gradient-glow`: Animated background glow elements
- `bg-gradient-to-r from-cyan-500 to-blue-600`: Buttons and accents

## 🎨 Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Background | #000000 | Page background |
| Glass | rgba(20, 20, 30, 0.7) | Panels with blur |
| Primary Cyan | #00d9ff | Accents, gradients |
| Primary Blue | #0099cc | Secondary gradients |
| Text Primary | #e5e5e5 | Main text |
| Text Muted | #9aa6a3 | Secondary text |
| Red/Critical | #ef4444 | High risk |
| Orange/High | #f97316 | Medium-high risk |
| Yellow/Medium | #eab308 | Medium risk |
| Green/Low | #22c55e | Low risk |

## 📱 Responsive Design

All components are fully responsive:
- **Mobile**: Single column, larger touch targets, optimized typography
- **Tablet**: 2-column layouts, balanced spacing
- **Desktop**: Full multi-column layouts, rich hover states

Tailwind breakpoints used: `sm`, `lg` for most responsive utilities.

## 🔐 Authentication Flow

1. User clicks "View Demo" → Login modal opens with smooth animation
2. Enter credentials → 1.5s simulated auth
3. On success → Smooth transition to dashboard
4. User stored in localStorage (demo only - replace with Firebase)
5. Dashboard navbar appears on scroll

## 🎓 Micro-Training System

The training modal is designed to activate after a simulated phishing click:

1. **Intro Step**: Alerts user about incident
2. **Training Step**: Provides context-specific education with Q&A
3. **Complete Step**: Shows completion and links to full course

Can be integrated with the dashboard by:
```typescript
const [showTraining, setShowTraining] = useState(false);

<MicroTrainingModal
  isOpen={showTraining}
  onClose={() => setShowTraining(false)}
  employeeName="Sarah Chen"
  incidentType="Clicked Malicious Link"
/>
```

## 🚀 Getting Started

### Installation
```bash
cd frontend
npm install
```

### Development Server
```bash
npm run dev
# Starts on http://localhost:5173
```

### Production Build
```bash
npm run build
# Output in dist/
```

### Preview Production Build
```bash
npm run preview
```

## 🔧 Customization Guide

### Change Primary Colors
Edit `styles.css` gradient definitions:
```css
.gradient-text {
  background: linear-gradient(135deg, #YOUR_COLOR_1 0%, #YOUR_COLOR_2 100%);
}
```

### Modify Animation Timing
Framer Motion components accept `transition` prop:
```typescript
transition={{ duration: 0.8, ease: "easeInOut" }}
```

### Adjust Glassmorphism Blur
Modify in `styles.css`:
```css
.glass {
  backdrop-filter: blur(10px); /* Change this value */
}
```

### Update Content Text
Edit component JSX files (Landing.tsx, Dashboard.tsx, etc.)

## 📊 Performance Considerations

1. **Code Splitting**: Large Three.js bundle is optimized
2. **Image Optimization**: Use WebP format where possible
3. **Animation Performance**: GPU-accelerated transforms (translateY, opacity, scale)
4. **Lazy Loading**: Routes load on demand with React Router

Current bundle size (gzipped): ~306 KB
- Includes all Three.js and animation libraries

## 🎬 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires support for:
- CSS Grid & Flexbox
- CSS Backdrop Filter
- WebGL (for Three.js)
- ES2020+ JavaScript

## 🔄 State Management

Currently using local React hooks for state:
- Landing: `showLogin` state
- Dashboard: `employees`, `selectedEmployee`, `isLoading`
- Auth: `localStorage` for demo

**Ready to integrate with**:
- Redux/Context API for global state
- Firebase Authentication
- Backend API calls

## 📝 Future Enhancements

1. **Backend Integration**: Connect to `/api/` endpoints for real data
2. **WebSocket Support**: Real-time risk score updates
3. **Export/Analytics**: Dashboard export to PDF
4. **Dark Mode Toggle**: Already structured to support it
5. **Localization**: i18n support ready to add
6. **Accessibility**: WCAG 2.1 AA compliance improvements
7. **PWA**: Service worker for offline support

## 💡 Pro Tips

1. **Hover states**: All buttons have smooth scale animations
2. **Loading indicators**: Use `pulse-glow` class for loading states
3. **Status colors**: Use `getStatusColor()` functions for consistency
4. **Responsive fonts**: Typography scales automatically with Tailwind
5. **Animation performance**: Use `will-change` CSS for smooth 60fps animations

## 📞 Support

This frontend is production-ready but designed as a template. Customize as needed for your specific requirements.

---

**Built with ❤️ as a premium cybersecurity product experience**
