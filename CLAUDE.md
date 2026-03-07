GULLY + GILLI PLATFORM
Project Overview
Gully/Gilli is a hyperlocal news and commerce platform for Chennai,
organised by pincode. The web app is live. The platform has two layers:

Gully — hyperlocal neighbourhood news, curated by pincode
Gilli — WhatsApp-based local commerce for Chennai neighbourhood shops

Tech Stack

Framework: Next.js 16.1.6 (App Router) with Turbopack
Frontend: React, single-file component (GullyHome.jsx)
Backend: Firebase (Firestore, Firebase Auth, Cloud Functions)
Database: Firebase Data Connect (GraphQL schema in /dataconnect)
APIs: WhatsApp Webhook, News Curation API
Billing: Excel/Tally/Busy/Marg/Vyapar parser (bill-generator.js)
Deployment: Firebase App Hosting (apphosting.yaml) + Vercel config present
Environment: .env.local for all secrets

File Structure
/src
  /app
    page.js                        ← Main entry point
    layout.js                      ← Root layout
    globals.css
    /api
      /curate-news/route.js        ← News curation API endpoint
      /webhook/route.js            ← WhatsApp webhook endpoint
  /components
    GullyHome.jsx                  ← ENTIRE frontend — single component file
  /lib
    firebase.js                    ← Firebase server-side config
    firebase-client.js             ← Firebase client-side config
    useFeed.js                     ← News feed hook
    whatsapp.js                    ← WhatsApp integration logic
    config.js                      ← Global config (pincodes, constants)
    /billing
      bill-generator.js            ← Billing output generator
    /parsers
      excel-parser.js              ← Parses Busy/Marg/Tally/Vyapar exports
    /handlers
      router.js                    ← WhatsApp message router
/dataconnect
  schema/schema.gql                ← Data Connect GraphQL schema
  seed_data.gql                    ← Seed data
.idx/dev.nix                       ← Firebase Studio environment config
.idx/mcp.json                      ← MCP server config (Firebase tools)
firebase.json                      ← Firebase project config
apphosting.yaml                    ← Firebase App Hosting config
.env.local                         ← All secrets — DO NOT MODIFY
Current Status
COMPLETE ✅

Web app fully live and running on Firebase App Hosting
Pincode selector — all Chennai pincodes mapped with area names
Gully news feed — displays neighbourhood news by pincode
Ads section — working on the web app
Header with date display (hydration fix applied 07-03-2026)
WhatsApp webhook endpoint — route exists at /api/webhook
News curation API — endpoint exists at /api/curate-news
Billing parsers — Excel, Tally, Busy, Marg, Vyapar import logic built
Firebase Data Connect schema — defined

IN PROGRESS 🔄

WhatsApp news delivery — webhook exists but Gully news content
is NOT yet being pushed to WhatsApp users
This is the #1 current priority

NOT STARTED ❌

WhatsApp news broadcast by pincode — user subscribes to their
pincode, receives daily Gully news digest on WhatsApp
Shop listings on web — local shops browsable by pincode
Commerce features — shop catalogue, ordering via WhatsApp
Billing software integration — shops upload Busy/Tally exports
to auto-generate WhatsApp catalogue
User registration/login flow
Admin panel for news curation

Decisions Already Made

Single component architecture — GullyHome.jsx holds all UI
Firebase App Hosting for deployment — NOT Vercel (ignore vercel config)
WhatsApp as the commerce and news delivery channel — not a native app
Pincode-first architecture — all content and commerce is pincode-scoped
No Gemini/AI coding — Claude Code only via Claude Max
Data Connect for structured data — not raw Firestore for shop/product data

Do Not Touch ⛔

.env.local — never modify or expose
/dataconnect/schema/schema.gql — confirm before any schema changes
firebase.json and apphosting.yaml — deployment config is stable
/src/lib/billing/ — parsers are complete, do not refactor

Next 3 Priorities

WhatsApp News Delivery — when a user sends a message to the
Gilli WhatsApp number with their pincode, they should receive
today's Gully news digest for that pincode
WhatsApp Pincode Subscription — users can subscribe to daily
news for their pincode via WhatsApp keyword
Shop Listings Web View — display local shops by pincode
on the web app as a directory

How to Run
bash# Kill any existing instance first
pkill -f "next dev"

# Start dev server
npm run dev

# App runs on http://localhost:3000
Known Issues

Hydration error on date display — FIXED 07-03-2026 (useState/useEffect)
Cross-origin warning in Firebase Studio preview — harmless, ignore
Vercel config present but deployment target is Firebase App Hosting

Session Resume Prompt
Paste this at the start of every Claude Code session:
"Read CLAUDE.md. We are resuming Gilli platform build.
Current priority: [STATE WHAT YOU ARE WORKING ON TODAY]"