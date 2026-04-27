import Link from 'next/link';

export const metadata = {
  title: 'The Ten Names of Chennai',
  description: 'How the city got its names — from Madraspatnam to Chennai. A short heritage piece, by The Editor, GullyNewsArchive.',
  openGraph: {
    title: 'The Ten Names of Chennai — Gully',
    description: 'How the city got its names. A short heritage piece for Chennai neighbourhoods.',
    url: 'https://mygully.in/chennai',
    type: 'article',
    siteName: 'Gully',
    images: [{ url: 'https://mygully.in/og-default.png', width: 1200, height: 630 }],
  },
};

export default function ChennaiHeritagePage() {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <Link href="/" style={s.homeLink}>← Gully</Link>
          <p style={s.kicker}>Archive · Heritage</p>
          <h1 style={s.title}>The Ten Names of Chennai</h1>
          <p style={s.byline}>By The Editor, GullyNewsArchive</p>
          <p style={s.deck}>
            Cities accumulate names the way old houses accumulate nameplates — one fixed over the other, each still faintly legible. Chennai has more names than most. Here are ten of them, and the pincodes where they still echo.
          </p>
        </header>

        <article style={s.article}>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>1. Mylapore</h2>
            <p style={s.sectionMeta}>The oldest name · Pincode <Link href="/pincode/600004" style={s.pincodeLink}>600004</Link></p>
            <p>
              Before the British, before Madraspatnam, before the Portuguese set up anything on this coast, there was Mylapore. The name comes from <em>Mayilarpil</em>, the place where peacocks cry. The 2nd century Greek geographer Ptolemy wrote of a trading port he called <em>Maliarpha</em>, almost certainly this same settlement. By the 7th century the Pallava-era <em>Tiruvalluvar</em> is traditionally said to have lived here. The Kapaleeshwarar temple — rebuilt in the 16th century after earlier destruction — sits in Mylapore today, and the lanes around it still move at the pace of a temple town. This is the oldest continuously inhabited part of what is now Chennai.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>2. Tiruvallikeni</h2>
            <p style={s.sectionMeta}>Sacred water · Pincode <Link href="/pincode/600005" style={s.pincodeLink}>600005</Link></p>
            <p>
              <em>Thiru-alli-keni</em> — the sacred pond of the lily. The name predates the city around it. The Parthasarathy Temple here is mentioned in the devotional <em>Nalayira Divya Prabandham</em> of the 8th century Alvar saints. The British clipped the name to &quot;Triplicane&quot;, which is how it appears on most 19th-century maps. The tank is still there. The lilies come and go.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>3. San Thomé</h2>
            <p style={s.sectionMeta}>Portuguese Chennai · Pincode <Link href="/pincode/600004" style={s.pincodeLink}>600004</Link></p>
            <p>
              In 1522 the Portuguese, following a tradition that St. Thomas the Apostle was martyred on this coast in the 1st century, built a small town they called São Tomé de Meliapor. San Thomé Basilica — rebuilt by the British in neo-Gothic style in 1893 — still marks the spot. The Portuguese quarter remained distinct for centuries, eventually folded into what the British called Mylapore, and today into the pincode 600004 that holds both.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>4. Madraspatnam</h2>
            <p style={s.sectionMeta}>The village of the grant · Pincode <Link href="/pincode/600001" style={s.pincodeLink}>600001</Link></p>
            <p>
              On 22 August 1639, the East India Company&apos;s Francis Day obtained a grant of a strip of land from the local Vijayanagara governor Damerla Venkatapathy Nayaka. The strip was a fishing village called Madraspatnam. The origin of the name is still debated — possibly from a local Madrasan family, possibly from the word <em>madrasa</em>, possibly from the Portuguese <em>Madre de Deus</em>. What is not debated is the date. August 22nd is the day Chennai considers its founding. Madraspatnam became the northern half of the new settlement.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>5. Chennapatnam</h2>
            <p style={s.sectionMeta}>The other half · Pincode <Link href="/pincode/600001" style={s.pincodeLink}>600001</Link></p>
            <p>
              Next to Madraspatnam, separated by a small river, was another settlement called Chennapatnam — named, most historians agree, after Damarla Chennappa Nayaka, father of the governor who made the grant. Whether Chennapatnam existed before the grant or was founded to honour Chennappa is a minor scholarly fight. Over time the two villages merged. In English the merged settlement was called Madras. In Tamil, it stayed Chennai. Both names lived side by side for three hundred years before one was made official.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>6. Fort St. George</h2>
            <p style={s.sectionMeta}>White Town · Pincode <Link href="/pincode/600009" style={s.pincodeLink}>600009</Link></p>
            <p>
              Construction began in 1640. The fort was completed on 23 April 1644 — St. George&apos;s Day — and took the saint&apos;s name. Inside the walls lived the English: company officials, soldiers, clergy. The quarter was called White Town. Fort St. George is the first English fortress in India and remains a working government building today — the Tamil Nadu Legislative Assembly meets in buildings within its compound.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>7. Black Town</h2>
            <p style={s.sectionMeta}>The Indian quarter · Pincode <Link href="/pincode/600001" style={s.pincodeLink}>600001</Link></p>
            <p>
              North of the fort, outside the walls, was Black Town — the quarter where Indian merchants, weavers, dubashes and labourers lived and worked. It was the commercial engine of the early settlement. The name was functional and racial at once, which is how the British used most of their place-names in India. In 1906, after a visit by the Prince of Wales (later George V), Black Town was officially renamed George Town. The original name disappeared from maps but not from older memory. The lanes around Parrys Corner — timber, hardware, wedding cards, fireworks — still carry that older commercial grammar.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>8. Madras</h2>
            <p style={s.sectionMeta}>The colonial name</p>
            <p>
              For almost three centuries the city was Madras in English, in government records, in the name of the Presidency that ran half of south India, in the name of the university founded in 1857, the medical college founded in 1835, and the High Court whose red-brick tower rose in 1892. Generations of Tamils called their city both Madras and Chennai interchangeably, depending on the language they happened to be speaking. Officially it remained Madras.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>9. Chennai</h2>
            <p style={s.sectionMeta}>The restoration · 1996</p>
            <p>
              On 17 July 1996, the Tamil Nadu government changed the official name from Madras to Chennai. It was not a new name — it was the older of the two, the one that had never left Tamil mouths. Post offices updated their stamps. Maps were redrawn. The High Court, the university and the medical college kept Madras in their names (they still do). Everything else became Chennai. Whether you call it Madras or Chennai now is partly a matter of age, partly of language, partly of mood.
            </p>
          </section>

          <section style={s.section}>
            <h2 style={s.sectionTitle}>10. The neighbourhoods</h2>
            <p style={s.sectionMeta}>The names that matter daily</p>
            <p>
              Most people in this city do not think of it as Chennai, or Madras, or Madraspatnam. They think of it as T. Nagar (<Link href="/pincode/600017" style={s.pincodeLink}>600017</Link>) if they are shopping, Mylapore (<Link href="/pincode/600004" style={s.pincodeLink}>600004</Link>) if they are going to the temple, Adyar (<Link href="/pincode/600020" style={s.pincodeLink}>600020</Link>) if they are going to the bookshop, George Town (<Link href="/pincode/600001" style={s.pincodeLink}>600001</Link>) if they need wholesale anything. The city is not one name. It is a hundred and thirty names, one per pincode, each with its own temple, market, barber, tailor, sweet shop, idli shop.
            </p>
            <p>
              That is the Chennai this directory is built around. The rest is history.
            </p>
          </section>

        </article>

        <footer style={s.footer}>
          <p style={s.footerNote}>
            If you have a correction or an addition for this piece, write to us at <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a>. Heritage deserves care.
          </p>
          <div style={s.footerLinks}>
            <Link href="/" style={s.footerLink}>← Back to Gully</Link>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Read: The Ten Names of Chennai — https://mygully.in/chennai')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={s.shareBtn}
            >
              Share on WhatsApp
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  container: { maxWidth: 680, margin: '0 auto', padding: '40px 20px 60px' },
  header: { borderBottom: '2px solid #1a1a1a', paddingBottom: 20, marginBottom: 32 },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 16 },
  kicker: { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#e85d26', margin: '0 0 8px' },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 44, fontWeight: 700, margin: 0, letterSpacing: '-0.03em', lineHeight: 1.1 },
  byline: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#666', margin: '12px 0 0' },
  deck: { fontSize: 18, fontStyle: 'italic', color: '#333', lineHeight: 1.6, margin: '20px 0 0' },
  article: { fontSize: 17, lineHeight: 1.7 },
  section: { marginBottom: 36 },
  sectionTitle: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 26, fontWeight: 700, margin: '0 0 6px', letterSpacing: '-0.01em' },
  sectionMeta: { fontFamily: 'Arial, sans-serif', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#888', margin: '0 0 14px' },
  pincodeLink: { color: '#e85d26', textDecoration: 'none', fontWeight: 700 },
  footer: { borderTop: '1px solid #e5e5e0', paddingTop: 24, marginTop: 40 },
  footerNote: { fontSize: 13, color: '#666', fontStyle: 'italic', margin: '0 0 20px', textAlign: 'center' },
  footerLinks: { display: 'flex', gap: 12, justifyContent: 'space-between', flexWrap: 'wrap' },
  footerLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#666', textDecoration: 'none', padding: '10px 0' },
  shareBtn: { fontFamily: 'Arial, sans-serif', fontSize: 13, fontWeight: 700, color: '#fff', background: '#25D366', padding: '10px 18px', borderRadius: 6, textDecoration: 'none' },
  link: { color: '#e85d26', textDecoration: 'underline' },
};
