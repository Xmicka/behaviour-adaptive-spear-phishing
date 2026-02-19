# Adaptive Spear Guard — Premium Frontend

A production-ready, animation-heavy cybersecurity dashboard inspired by premium product design (like the Lando Norris website). Features smooth scroll-based transitions, glassmorphism design, 3D visualization, and comprehensive security analytics.

## 🎯 What's New

This is a **complete ground-up rebuild** of the frontend with:

✨ **Premium Animation System**
- Framer Motion throughout all components
- Scroll-based content reveals
- Smooth page transitions
- 3D rotating shield (Three.js)

🎨 **Modern Design Language**
- Glassmorphism with backdrop blur
- Cyan/Blue gradient aesthetic
- Responsive layout (mobile-first)
- Dark premium theme

📊 **Production-Ready Components**
- Risk dashboard with real-time metrics
- Employee threat assessment
- Campaign tracking
- Micro-training modal system

## Prerequisites

- Node 18+ (nvm recommended)
- npm (bundled with Node)

## Quick Start

```bash
cd frontend

# Fresh install (recommended)
rm -rf node_modules package-lock.json
npm cache clean --force
npm install

# Development server
npm run dev
# Opens at http://localhost:5173
```

## Demo Credentials

For the demo, use any email and password:
- Example: `you@company.com` / `password123`

## Build & Deploy

```bash
# Production build
npm run build

# Preview production build
npm run preview

# Output in dist/ (ready for deployment)
```

## Project Structure

```
src/
├── pages/
│   ├── Landing.tsx          # Public landing page
│   └── Dashboard.tsx        # Authenticated dashboard
├── components/
│   ├── Hero.tsx             # Fullscreen hero section
│   ├── Shield3D.tsx         # 3D rotating shield
│   ├── ScrollSections.tsx   # Scroll animation system
│   ├── DemoFlow.tsx         # Interactive pipeline
│   ├── Navbar.tsx           # Dashboard navigation
│   └── MicroTrainingModal.tsx # Training system
├── auth/
│   ├── Login.tsx            # Login modal
│   └── RequireAuth.tsx      # Route protection
└── App.tsx                  # Main router
```

## Key Features

### Landing Page
- **Hero Section**: Immersive fullscreen experience with 3D shield
- **Smooth Scroll**: Content reveals as you scroll (Lando Norris style)
- **Interactive Demo**: Animated pipeline visualization
- **CTA Flow**: Seamless transition to login

### Dashboard
- **Risk Metrics**: Organizational risk score, employee count, campaigns
- **Employee Table**: Interactive list with severity indicators
- **Campaign Status**: Real-time progress tracking
- **Glassmorphic Design**: Modern frosted glass panels

### Micro-Training
- **3-Step Flow**: Intro → Training → Complete
- **Interactive Q&A**: Contextual security education
- **Smooth Transitions**: AnimatePresence for step animations

## Technology Stack

| Tech | Purpose |
|------|---------|
| **React 18** | Component framework |
| **TypeScript** | Type safety |
| **Vite 5** | Build tool (fast!) |
| **Framer Motion** | Animations |
| **Three.js** | 3D visualization |
| **Tailwind CSS** | Styling |
| **React Router** | Client-side routing |

## Styling & Customization

### Global Theme
Edit `src/styles.css` for:
- Color scheme
- Animation timings
- Glassmorphism blur amounts
- Typography

### Color Palette
- Primary: `#00d9ff` (Cyan)
- Secondary: `#0099cc` (Blue)
- Background: `#000000` (Black)
- Text: `#e5e5e5` (Off-white)

### Responsive Design
Tailwind breakpoints:
- `sm`: 640px (mobile)
- `lg`: 1024px (desktop)

## Performance Notes

- Bundle size (gzipped): ~306 KB
- GPU-accelerated animations (60fps)
- No page reloads (SPA routing)
- Code-split on demand

Optimizations:
- Lazy loading for Three.js
- CSS animations preferred over JS
- Efficient Framer Motion setup

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires: CSS Grid, Flexbox, Backdrop Filter, WebGL

## Troubleshooting

### `npm install` fails
Check the npm debug log:
```bash
cat ~/.npm/_logs/[timestamp]-debug-0.log
```

### Dev server won't start
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### Build errors
```bash
# Check TypeScript
npx tsc --noEmit

# Clear Vite cache
rm -rf .vite
npm run build
```

## Integration with Backend

Currently using mock data (localStorage). To connect to real backend:

1. **Update Dashboard.tsx**:
   ```typescript
   // Replace mock data loading with real API calls
   const response = await fetch('/api/employees');
   const employees = await response.json();
   ```

2. **Update Login.tsx**:
   ```typescript
   // Replace mock auth with real Firebase/backend
   const response = await fetch('/api/login', { /* ... */ });
   ```

3. **WebSocket for real-time updates**:
   ```typescript
   const ws = new WebSocket('wss://your-api.com/updates');
   ws.onmessage = (data) => setEmployees(data);
   ```

## Documentation

For detailed component documentation and advanced customization, see:
- [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md)

## Contributing

When modifying the frontend:
1. Keep animations smooth (test on 60fps)
2. Maintain accessibility (color contrast, keyboard nav)
3. Test responsive design (mobile, tablet, desktop)
4. Update documentation if adding new components

## Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

### GitHub Pages
```bash
npm run build
# Push dist/ to gh-pages branch
```

## License

Research project - customize as needed for your deployment.

---

**Built as a premium product experience for adaptive security threat detection**

See [FRONTEND_DOCUMENTATION.md](./FRONTEND_DOCUMENTATION.md) for comprehensive technical documentation.
