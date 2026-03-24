# dashboard module context
# Auto-loaded by Windsurf when editing files in apps/dashboard/

## Purpose
Next.js 15 human oversight dashboard. Shows agent payments, spend controls, pending approvals.

## Key Rules
- Next.js 15 App Router — all pages in app/, all API routes in app/api/*/route.ts
- DB access: import from `@swigpay/agent-wallet` (workspace package) — never import better-sqlite3 directly
- Polling: 5-second setInterval in useEffect for live transaction feed
- No external API calls from frontend — all Solana/DB data via /api/ routes
- Tailwind CSS only — no CSS modules, no inline styles
- Dark theme: bg-gray-950 base, green accents for confirmed, yellow for pending, red for rejected

## API Routes
- GET /api/agents — agent config + payment history
- GET /api/transactions — all payments, ?pending=true for pending only
- POST /api/approve — { id, action: "approve"|"reject" }

## Component Pattern
- "use client" directive on interactive components (polling, buttons)
- Server components for static layouts
- Keep each component under 150 lines
