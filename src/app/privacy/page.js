export const metadata = {
  title: 'Privacy Policy — Gully',
  description: 'How Gully collects, uses, and protects your data.',
};

export default function PrivacyPage() {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <a href="/" style={s.homeLink}>← Gully</a>
          <h1 style={s.title}>Privacy Policy</h1>
          <p style={s.updated}>Last updated: April 24, 2026</p>
        </header>

        <section style={s.intro}>
          <p>
            Gully is a neighbourhood shop directory organised by pincode, built and owned by
            <strong> Gully (mygully.in)</strong> (&quot;Gully&quot;,
            &quot;we&quot;, &quot;us&quot;, &quot;our&quot;). This policy explains what
            information we collect through <strong>mygully.in</strong>, how we use it, and the
            choices you have.
          </p>
          <p>
            We have written this policy in plain language. If anything is unclear, contact us
            at <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a> and we will
            explain.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>1. What we collect</h2>
          <p>We keep data minimal. We only collect what the product actually needs.</p>
          <h3 style={s.h3}>When you nominate a shop</h3>
          <ul style={s.ul}>
            <li>Shop name, category, street address, area, pincode</li>
            <li>Optional: shop owner&apos;s name and business phone (used only to contact the business if it wins an award; never displayed publicly)</li>
            <li>Your phone number (to thank you and prevent duplicate submissions)</li>
            <li>Optional: a YouTube or Instagram link to a video about the shop</li>
          </ul>
          <h3 style={s.h3}>When you vote</h3>
          <ul style={s.ul}>
            <li>A session identifier, the nomination you voted for, and the pincode</li>
            <li>No phone number or personal identifier is required to vote</li>
          </ul>
          <h3 style={s.h3}>When you visit</h3>
          <ul style={s.ul}>
            <li>Standard server logs (IP address, browser type, pages visited) retained for security and debugging</li>
            <li>We do not use analytics trackers, advertising cookies, or fingerprinting</li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>2. YouTube data and OAuth (when applicable)</h2>
          <p>
            Gully offers an optional feature to upload videos to your YouTube account directly
            from mygully.in. If you choose to use this feature:
          </p>
          <ul style={s.ul}>
            <li>We request access only to the YouTube Data API scope required to upload a video to your channel on your behalf (<code>youtube.upload</code>).</li>
            <li>We do not read your existing videos, subscribers, watch history, or any other YouTube account data.</li>
            <li>Your authentication tokens are stored securely in encrypted Firestore and are used only to complete the upload you request. They are not shared with any third party.</li>
            <li>After an upload completes, we retain only the resulting public video ID, title, and thumbnail — the same information anyone can see on the public YouTube page.</li>
            <li>You can revoke Gully&apos;s access at any time from your Google Account permissions page at <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" style={s.link}>myaccount.google.com/permissions</a>.</li>
          </ul>
          <p>
            Gully&apos;s use of information received from Google APIs adheres to the{' '}
            <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" style={s.link}>Google API Services User Data Policy</a>, including the Limited Use requirements.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>3. How we use your data</h2>
          <ul style={s.ul}>
            <li>To display shops and nominations on mygully.in, organised by pincode</li>
            <li>To prevent duplicate nominations and votes</li>
            <li>To contact shop owners if they win an award</li>
            <li>To embed videos you have chosen to share publicly</li>
            <li>To improve the product and fix bugs</li>
          </ul>
          <p>We do not sell your data. We do not share it with advertisers. We do not profile you for marketing.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>4. What we show publicly vs. keep private</h2>
          <p><strong>Shown publicly on mygully.in:</strong></p>
          <ul style={s.ul}>
            <li>Shop name, category, street, area, pincode</li>
            <li>Vote counts on nominations</li>
            <li>Video embeds you choose to include</li>
          </ul>
          <p><strong>Kept private (never shown to other visitors):</strong></p>
          <ul style={s.ul}>
            <li>Shop owner&apos;s name and business phone number</li>
            <li>Your phone number</li>
            <li>Your YouTube OAuth tokens</li>
            <li>Server logs and session identifiers</li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>5. How long we keep data</h2>
          <ul style={s.ul}>
            <li>Shop listings and nominations: retained indefinitely as part of the public directory</li>
            <li>Your phone number (nominator contact): retained indefinitely unless you request deletion</li>
            <li>YouTube OAuth tokens: retained while your account is active; deleted if you revoke access or delete your account</li>
            <li>Server logs: retained for 90 days for security purposes</li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>6. Your rights</h2>
          <p>You have the right to:</p>
          <ul style={s.ul}>
            <li>Know what data we hold about you</li>
            <li>Correct inaccurate data</li>
            <li>Delete your data (including nominations you submitted and videos you uploaded via Gully)</li>
            <li>Withdraw consent for YouTube OAuth access at any time</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a> with your phone number and the specific request. We respond within 14 days.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>7. Children</h2>
          <p>Gully is not intended for use by children under 13. We do not knowingly collect data from children under 13. If you believe a child has submitted data to Gully, contact us and we will remove it.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>8. Security</h2>
          <p>We use Google Cloud&apos;s Firestore for data storage, which provides industry-standard encryption at rest and in transit. Access to the backend is restricted to authorised authorised personnel. However, no online service is completely secure — if we learn of a breach affecting your data, we will notify you within 72 hours.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>9. Changes to this policy</h2>
          <p>When we change this policy meaningfully, we will update the &quot;Last updated&quot; date at the top and, if the change is significant, display a notice on mygully.in. Continued use of the service after changes means you accept the revised policy.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>10. Contact</h2>
          <p>
            <strong>Gully (mygully.in)</strong><br />
            Chennai, Tamil Nadu, India<br />
            Email: <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a>
          </p>
        </section>

        <footer style={s.footer}>
          <a href="/" style={s.footerLink}>← Back to Gully</a>
          <a href="/terms" style={s.footerLink}>Terms of Service →</a>
        </footer>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', background: '#fafaf7', fontFamily: 'Georgia, serif', color: '#1a1a1a' },
  container: { maxWidth: 760, margin: '0 auto', padding: '40px 20px 60px' },
  header: { borderBottom: '2px solid #1a1a1a', paddingBottom: 16, marginBottom: 32 },
  homeLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#e85d26', textDecoration: 'none', display: 'inline-block', marginBottom: 12 },
  title: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 38, fontWeight: 700, letterSpacing: '-0.02em', margin: 0 },
  updated: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#888', margin: '8px 0 0' },
  intro: { fontSize: 16, lineHeight: 1.7, marginBottom: 32 },
  section: { marginBottom: 28 },
  h2: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 22, fontWeight: 700, margin: '0 0 12px', letterSpacing: '-0.01em' },
  h3: { fontFamily: 'Playfair Display, Georgia, serif', fontSize: 17, fontWeight: 700, margin: '18px 0 8px' },
  ul: { fontSize: 15, lineHeight: 1.7, paddingLeft: 22, margin: '0 0 12px' },
  link: { color: '#e85d26', textDecoration: 'underline' },
  footer: { borderTop: '1px solid #e5e5e0', paddingTop: 24, marginTop: 40, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#666', textDecoration: 'none' },
};
