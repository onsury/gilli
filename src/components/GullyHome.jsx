'use client';

import { useState, useEffect, useRef } from "react";
import { useFeed } from '../lib/useFeed';

// ═══════════════════════════════════════════════════════════════
// GULLY — Chennai's Neighbourhood News Platform
// Drop this file into: src/components/GullyHome.jsx
// ═══════════════════════════════════════════════════════════════

const CHENNAI_PINCODES = [
  { code: "600001", area: "George Town", zone: "North" },
  { code: "600002", area: "Egmore", zone: "Central" },
  { code: "600003", area: "Park Town", zone: "Central" },
  { code: "600004", area: "Mylapore", zone: "South" },
  { code: "600005", area: "Triplicane", zone: "Central" },
  { code: "600006", area: "Kilpauk", zone: "Central" },
  { code: "600007", area: "Vepery", zone: "Central" },
  { code: "600008", area: "Chetpet", zone: "Central" },
  { code: "600010", area: "Perambur", zone: "North" },
  { code: "600011", area: "Ayanavaram", zone: "North" },
  { code: "600012", area: "Perambur Barracks", zone: "North" },
  { code: "600014", area: "Nandanam", zone: "South" },
  { code: "600015", area: "Kotturpuram", zone: "South" },
  { code: "600017", area: "T. Nagar", zone: "South" },
  { code: "600018", area: "Kodambakkam", zone: "West" },
  { code: "600020", area: "Adyar", zone: "South" },
  { code: "600024", area: "Guindy", zone: "South" },
  { code: "600028", area: "Saidapet", zone: "South" },
  { code: "600033", area: "West Mambalam", zone: "South" },
  { code: "600034", area: "Ashok Nagar", zone: "West" },
  { code: "600035", area: "ICF Colony", zone: "North" },
  { code: "600036", area: "Velachery", zone: "South" },
  { code: "600040", area: "Velachery East", zone: "South" },
  { code: "600042", area: "Nungambakkam", zone: "Central" },
  { code: "600044", area: "Chromepet", zone: "South" },
  { code: "600045", area: "Pallavaram", zone: "South" },
  { code: "600050", area: "Alwarpet", zone: "South" },
  { code: "600053", area: "Shenoy Nagar", zone: "Central" },
  { code: "600059", area: "Besant Nagar", zone: "South" },
  { code: "600078", area: "Porur", zone: "West" },
  { code: "600083", area: "Perungudi", zone: "South" },
  { code: "600086", area: "Mambalam", zone: "South" },
  { code: "600088", area: "Vadapalani", zone: "West" },
  { code: "600092", area: "Medavakkam", zone: "South" },
  { code: "600093", area: "Neelankarai", zone: "South" },
  { code: "600095", area: "Sholinganallur", zone: "South" },
  { code: "600096", area: "Palavakkam", zone: "South" },
  { code: "600097", area: "Thoraipakkam", zone: "South" },
  { code: "600100", area: "Tambaram", zone: "South" },
  { code: "600107", area: "Koyambedu", zone: "West" },
  { code: "600113", area: "Ambattur", zone: "North" },
  { code: "600116", area: "Anna Nagar", zone: "West" },
  { code: "600117", area: "Anna Nagar West", zone: "West" },
  { code: "600118", area: "Mogappair", zone: "North" },
  { code: "600119", area: "Thirumangalam", zone: "West" },
];

const CATEGORIES = [
  { id: "all", label: "All Stories", icon: "📰" },
  { id: "temple", label: "Temple", icon: "🏛️" },
  { id: "food", label: "Food", icon: "🍛" },
  { id: "safety", label: "Safety", icon: "🚨" },
  { id: "business", label: "Business", icon: "💼" },
  { id: "education", label: "Education", icon: "📚" },
  { id: "politics", label: "Politics", icon: "🏛" },
  { id: "culture", label: "Culture", icon: "🎭" },
  { id: "sports", label: "Sports", icon: "🏏" },
  { id: "health", label: "Health", icon: "🏥" },
  { id: "tech", label: "Tech", icon: "💻" },
  { id: "cinema", label: "Cinema", icon: "🎬" },
  { id: "classifieds", label: "Classifieds", icon: "📋" },
];

const FEED = [
  {
    id: 1, type: "temple",
    title: "Kapaleeshwarar Temple — Where Shiva Dances in Stone",
    summary: "Built by the Pallavas in the 7th century, this Mylapore masterpiece survived Portuguese destruction and was rebuilt by the Vijayanagara kings. Every stone tells a story of resilience. The annual Panguni Brahmotsavam draws over 500,000 devotees across 10 days.",
    pincodes: ["600004"], area: "Mylapore", category: "temple",
    engagement: { views: 12400, shares: 340 }, publishedAt: "2 hours ago",
    source: "Gully Heritage Desk", templeOfDay: true, featured: true,
  },
  {
    id: 2, type: "article",
    title: "Metro Phase 2 Tunnelling Hits Hard Rock Near T. Nagar — Diversions from Monday",
    summary: "CMRL announces week-long diversions on Usman Road as tunnel boring machine encounters unexpected rock formation at 18m depth. Alternate routes via Thyagaraya Road and South Usman Road.",
    pincodes: ["600017", "600033"], area: "T. Nagar", category: "business",
    engagement: { views: 8900, shares: 520 }, publishedAt: "45 min ago",
    source: "The Hindu", breaking: true,
  },
  {
    id: 3, type: "deal",
    title: "Grand Opening: Farm-to-Table Organic Store in Adyar",
    summary: "NatureBowl opens its third Chennai outlet on Kasturba Nagar Main Road. First 100 customers get 30% off cold-pressed oils. Weekend tasting sessions every Saturday 10 AM.",
    pincodes: ["600020"], area: "Adyar", category: "food",
    engagement: { views: 3200, shares: 89 }, publishedAt: "1 hour ago",
    source: "Gilli Partner", gilliDeal: true, sponsored: true,
  },
  {
    id: 4, type: "alert",
    title: "Water Supply Disruption in Velachery — Restoration by 6 PM",
    summary: "Chennai Metro Water reports emergency pipeline repair on 100 Feet Road. Affected: Velachery main road, Vijayanagar, parts of Taramani. Water tanker requests: 044-2538-4530.",
    pincodes: ["600040", "600036"], area: "Velachery", category: "safety",
    engagement: { views: 6700, shares: 890 }, publishedAt: "30 min ago",
    source: "Chennai Metro Water", urgent: true,
  },
  {
    id: 5, type: "article",
    title: "Sowcarpet's 200-Year-Old Jain Sweet Shop Gets Heritage Tag",
    summary: "Tamil Nadu Heritage Commission recognises Lalitha Sweets on Mint Street for its unbroken 7-generation legacy of making pure ghee Mysore Pak using wood-fired copper vessels.",
    pincodes: ["600001"], area: "George Town", category: "culture",
    engagement: { views: 15600, shares: 1200 }, publishedAt: "3 hours ago",
    source: "Dinamalar",
  },
  {
    id: 6, type: "article",
    title: "IIT Madras Startup Raises ₹50 Crore for AI-Powered Water Purification",
    summary: "AquaNeural, incubated at IITM Research Park, secures Series A from Sequoia India. Plans to deploy smart purification units across 500 Chennai corporation schools by 2027.",
    pincodes: ["600024"], area: "Guindy", category: "tech",
    engagement: { views: 9800, shares: 670 }, publishedAt: "4 hours ago",
    source: "ET Chennai",
  },
  {
    id: 7, type: "video",
    title: "Watch: Koyambedu Flower Market at Dawn — ₹2 Crore Changes Hands Before Sunrise",
    summary: "A stunning 3-minute documentary capturing the chaos and beauty of India's largest wholesale flower market. 5,000 tonnes of jasmine, roses, and marigolds traded daily.",
    pincodes: ["600107"], area: "Koyambedu", category: "culture",
    engagement: { views: 22000, shares: 3400 }, publishedAt: "5 hours ago",
    source: "Gully Films", hasVideo: true,
  },
  {
    id: 8, type: "article",
    title: "Perambur Railway Workshop Turns 100 — The Neighbourhood That Built India's Trains",
    summary: "A century of locomotive manufacturing in North Chennai. How this workshop shaped an entire neighbourhood's identity, economy, schools, and culture around the rhythm of the railways.",
    pincodes: ["600010", "600011"], area: "Perambur", category: "culture",
    engagement: { views: 7300, shares: 410 }, publishedAt: "6 hours ago",
    source: "Gully Heritage Desk",
  },
  {
    id: 9, type: "deal",
    title: "Dosa Festival at Murugan Idli — 12 Varieties, ₹99 Unlimited This Weekend",
    summary: "Anna Nagar's legendary breakfast spot celebrates 15th anniversary. Unlimited dosa festival: ghee roast, paneer, cheese, mushroom, and 8 more. Saturday-Sunday 7 AM to 12 PM.",
    pincodes: ["600116"], area: "Anna Nagar", category: "food",
    engagement: { views: 18500, shares: 2100 }, publishedAt: "1 hour ago",
    source: "Gilli Partner", gilliDeal: true, sponsored: true,
  },
  {
    id: 10, type: "article",
    title: "Corporation Schools in Ambattur Get Smart Boards — 45 Schools Upgraded",
    summary: "Chennai Corporation completes Phase 1 of digital classroom initiative. Students in Ambattur, Kolathur, and Villivakkam zones now have interactive SMART boards with Tamil and English content.",
    pincodes: ["600113"], area: "Ambattur", category: "education",
    engagement: { views: 5400, shares: 230 }, publishedAt: "7 hours ago",
    source: "News Today",
  },
  {
    id: 11, type: "article",
    title: "Besant Nagar Beach Promenade Extension — New 1.2 km Walkway Opens Friday",
    summary: "Extended Elliot's Beach walkway connects to Broken Bridge with landscaped seating, dedicated cycling track, 12 food kiosks, and solar-powered lighting. Evening inauguration ceremony.",
    pincodes: ["600059", "600020"], area: "Besant Nagar", category: "business",
    engagement: { views: 11200, shares: 780 }, publishedAt: "3 hours ago",
    source: "The New Indian Express",
  },
  {
    id: 12, type: "article",
    title: "CSK Announces Free Cricket Coaching at Chepauk — Registration Open for Ages 8-16",
    summary: "CSK Foundation partners with TNCA for summer coaching camps. Training by CSK academy coaches at M.A. Chidambaram Stadium nets. Limited to 200 slots per batch. Gear provided free.",
    pincodes: ["600005"], area: "Chepauk", category: "sports",
    engagement: { views: 28700, shares: 4500 }, publishedAt: "2 hours ago",
    source: "Sportstar",
  },
  {
    id: 13, type: "article",
    title: "Mogappair Residents Win 3-Year Fight Against Illegal Cell Tower on School Premises",
    summary: "Madras High Court orders removal of telecom tower within 200m of Mogappair primary school after residents' persistent legal battle. Sets precedent for 14 similar cases across Chennai.",
    pincodes: ["600118"], area: "Mogappair", category: "politics",
    engagement: { views: 8100, shares: 920 }, publishedAt: "4 hours ago",
    source: "Dinamani",
  },
  {
    id: 14, type: "article",
    title: "Nungambakkam's Hidden Gem: 90-Year-Old Siddha Practitioner Still Sees 40 Patients a Day",
    summary: "Dr. Ramasamy Vaidyar of Nungambakkam High Road has been practising traditional Siddha medicine since 1962. His clinic has no signboard — patients find him through word of mouth alone.",
    pincodes: ["600042"], area: "Nungambakkam", category: "health",
    engagement: { views: 6200, shares: 380 }, publishedAt: "5 hours ago",
    source: "Gully People",
  },
  {
    id: 15, type: "article",
    title: "Vadapalani Flyover Work Enters Final Phase — Expected Completion by April",
    summary: "The long-delayed Vadapalani-Koyambedu elevated corridor enters its last 60 days of construction. Traffic restrictions continue on Arcot Road between 10 PM and 6 AM.",
    pincodes: ["600088", "600107"], area: "Vadapalani", category: "business",
    engagement: { views: 7800, shares: 310 }, publishedAt: "6 hours ago",
    source: "Times of India",
  },
];

const TICKER = [
  "🚨 Water cut in Velachery — restoration by 6 PM",
  "🏛️ Temple of the Day: Kapaleeshwarar Temple, Mylapore",
  "🚇 Metro Phase 2: T. Nagar diversions from Monday",
  "🏏 CSK free coaching at Chepauk — register now",
  "🍛 Dosa Festival at Murugan Idli, Anna Nagar — ₹99 unlimited",
  "🎓 45 Corporation schools in Ambattur get SMART boards",
  "🏖️ Besant Nagar promenade extension opens Friday",
  "💰 IIT-M startup AquaNeural raises ₹50 Cr Series A",
  "⚖️ Mogappair wins cell tower case — HC sets precedent",
  "🏗️ Vadapalani flyover enters final phase — April completion",
];

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: "#FAF7F2", bgDark: "#1A1612", card: "#FFFFFF",
  accent: "#D4541B", gold: "#C8912E", teal: "#1B7A6E", plum: "#6B2D5B",
  text: "#1A1612", muted: "#6B635A", light: "#9C9488",
  border: "#E8E2D8", borderL: "#F0EBE3",
  red: "#C62828", orange: "#E65100",
  gilli: "#1B7A6E", gilliL: "#E8F5F1",
  templeGold: "#F9F3E3", templeBdr: "#C8912E",
  alertBg: "#FFF3E0", alertBdr: "#E65100",
};

const catColors = {
  culture: C.plum, tech: C.teal, education: "#1565C0", business: C.accent,
  sports: "#2E7D32", food: C.gold, health: "#C62828", politics: "#4527A0",
  cinema: "#AD1457", safety: C.orange, temple: C.gold, classifieds: "#5D4037",
};

const f = {
  serif: "'Playfair Display', Georgia, serif",
  sans: "'Source Sans 3', 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', 'Courier New', monospace",
};

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div style={{ background: C.bgDark, color: "#FFF", overflow: "hidden", height: 36, display: "flex", alignItems: "center", borderBottom: `2px solid ${C.accent}` }}>
      <div style={{ background: C.accent, color: "#FFF", padding: "0 14px", height: "100%", display: "flex", alignItems: "center", fontFamily: f.sans, fontWeight: 700, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", zIndex: 2, whiteSpace: "nowrap", flexShrink: 0 }}>
        CHENNAI NOW
      </div>
      <div style={{ overflow: "hidden", flex: 1 }}>
        <div style={{ display: "flex", gap: 60, animation: "ticker 45s linear infinite", whiteSpace: "nowrap", paddingLeft: 20 }}>
          {items.map((t, i) => <span key={i} style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.9 }}>{t}</span>)}
        </div>
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0) } 100% { transform: translateX(-50%) } }`}</style>
    </div>
  );
}

function Header({ pincode, setPincode, setDrawer }) {
  const pc = CHENNAI_PINCODES.find(p => p.code === pincode);
  return (
    <header style={{ background: C.bg, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontFamily: f.serif, fontSize: 32, fontWeight: 800, color: C.text, letterSpacing: "-0.02em" }}>Gully</span>
          <span style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: "0.15em", textTransform: "uppercase" }}>Chennai</span>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontFamily: f.sans, fontSize: 11, color: C.light, letterSpacing: "0.05em" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </div>
          <div style={{ fontFamily: f.serif, fontSize: 12, fontStyle: "italic", color: C.muted }}>Your Neighbourhood. Your News.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setDrawer(true)} style={{ background: pincode ? C.teal : "transparent", color: pincode ? "#FFF" : C.text, border: `1.5px solid ${pincode ? C.teal : C.border}`, borderRadius: 20, padding: "6px 14px", fontFamily: f.sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            📍 {pc ? pc.area : "All Chennai"}
          </button>
          <a href="https://wa.me/919999999999?text=Hi%20Gilli" target="_blank" rel="noopener noreferrer" style={{ background: C.gilli, color: "#FFF", border: "none", borderRadius: 20, padding: "6px 14px", fontFamily: f.sans, fontSize: 13, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
            🏏 Gilli
          </a>
        </div>
      </div>
    </header>
  );
}

function CatBar({ active, setActive }) {
  return (
    <div style={{ background: C.bg, borderBottom: `1px solid ${C.borderL}`, position: "sticky", top: 68, zIndex: 99 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 20px", display: "flex", gap: 6, overflowX: "auto", scrollbarWidth: "none" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActive(c.id)} style={{
            background: active === c.id ? C.bgDark : "transparent",
            color: active === c.id ? "#FFF" : C.muted,
            border: `1px solid ${active === c.id ? C.bgDark : C.borderL}`,
            borderRadius: 18, padding: "5px 13px", fontFamily: f.sans, fontSize: 12,
            fontWeight: active === c.id ? 600 : 500, cursor: "pointer", whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 4, transition: "all 0.2s",
          }}>
            <span style={{ fontSize: 13 }}>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── CARD COMPONENTS ───

function TempleCard({ item }) {
  return (
    <article style={{ background: `linear-gradient(135deg, ${C.templeGold}, #FFF8E8)`, border: `1.5px solid ${C.templeBdr}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", gridColumn: "1 / -1" }}>
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <div style={{ width: 260, minHeight: 200, background: `linear-gradient(135deg, ${C.gold}22, ${C.gold}44)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}>
          <span style={{ fontSize: 72, opacity: 0.5 }}>🏛️</span>
          <div style={{ position: "absolute", bottom: 10, left: 12, background: C.gold, color: "#FFF", padding: "3px 10px", borderRadius: 10, fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Temple of the Day</div>
        </div>
        <div style={{ padding: "20px 24px", flex: 1, minWidth: 280 }}>
          <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, color: C.gold, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>📍 {item.area} • {item.pincodes[0]}</div>
          <h2 style={{ fontFamily: f.serif, fontSize: 22, fontWeight: 700, color: C.text, margin: "0 0 10px", lineHeight: 1.3 }}>{item.title}</h2>
          <p style={{ fontFamily: f.sans, fontSize: 15, color: C.muted, lineHeight: 1.6, margin: 0 }}>{item.summary}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 12, fontFamily: f.sans, fontSize: 12, color: C.light }}>
            <span>{item.source}</span><span>•</span><span>{item.publishedAt}</span><span>•</span><span>{(item.engagement.views/1000).toFixed(1)}k views</span>
          </div>
        </div>
      </div>
    </article>
  );
}

function BreakingCard({ item }) {
  return (
    <article style={{ background: "#FFF", border: `2px solid ${C.red}`, borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ background: C.red, color: "#FFF", padding: "4px 12px", fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ animation: "pulse 1.5s infinite", width: 6, height: 6, borderRadius: "50%", background: "#FFF", display: "inline-block" }} /> BREAKING
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, color: C.accent, marginBottom: 6 }}>📍 {item.area} • {item.pincodes.join(", ")}</div>
        <h3 style={{ fontFamily: f.serif, fontSize: 18, fontWeight: 700, color: C.text, margin: "0 0 8px", lineHeight: 1.3 }}>{item.title}</h3>
        <p style={{ fontFamily: f.sans, fontSize: 14, color: C.muted, lineHeight: 1.5, margin: 0 }}>{item.summary}</p>
        <div style={{ display: "flex", gap: 10, marginTop: 10, fontFamily: f.sans, fontSize: 11, color: C.light }}>
          <span>{item.source}</span><span>•</span><span>{item.publishedAt}</span><span>•</span><span>{item.engagement.shares} shares</span>
        </div>
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>
    </article>
  );
}

function DealCard({ item }) {
  return (
    <article style={{ background: C.gilliL, border: `1.5px solid ${C.gilli}33`, borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, color: C.gilli }}>🏏 Gilli Deal • {item.area}</span>
          <span style={{ background: C.gilli, color: "#FFF", padding: "2px 8px", borderRadius: 8, fontFamily: f.sans, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>Sponsored</span>
        </div>
        <h3 style={{ fontFamily: f.serif, fontSize: 17, fontWeight: 600, color: C.text, margin: "0 0 6px", lineHeight: 1.3 }}>{item.title}</h3>
        <p style={{ fontFamily: f.sans, fontSize: 14, color: C.muted, lineHeight: 1.5, margin: 0 }}>{item.summary}</p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
          <span style={{ fontFamily: f.sans, fontSize: 11, color: C.light }}>{item.engagement.views.toLocaleString()} views</span>
          <button style={{ background: C.gilli, color: "#FFF", border: "none", borderRadius: 16, padding: "6px 14px", fontFamily: f.sans, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Order via Gilli →</button>
        </div>
      </div>
    </article>
  );
}

function AlertCard({ item }) {
  return (
    <article style={{ background: C.alertBg, border: `1.5px solid ${C.alertBdr}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18 }}>🚨</span>
        <span style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, color: C.alertBdr, letterSpacing: "0.06em", textTransform: "uppercase" }}>Alert • {item.area} • {item.pincodes.join(", ")}</span>
      </div>
      <h3 style={{ fontFamily: f.sans, fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 4px" }}>{item.title}</h3>
      <p style={{ fontFamily: f.sans, fontSize: 13, color: C.muted, lineHeight: 1.5, margin: 0 }}>{item.summary}</p>
      <div style={{ fontFamily: f.sans, fontSize: 11, color: C.light, marginTop: 8 }}>{item.source} • {item.publishedAt}</div>
    </article>
  );
}

function VideoCard({ item }) {
  return (
    <article style={{ background: "#000", borderRadius: 12, overflow: "hidden", cursor: "pointer" }}>
      <div style={{ height: 170, background: "linear-gradient(135deg, #1a1a2e, #16213e)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(4px)" }}>
          <span style={{ fontSize: 22, marginLeft: 3, color: "#FFF" }}>▶</span>
        </div>
        <div style={{ position: "absolute", top: 10, left: 10, background: C.accent, color: "#FFF", padding: "2px 8px", borderRadius: 6, fontFamily: f.sans, fontSize: 10, fontWeight: 700 }}>VIDEO</div>
        <div style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(0,0,0,0.7)", color: "#FFF", padding: "2px 8px", borderRadius: 6, fontFamily: f.mono, fontSize: 11 }}>3:12</div>
      </div>
      <div style={{ padding: "12px 16px", background: "#111" }}>
        <h3 style={{ fontFamily: f.serif, fontSize: 16, fontWeight: 600, color: "#FFF", margin: "0 0 4px", lineHeight: 1.3 }}>{item.title}</h3>
        <div style={{ fontFamily: f.sans, fontSize: 12, color: "rgba(255,255,255,0.5)", display: "flex", gap: 8 }}>
          <span>{item.source}</span><span>•</span><span>{(item.engagement.views/1000).toFixed(1)}k views</span>
        </div>
      </div>
    </article>
  );
}

function StdCard({ item }) {
  const cc = catColors[item.category] || C.accent;
  return (
    <article style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = cc}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ background: cc + "18", color: cc, padding: "3px 10px", borderRadius: 10, fontFamily: f.sans, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {CATEGORIES.find(c => c.id === item.category)?.icon} {item.category}
          </span>
          <span style={{ fontFamily: f.sans, fontSize: 11, color: C.light }}>📍 {item.area}</span>
        </div>
        <h3 style={{ fontFamily: f.serif, fontSize: 17, fontWeight: 600, color: C.text, margin: "0 0 6px", lineHeight: 1.3 }}>{item.title}</h3>
        <p style={{ fontFamily: f.sans, fontSize: 14, color: C.muted, lineHeight: 1.5, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{item.summary}</p>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: f.sans, fontSize: 11, color: C.light }}>
          <span>{item.source} • {item.publishedAt}</span>
          <span>{(item.engagement.views/1000).toFixed(1)}k • ↗ {item.engagement.shares}</span>
        </div>
      </div>
    </article>
  );
}

function Card({ item }) {
  if (item.templeOfDay) return <TempleCard item={item} />;
  if (item.breaking) return <BreakingCard item={item} />;
  if (item.gilliDeal) return <DealCard item={item} />;
  if (item.urgent) return <AlertCard item={item} />;
  if (item.hasVideo) return <VideoCard item={item} />;
  return <StdCard item={item} />;
}

// ─── SIDEBAR ───

function GilliSidebar() {
  const deals = FEED.filter(i => i.gilliDeal);
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${C.borderL}` }}>
        <span style={{ fontSize: 20 }}>🏏</span>
        <div>
          <div style={{ fontFamily: f.serif, fontSize: 18, fontWeight: 700, color: C.gilli }}>Gilli</div>
          <div style={{ fontFamily: f.sans, fontSize: 10, color: C.light, letterSpacing: "0.06em", textTransform: "uppercase" }}>Deals & Commerce</div>
        </div>
      </div>
      {deals.map(d => (
        <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${C.borderL}` }}>
          <div style={{ fontFamily: f.sans, fontSize: 10, color: C.gilli, fontWeight: 600, marginBottom: 3 }}>📍 {d.area}</div>
          <div style={{ fontFamily: f.sans, fontSize: 14, fontWeight: 600, color: C.text, lineHeight: 1.3 }}>{d.title}</div>
          <div style={{ fontFamily: f.sans, fontSize: 11, color: C.light, marginTop: 3 }}>{d.engagement.views.toLocaleString()} views</div>
        </div>
      ))}
      <button style={{ width: "100%", background: C.gilli, color: "#FFF", border: "none", borderRadius: 10, padding: 10, fontFamily: f.sans, fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 14 }}>
        Browse All Gilli Deals →
      </button>
    </div>
  );
}

function ZoneGrid({ onSelect }) {
  const zones = ["North", "Central", "South", "West"];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: 18 }}>
      <div style={{ fontFamily: f.serif, fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 14 }}>Browse by Zone</div>
      {zones.map(z => (
        <div key={z} style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 5 }}>{z} Chennai</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {CHENNAI_PINCODES.filter(p => p.zone === z).map(p => (
              <span key={p.code} onClick={() => onSelect(p.code)} title={p.area} style={{ fontFamily: f.mono, fontSize: 11, color: C.teal, background: C.teal + "10", padding: "3px 8px", borderRadius: 6, cursor: "pointer" }}>
                {p.code}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WACta() {
  return (
    <div style={{ background: "linear-gradient(135deg, #075E54, #128C7E)", borderRadius: 12, padding: "18px 22px", color: "#FFF", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
      <div>
        <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 600, opacity: 0.8, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>WhatsApp Channel</div>
        <div style={{ fontFamily: f.serif, fontSize: 19, fontWeight: 700, marginBottom: 2 }}>Get Chennai news delivered</div>
        <div style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.8 }}>Follow Gully on WhatsApp — stories arrive without you asking</div>
      </div>
      <button style={{ background: "#25D366", color: "#FFF", border: "none", borderRadius: 24, padding: "10px 20px", fontFamily: f.sans, fontSize: 14, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}>Follow Channel →</button>
    </div>
  );
}

// ─── DRAWER ───

function PincodeDrawer({ open, onClose, pincode, setPincode }) {
  if (!open) return null;
  const zones = ["North", "Central", "South", "West"];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 340, background: C.bg, height: "100%", overflowY: "auto", padding: 24, animation: "slideIn .25s ease" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <span style={{ fontFamily: f.serif, fontSize: 22, fontWeight: 700 }}>Select Pincode</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: C.muted }}>✕</button>
        </div>
        <button onClick={() => { setPincode(null); onClose(); }} style={{ width: "100%", background: !pincode ? C.bgDark : "transparent", color: !pincode ? "#FFF" : C.text, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontFamily: f.sans, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 14, textAlign: "left" }}>
          📍 All Chennai — Full City Feed
        </button>
        {zones.map(z => (
          <div key={z} style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, color: C.light, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 4 }}>{z}</div>
            {CHENNAI_PINCODES.filter(p => p.zone === z).map(p => (
              <button key={p.code} onClick={() => { setPincode(p.code); onClose(); }} style={{
                width: "100%", background: pincode === p.code ? C.teal : "transparent",
                color: pincode === p.code ? "#FFF" : C.text,
                border: `1px solid ${pincode === p.code ? C.teal : C.borderL}`,
                borderRadius: 8, padding: "7px 12px", fontFamily: f.sans, fontSize: 13,
                cursor: "pointer", marginBottom: 3, textAlign: "left",
                display: "flex", justifyContent: "space-between",
              }}>
                <span style={{ fontWeight: 600 }}>{p.area}</span>
                <span style={{ fontFamily: f.mono, fontSize: 12, opacity: 0.6 }}>{p.code}</span>
              </button>
            ))}
          </div>
        ))}
      </div>
      <style>{`@keyframes slideIn { from { transform:translateX(100%) } to { transform:translateX(0) } }`}</style>
    </div>
  );
}

// ─── FOOTER ───

function Footer() {
  return (
    <footer style={{ background: C.bgDark, color: "#FFF", padding: "36px 20px 18px", marginTop: 36 }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 28 }}>
          <div style={{ maxWidth: 280 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
              <span style={{ fontFamily: f.serif, fontSize: 26, fontWeight: 800 }}>Gully</span>
              <span style={{ fontFamily: f.sans, fontSize: 10, opacity: 0.5, letterSpacing: "0.15em", textTransform: "uppercase" }}>Chennai</span>
            </div>
            <p style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.6, lineHeight: 1.6 }}>
              Your neighbourhood. Your news. Chennai's first pincode-level news and community platform covering 130+ pincodes.
            </p>
          </div>
          <div>
            <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>Gully</div>
            {["Chennai Feed", "Temple of the Day", "Videos", "Classifieds", "Events", "Alerts"].map(l => (
              <div key={l} style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.7, marginBottom: 7, cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>🏏 Gilli</div>
            {["Shop Directory", "Order via WhatsApp", "List Your Shop", "Advertise", "Pincode Boost", "Business Dashboard"].map(l => (
              <div key={l} style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.7, marginBottom: 7, cursor: "pointer" }}>{l}</div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: f.sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.4, marginBottom: 10 }}>Connect</div>
            {["WhatsApp Channel", "Instagram", "X (Twitter)", "Contribute a Story", "Contact Us"].map(l => (
              <div key={l} style={{ fontFamily: f.sans, fontSize: 13, opacity: 0.7, marginBottom: 7, cursor: "pointer" }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 24, paddingTop: 14, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontFamily: f.sans, fontSize: 11, opacity: 0.4 }}>© 2026 Gully Media. All rights reserved.</span>
          <div style={{ display: "flex", gap: 16 }}>
            {["Privacy", "Terms", "About"].map(l => (
              <span key={l} style={{ fontFamily: f.sans, fontSize: 11, opacity: 0.4, cursor: "pointer" }}>{l}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export default function GullyHome() {
    const [cat, setCat] = useState("all");
    const [pin, setPin] = useState(null);
    const [drawer, setDrawer] = useState(false);
  
    const { items: liveItems, loading, source } = useFeed({ pincode: pin, category: cat });
    const filtered = (source === 'firestore' && liveItems.length > 0)
      ? liveItems
      : FEED.filter(item => {
          if (cat !== "all" && item.category !== cat) return false;
          if (pin && !item.pincodes.includes(pin)) return false;
          return true;
        });
  
    return (
      <div style={{ background: C.bg, minHeight: "100vh" }}>
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <Ticker />
        <Header pincode={pin} setPincode={setPin} setDrawer={setDrawer} />
        <CatBar active={cat} setActive={setCat} />
  
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: 20, display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: C.muted }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🔍</div>
                <div style={{ fontFamily: f.sans, fontSize: 16, fontWeight: 600 }}>No stories match this filter</div>
                <div style={{ fontFamily: f.sans, fontSize: 13, marginTop: 4 }}>Try a different category or view all Chennai</div>
                <button onClick={() => { setCat("all"); setPin(null); }} style={{ marginTop: 12, background: C.teal, color: "#FFF", border: "none", borderRadius: 20, padding: "8px 20px", fontFamily: f.sans, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Show All Stories</button>
              </div>
            ) : (
              filtered.map((item, i) => (
                <div key={item.id}>
                  <Card item={item} />
                  {i === 3 && <div style={{ margin: "6px 0" }}><WACta /></div>}
                </div>
              ))
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18, position: "sticky", top: 120 }}>
            <GilliSidebar />
            <ZoneGrid onSelect={(code) => setPin(code)} />
          </div>
        </div>
  
        <Footer />
        <PincodeDrawer open={drawer} onClose={() => setDrawer(false)} pincode={pin} setPincode={setPin} />
      </div>
    );
  }