# Behaviour-Adaptive Spear Phishing — Frontend (Admin)

This README documents quick setup and run steps for the research-grade demo frontend. It assumes a local Node 18+ environment.

Prerequisites
- Node 18 or newer (nvm recommended)
- npm (bundled with Node) or an alternative package manager

Install and run (local dev)
```bash
cd frontend
# start from a clean state if needed
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

Demo credentials (hardcoded for internal demo only)
- `admin@example.com` / `DemoPass123`
- `owner@example.com` / `DemoPass123`

Notes
- This frontend uses a small, demo-safe Firebase shim (`src/firebase.ts`) and a mocked backend client (`src/api/client.ts`). No real emails or external services are invoked.
- Versions in `package.json` are intentionally pinned to known-working releases for reproducible research. If you update packages, validate the app on Node 18+ before presenting.

Troubleshooting
- If `npm` is not found: install Node (Homebrew or nvm recommended):
  - `brew install node`  OR
  - `curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash` then `nvm install --lts`
- If `npm install` fails: open the npm debug log referenced in the error (example):
  - `cat /Users/<your-username>/.npm/_logs/<timestamp>-debug-0.log`
  Paste the last ~100 lines when asking for help.
- Temporary dev server run without local install (not a substitute for a clean install):
  - `npx vite` (uses remote runner if needed)

Where to look
- Demo auth shim: `src/firebase.ts`
- Mock API: `src/api/client.ts` (replace with real backend calls when ready)
- Main entry: `src/main.tsx` and `src/App.tsx`

If you want, I can also add a simple Git commit and a branch with these frontend files.
