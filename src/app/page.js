'use client';
 
import { useState } from 'react';
import Link from 'next/link';
 
const CITIES = [
  { id: 'chennai',   label: 'Chennai',   pincodes: [
    { code: '600001', area: 'George Town / Parrys' },
    { code: '600004', area: 'Mylapore' },
    { code: '600017', area: 'T Nagar' },
    { code: '600020', area: 'Adyar' },
    { code: '600028', area: 'RA Puram / Santhome' },
    { code: '600034', area: 'Nungambakkam' },
    { code: '600040', area: 'Anna Nagar' },
    { code: '600042', area: 'Velachery' },
    
  ]},
  { id: 'mumbai',    label: 'Mumbai',    pincodes: [
    { code: '400001', area: 'Fort / Churchgate' },
    { code: '400050', area: 'Bandra West' },
    { code: '400016', area: 'Mahim / Dadar' },
    { code: '400005', area: 'Girgaon / Charni Road' },
    { code: '400019', area: 'Matunga' },
    { code: '400022', area: 'Sion' },
    { code: '400049', area: 'Santacruz East' },
    { code: '400070', area: 'Kurla West' },
    { code: '400080', area: 'Mulund West' },
  ]},
  { id: 'bangalore', label: 'Bangalore', pincodes: [
    { code: '560001', area: 'MG Road / Brigade Road' },
    { code: '560004', area: 'Sadashivanagar' },
    { code: '560011', area: 'Indiranagar' },
    { code: '560034', area: 'Koramangala' },
    { code: '560038', area: 'Jayanagar' },
    { code: '560041', area: 'Whitefield' },
    { code: '560047', area: 'Rajajinagar' },
    { code: '560068', area: 'Banashankari' },
    { code: '560076', area: 'Kengeri' },
  ]},
  { id: 'hyderabad', label: 'Hyderabad', pincodes: [
    { code: '500001', area: 'Charminar / Old City' },
    { code: '500016', area: 'Banjara Hills' },
    { code: '500034', area: 'Jubilee Hills' },
    { code: '500038', area: 'Secunderabad' },
    { code: '500045', area: 'Kukatpally' },
    { code: '500055', area: 'Ameerpet' },
    { code: '500072', area: 'Gachibowli' },
    { code: '500081', area: 'Madhapur / HITEC' },
    { code: '500085', area: 'LB Nagar' },
  ]},
  { id: 'delhi',     label: 'Delhi',     pincodes: [
    { code: '110001', area: 'Connaught Place' },
    { code: '110006', area: 'Karol Bagh' },
    { code: '110017', area: 'Saket' },
    { code: '110024', area: 'Lajpat Nagar' },
    { code: '110034', area: 'Pitampura' },
    { code: '110048', area: 'Vasant Kunj' },
    { code: '110065', area: 'Dwarka' },
    { code: '110085', area: 'Rohini' },
    { code: '110091', area: 'Preet Vihar' },
  ]},
  { id: 'kolkata',   label: 'Kolkata',   pincodes: [
    { code: '700001', area: 'BBD Bagh / Dalhousie' },
    { code: '700007', area: 'Bhowanipore' },
    { code: '700019', area: 'Ballygunge' },
    { code: '700026', area: 'Lake Market' },
    { code: '700031', area: 'Nager Bazar' },
    { code: '700034', area: 'Dum Dum' },
    { code: '700040', area: 'Ariadaha' },
    { code: '700048', area: 'Garfa' },
    { code: '700064', area: 'Garia' },
  ]},
];
 

 
function isValidPincode(p) {
  return /^[1-8]\d{5}$/.test(p);
}
 
export default function Home() {
  const [pincode, setPincode]     = useState('');
  const [error, setError]         = useState('');
  const [activeCity, setActiveCity] = useState('chennai');
 
  function handleSubmit(e) {
    if (e) e.preventDefault();
    const p = pincode.trim();
    if (!isValidPincode(p)) {
      setError('Please enter a valid 6-digit pincode');
      return;
    }
    window.location.href = '/pincode/' + p;
  }
 
  function handleKeyDown(e) {
    if (e.key === 'Enter') handleSubmit();
  }
 
  const city = CITIES.find(c => c.id === activeCity);
 
  return (
    <div style={s.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,800;0,900;1,400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::selection { background: #e85d26; color: #fff; }
        input:focus { outline: 2px solid #e85d26; outline-offset: 2px; }
        button:focus-visible { outline: 2px solid #e85d26; outline-offset: 2px; }
        a:focus-visible { outline: 2px solid #e85d26; outline-offset: 2px; }
        @media (max-width: 600px) {
          .hero-title { font-size: 24px !important; }
          .city-tabs { gap: 12px !important; flex-wrap: wrap !important; }
          .pincode-grid { grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)) !important; }
          .input-wrap { flex-direction: column !important; }
          .input-wrap input { width: 100% !important; }
          .input-wrap button { width: 100% !important; }
          .actions-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
 
      <div style={s.container}>
 
        {/* -- MASTHEAD -- */}
        <header style={s.masthead}>
          <div style={s.rule} />
          <div style={s.mastheadInner}>
            <div style={s.logo}>Gully</div>
            <div style={s.logoTagline}>Real People  &middot;  Real Conversations</div>
            <div style={s.cityEditions}>
              {CITIES.map((c, i) => (
                <span key={c.id} style={s.editionItem}>
                  <span style={{
                    ...s.editionName,
                    color: activeCity === c.id ? '#e85d26' : '#666',
                    fontWeight: activeCity === c.id ? 700 : 400,
                  }}>{c.label}</span>
                  {i < CITIES.length - 1 && <span style={s.editionDot}> &middot; </span>}
                </span>
              ))}
            </div>
          </div>
          <div style={s.rule} />
          <div style={s.dateline}>
            EST. 2026 · INDIA’S NEIGHBOURHOOD SHOP DIRECTORY
          </div>
        </header>
 
        {/* -- HERO -- */}
        <section style={s.hero}>
          <h1 className="hero-title" style={s.heroTitle}>
            The shops of your neighbourhood,<br />
            honoured by the people who shop there.
          </h1>
          <p style={s.heroSubtitle}>
            India’s first pincode-based neighbourhood directory.
           
          </p>
 
          <div className="input-wrap" style={s.inputWrap}>
            <input
              type="text"
              value={pincode}
              onChange={e => { setPincode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Enter any pincode -- 600028, 400001, 560001..."
              maxLength={6}
              inputMode="numeric"
              style={s.input}
              aria-label="Enter pincode"
            />
            <button onClick={handleSubmit} style={s.submitBtn} aria-label="Find neighbourhood shops">
              Find your neighbourhood {'→'}
            </button>
          </div>
          {error && <p style={s.error} role="alert">{error}</p>}
        </section>
 
        {/* -- CITY TABS -- */}
        <section style={s.citySection}>
          <div style={s.sectionRule}>
            <div style={s.sectionRuleLabel}>BROWSE BY CITY</div>
          </div>
          <div className="city-tabs" style={s.cityTabs}>
            {CITIES.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCity(c.id)}
                style={{
                  ...s.cityTab,
                  borderBottom: activeCity === c.id ? '2px solid #e85d26' : '2px solid transparent',
                  color: activeCity === c.id ? '#1a1a1a' : '#888',
                  fontWeight: activeCity === c.id ? 700 : 400,
                }}
                aria-pressed={activeCity === c.id}
              >
                {c.label}
                <span style={{
                  ...s.cityCount,
                  color: activeCity === c.id ? '#e85d26' : '#bbb',
                }}>
                  
                </span>
              </button>
            ))}
          </div>
 
          <div className="pincode-grid" style={s.pincodeGrid}>
            {city.pincodes.map(p => (
              <Link key={p.code} href={'/pincode/' + p.code} style={s.pincodeCard}>
                <span style={s.pincodeCode}>{p.code}</span>
                <span style={s.pincodeArea}>{p.area}</span>
                <span style={s.pincodeArrow}>{'→'}</span>
              </Link>
            ))}
          </div>
        </section>
 
        {/* -- ARCHIVE CALLOUT -- */}
        <section style={s.archiveSection}>
          <div style={s.sectionRule}>
            <div style={s.sectionRuleLabel}>FROM THE ARCHIVE</div>
          </div>
          <div style={s.archiveGrid}>
            <Link href="/chennai" style={s.archiveCard}>
              <span style={s.archiveKicker}>Heritage  &middot;  Chennai</span>
              <span style={s.archiveTitle}>The Ten Names of Chennai</span>
              <span style={s.archiveDesc}>From Mylapore to Madraspatnam -- the city&apos;s layered identity across 2,000 years.</span>
              <span style={s.archiveReadMore}>{'Read →'}</span>
            </Link>
            <Link href="/chennai/vyasarpadi" style={s.archiveCard}>
              <span style={s.archiveKicker}>Heritage  &middot;  Pincode 600039</span>
              <span style={s.archiveTitle}>Vyasarpadi</span>
              <span style={s.archiveDesc}>The first train in South India left from here. Gaana music was born in its lanes. For a place no one talks about, a great deal of history.</span>
              <span style={s.archiveReadMore}>{'Read →'}</span>
            </Link>
          </div>
        </section>
 
        {/* -- WHAT IS GULLY -- */}
        <section style={s.manifestoSection}>
          <div style={s.sectionRule}>
            <div style={s.sectionRuleLabel}>WHAT IS GULLY</div>
          </div>
          <div style={s.manifestoGrid}>
            <div style={s.manifestoText}>
              <p style={s.manifestoP}>
                India has millions of neighbourhood shops. The kirana where the owner knows your name.
                The pharmacy that stayed open late. The bakery whose murukku you have eaten since
                childhood. The tailor who has been altering your clothes for fifteen years.
              </p>
              <p style={s.manifestoP}>
                None of them appear prominently in national search results. None of them have
                marketing budgets. None of them have a digital presence that reflects the trust
                they have earned over decades.
              </p>
              <p style={s.manifestoP}>
                <strong>Gully changes that.</strong> Free to list. No commission. No algorithm
                deciding who appears based on how much they have paid. Every shop in a pincode
                appears -- ranked by community nominations and votes.
              </p>
            </div>
            <div style={s.manifestoStats}>
              <div style={s.statBlock}>
                
                <div style={s.statLabel}>Shops listed</div>
              </div>
              <div style={s.statDivider} />
              <div style={s.statBlock}>
                <div style={s.statNumber}>6</div>
                <div style={s.statLabel}>Cities</div>
              </div>
              <div style={s.statDivider} />
              <div style={s.statBlock}>
                <div style={s.statNumber}>566</div>
                <div style={s.statLabel}>Pincodes</div>
              </div>
              <div style={s.statDivider} />
              <div style={s.statBlock}>
                <div style={s.statNumber}>Rs.0</div>
                <div style={s.statLabel}>Commission charged</div>
              </div>
            </div>
          </div>
        </section>
 
        {/* -- ACTIONS -- */}
        <section style={s.actionsSection}>
          <div className="actions-grid" style={s.actionsGrid}>
            <Link href="/awards/nominate" style={s.actionPrimary}>
              <div style={s.actionIcon}></div>
              <div style={s.actionTitle}>Nominate a Shop</div>
              <div style={s.actionBody}>
                Know a shop that deserves recognition in your pincode?
                Nominate it for the Best Gully Awards 2026.
              </div>
              <div style={s.actionCta}>{'Nominate now →'}</div>
            </Link>
            <Link href="/awards" style={s.actionSecondary}>
              <div style={s.actionIcon}></div>
              <div style={s.actionTitle}>Best Gully Awards</div>
              <div style={s.actionBody}>
                Chennai&apos;s first pincode-based neighbourhood business awards.
                See who&apos;s winning in your area.
              </div>
              <div style={s.actionCta}>{'View leaderboard →'}</div>
            </Link>
          </div>
        </section>
 
        {/* -- FOOTER -- */}
        <footer style={s.footer}>
          <div style={s.rule} />
          <div style={s.footerInner}>
            <div style={s.footerLeft}>
              <span style={s.footerLogo}>Gully</span>
              <span style={s.footerTagline}>Real People  &middot;  Real Conversations</span>
            </div>
            <div style={s.footerLinks}>
              <Link href="/chennai" style={s.footerLink}>Archive</Link>
              <Link href="/privacy" style={s.footerLink}>Privacy</Link>
              <Link href="/terms" style={s.footerLink}>Terms</Link>
            </div>
          </div>
          <div style={s.footerCopy}>
            mygully.in &middot; India &middot; 2026
          </div>
        </footer>
 
      </div>
    </div>
  );
}
 
const s = {
  page: {
    minHeight: '100vh',
    background: '#faf9f6',
    fontFamily: "'Playfair Display', Georgia, serif",
    color: '#1a1a1a',
  },
  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 20px 60px',
  },
 
  // Masthead
  masthead: { marginBottom: 48 },
  rule: { height: 2, background: '#1a1a1a', marginBottom: 0 },
  mastheadInner: { padding: '16px 0', textAlign: 'center' },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 72,
    fontWeight: 900,
    letterSpacing: '-0.04em',
    lineHeight: 1,
    marginBottom: 4,
  },
  logoTagline: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.3em',
    textTransform: 'uppercase',
    color: '#e85d26',
    marginBottom: 12,
  },
  cityEditions: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  editionItem: { display: 'flex', alignItems: 'center', gap: 8 },
  editionName: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    transition: 'color 0.15s',
    cursor: 'default',
  },
  editionDot: { color: '#ccc', fontSize: 11 },
  dateline: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#888',
    textAlign: 'center',
    padding: '10px 0 0',
    borderTop: '1px solid #ddd',
    marginTop: 2,
  },
 
  // Hero
  hero: { textAlign: 'center', marginBottom: 52 },
  heroTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 32,
    fontWeight: 700,
    lineHeight: 1.3,
    margin: '0 0 16px',
    letterSpacing: '-0.01em',
  },
  heroSubtitle: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 15,
    color: '#555',
    margin: '0 0 32px',
    lineHeight: 1.6,
    maxWidth: 560,
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  inputWrap: {
    display: 'flex',
    gap: 10,
    maxWidth: 580,
    margin: '0 auto',
  },
  input: {
    flex: 1,
    padding: '15px 18px',
    fontSize: 15,
    fontFamily: 'Arial, sans-serif',
    border: '1.5px solid #d0cdc8',
    borderRadius: 0,
    background: '#fff',
    color: '#1a1a1a',
  },
  submitBtn: {
    padding: '15px 24px',
    background: '#e85d26',
    color: '#fff',
    border: 'none',
    borderRadius: 0,
    fontFamily: 'Arial, sans-serif',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    letterSpacing: '0.02em',
  },
  error: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#c94a1a',
    marginTop: 12,
  },
 
  // Section rules
  sectionRule: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  sectionRuleLabel: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: '#888',
    whiteSpace: 'nowrap',
    paddingRight: 16,
    borderRight: '2px solid #e85d26',
  },
 
  // City tabs
  citySection: { marginBottom: 52 },
  cityTabs: {
    display: 'flex',
    gap: 0,
    marginBottom: 24,
    borderBottom: '1px solid #e0ddd8',
    overflowX: 'auto',
  },
  cityTab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '10px 20px 12px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 15,
    color: '#888',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap',
    marginBottom: -1,
  },
  cityCount: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    letterSpacing: '0.05em',
    marginTop: 2,
    transition: 'color 0.15s',
  },
  pincodeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
    gap: 1,
    background: '#e0ddd8',
    border: '1px solid #e0ddd8',
  },
  pincodeCard: {
    background: '#faf9f6',
    padding: '14px 16px',
    textDecoration: 'none',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    transition: 'background 0.12s',
    position: 'relative',
  },
  pincodeCode: {
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontSize: 12,
    fontWeight: 700,
    color: '#e85d26',
    letterSpacing: '0.05em',
  },
  pincodeArea: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 1.3,
  },
  pincodeArrow: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    color: '#bbb',
    marginTop: 4,
  },
 
  // Archive
  archiveSection: { marginBottom: 52 },
  archiveGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 1,
    background: '#e0ddd8',
    border: '1px solid #e0ddd8',
  },
  archiveCard: {
    background: '#faf9f6',
    padding: '24px 22px',
    textDecoration: 'none',
    color: '#1a1a1a',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  archiveKicker: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: '#e85d26',
  },
  archiveTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1.2,
    color: '#1a1a1a',
  },
  archiveDesc: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#555',
    lineHeight: 1.6,
    flex: 1,
  },
  archiveReadMore: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    fontWeight: 700,
    color: '#1a1a1a',
    letterSpacing: '0.05em',
    marginTop: 8,
  },
 
  // Manifesto
  manifestoSection: { marginBottom: 52 },
  manifestoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 32,
    alignItems: 'start',
  },
  manifestoText: {},
  manifestoP: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 15,
    lineHeight: 1.75,
    color: '#333',
    marginBottom: 16,
  },
  manifestoStats: {
    borderLeft: '2px solid #e85d26',
    paddingLeft: 28,
    minWidth: 0,
  },
  statBlock: { paddingBottom: 20 },
  statNumber: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 36,
    fontWeight: 900,
    color: '#1a1a1a',
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    color: '#888',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statDivider: {
    height: 1,
    background: '#e0ddd8',
    marginBottom: 20,
  },
 
  // Actions
  actionsSection: { marginBottom: 52 },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: 1,
    background: '#e0ddd8',
    border: '1px solid #e0ddd8',
  },
  actionPrimary: {
    background: '#1a1a1a',
    padding: '28px 24px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  actionSecondary: {
    background: '#faf9f6',
    padding: '28px 24px',
    textDecoration: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  actionIcon: { fontSize: 24 },
  actionTitle: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    fontWeight: 700,
    color: '#fff',
  },
  actionBody: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    color: '#aaa',
    lineHeight: 1.6,
    flex: 1,
  },
  actionCta: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 13,
    fontWeight: 700,
    color: '#e85d26',
    marginTop: 8,
  },
 
  // Footer
  footer: { marginTop: 8 },
  footerInner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0',
    flexWrap: 'wrap',
    gap: 12,
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  footerLogo: {
    fontFamily: "'Playfair Display', Georgia, serif",
    fontSize: 20,
    fontWeight: 900,
    letterSpacing: '-0.02em',
  },
  footerTagline: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 10,
    color: '#e85d26',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  footerLinks: {
    display: 'flex',
    gap: 20,
  },
  footerLink: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 12,
    color: '#888',
    textDecoration: 'none',
    letterSpacing: '0.05em',
  },
  footerCopy: {
    fontFamily: 'Arial, sans-serif',
    fontSize: 11,
    color: '#aaa',
    paddingTop: 12,
    borderTop: '1px solid #e0ddd8',
    letterSpacing: '0.05em',
  },
};
 