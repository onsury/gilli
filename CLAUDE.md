# CLAUDE.md — mygully.in Context File
# Read this at the start of every session

## Project
mygully.in — India's first pincode-based neighbourhood shop directory
Built by O N Suryanarayanan, SmartDNA Business Intelligence & Advisory, Chennai
Company: Madraz Buzz Media (umbrella brand)
Email: hello@mygully.in

## Stack
- Next.js 15 + Turbopack
- Firebase App Hosting (asia-southeast1), project: gilli-app
- Firestore (default database, asia-south1)
- Firebase Phone Auth
- GitHub: onsury/gilli
- Repo: ~/gilli
- Deploy: cd ~/gilli && firebase deploy --only apphosting

## Key URLs
- Production: https://mygully.in
- Firebase Console: console.firebase.google.com/project/gilli-app
- Admin panel: mygully.in/admin (superadmin: +919566075910)
- Shop owner dashboard: mygully.in/dashboard
- Premium upgrade: mygully.in/premium?businessId=X&name=Y&phone=Z
- Invoice: mygully.in/invoice/[paymentId]

## Data
- 33,287 shops across 6 cities in Firestore businesses collection
- Cities: Chennai (16,417), Mumbai (3,555), Bangalore (4,053), Hyderabad (2,949), Delhi (4,057), Kolkata (2,256)
- Scraper scripts: C:\gully-scraper\ on Windows
- Golden Chennai shops use tel/mobile fields (not phone)
- Google Places shops use phone field

## Firestore Collections
- businesses: main shop directory
- payments: Razorpay payment records
- analytics_events: page/click tracking
- awards_nominations: Best Gully Awards
- awards_votes: nomination votes
- claim_audit: shop claim log

## Payment
- Razorpay test mode active (live approval pending 3-4 days)
- Premium listing: Rs.499/month
- Secrets stored in Firebase Secret Manager: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
- Payment flow: /premium -> create-order API -> Razorpay -> verify API -> Firestore update

## Key Files
- src/app/page.js — homepage (multi-city, 6 city tabs)
- src/app/pincode/[code]/page.js — pincode listing page
- src/app/shop/[businessId]/page.js — shop detail page
- src/app/admin/page.js — superadmin dashboard
- src/app/dashboard/page.js — shop owner dashboard
- src/app/premium/page.js — premium upgrade page
- src/app/invoice/[paymentId]/page.js — invoice page
- src/app/api/payment/create-order/route.js — Razorpay order creation
- src/app/api/payment/verify/route.js — payment verification
- src/app/api/whatsapp/route.js — WhatsApp webhook
- src/lib/analytics.js — Firestore-based analytics tracking
- src/lib/firebase-client.js — Firebase client SDK
- src/lib/firebase-admin.js — Firebase Admin SDK
- src/lib/cities.js — cityFromPincode() helper
- firestore.rules — security rules
- apphosting.yaml — Firebase App Hosting config with secrets

## Design System
- Font: Playfair Display (headings) + Arial/Inter (body)
- Primary color: #e85d26 (orange)
- Background: #faf9f6 (warm off-white)
- Dark: #1a1a1a
- Brand line: "Real People | Real Conversations"
- Admin dashboard: dark theme (#0f0f0f background)
- No border-radius on inputs/buttons (editorial aesthetic)

## Important Decisions
- Phone numbers: mobile -> WhatsApp button, landline -> Call button, none -> Claim listing
- isMobile() handles leading zeros and country codes
- Golden Chennai records: phone stored as tel/mobile fields
- Analytics: write-only from client, read via admin SDK
- Payments: write via backend only, read by authenticated phone users
- No shop counts shown on homepage (decision: not important)
- SmartDNA removed from all pages (company not yet registered)
- Madraz Buzz Media is the registered entity for mygully.in

## Pending
- Razorpay live keys (approval in 3-4 days)
- Meta WhatsApp Business API activation
- Twilio call bridging for landline shops
- Invoice WhatsApp auto-delivery
- KVB Madraz Buzz Media account revival
- Billing account cleanup (8 accounts, consolidate)
- gilli-app project should be linked to O N Suryanarayanan billing account (01E700)
- Currently on Firebase Payment billing account (01E267) — switch needed

## Content
- Sri Murugan Departmental Stores videos uploaded to YouTube
- Sri Abirami Fresh Greens (Deva) video pending
- Launch post drafted: launch_copy.md
- Heritage articles: /chennai (Ten Names), /chennai/vyasarpadi
