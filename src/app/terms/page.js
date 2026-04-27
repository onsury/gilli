export const metadata = {
  title: 'Terms of Service — Gully',
  description: 'The terms under which Gully is provided.',
};

export default function TermsPage() {
  return (
    <div style={s.page}>
      <div style={s.container}>
        <header style={s.header}>
          <a href="/" style={s.homeLink}>← Gully</a>
          <h1 style={s.title}>Terms of Service</h1>
          <p style={s.updated}>Last updated: April 24, 2026</p>
        </header>

        <section style={s.intro}>
          <p>
            Welcome to Gully. Gully is a neighbourhood shop directory organised by pincode, built and owned by <strong>Gully (mygully.in)</strong> (&quot;Gully&quot;, &quot;we&quot;, &quot;us&quot;). By using <strong>mygully.in</strong>, you agree to these terms.
          </p>
          <p>
            If you do not agree, please do not use the service. These terms apply to everyone — visitors browsing, residents nominating shops, shop owners, and anyone uploading content.
          </p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>1. What Gully is</h2>
          <p>Gully is a free, community-driven directory of neighbourhood shops and businesses, organised by pincode. Residents nominate shops they know and love, and the community votes for favourites. Gully does not sell products, process payments, or operate as a marketplace.</p>
          <p>Gully is a community platform. Information on mygully.in comes from residents who nominate shops. We do not independently verify each listing. Always confirm details directly with a business before relying on them for a purchase or service.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>2. Who can use Gully</h2>
          <ul style={s.ul}>
            <li>You must be at least 13 years old to use mygully.in</li>
            <li>You must provide a valid phone number when nominating a shop</li>
            <li>You agree to provide accurate information (shop names, addresses, etc.)</li>
            <li>You must not use Gully to harass businesses, spread false information, or submit spam</li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>3. Content you submit</h2>
          <p>When you nominate a shop, vote, or upload a video link, you are submitting content to Gully. By doing so:</p>
          <ul style={s.ul}>
            <li>You confirm the information is accurate to the best of your knowledge</li>
            <li>You grant Gully a non-exclusive, royalty-free licence to display your submission on mygully.in and share it publicly</li>
            <li>You retain ownership of any video content you link to (the video remains on your YouTube or Instagram channel)</li>
            <li>You agree not to submit defamatory, abusive, harassing, or illegal content about any shop or person</li>
            <li>You agree not to submit fake nominations or manipulate vote counts</li>
          </ul>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>4. Video content and YouTube integration</h2>
          <p>If you link a YouTube or Instagram video to a shop nomination, or use Gully to upload a video to your own YouTube account:</p>
          <ul style={s.ul}>
            <li>You confirm you own or have permission to share the video</li>
            <li>You agree the video complies with YouTube&apos;s Terms of Service and Instagram&apos;s Community Guidelines</li>
            <li>You understand the video remains on your account; Gully only references it</li>
            <li>If the video is removed from YouTube or Instagram, the embed on Gully stops working automatically</li>
          </ul>
          <p>Gully is not responsible for content hosted on YouTube or Instagram. Report violations directly to those platforms through their reporting tools.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>5. Shop owners and the &quot;claim your shop&quot; feature</h2>
          <p>If a shop that you own is listed on Gully, you may in the future have the option to claim the listing and correct or enhance its details. Until then, shops appear based on nominations from residents.</p>
          <p>If you believe a listing about your shop is inaccurate, defamatory, or should be removed, contact us at <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a> and we will review it within 14 days.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>6. Our right to moderate</h2>
          <p>We reserve the right to remove any content on mygully.in that we believe, in good faith, is:</p>
          <ul style={s.ul}>
            <li>Inaccurate or misleading</li>
            <li>Defamatory, abusive, or harassing</li>
            <li>Spam or vote manipulation</li>
            <li>In violation of any applicable law</li>
            <li>Inconsistent with the spirit of a neighbourhood community platform</li>
          </ul>
          <p>We try to be light-touch. We will not remove legitimate criticism of a shop&apos;s service or products as long as it is honest and specific.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>7. Free service, no guarantees</h2>
          <p>Gully is free to use. We provide the service &quot;as is&quot; without warranties of any kind. We do not guarantee:</p>
          <ul style={s.ul}>
            <li>That mygully.in will always be available</li>
            <li>That all information on the site is accurate</li>
            <li>That the service will meet your specific needs</li>
            <li>That any shop on Gully is reputable, solvent, or providing good service</li>
          </ul>
          <p>Always do your own due diligence before transacting with any business you discover through Gully.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>8. Limitation of liability</h2>
          <p>To the extent permitted by law, Gully is not liable for any indirect, incidental, or consequential damages arising from your use of mygully.in. If we are found liable, our total liability to you is limited to the amount you have paid us to use the service — which, since Gully is free, is zero.</p>
          <p>This limitation does not apply to liabilities that cannot be limited under Indian law, such as liability for gross negligence or fraud.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>9. Changes to the service</h2>
          <p>We may add features, remove features, or change how Gully works at any time. We may also discontinue the service if it becomes unsustainable. If we discontinue the service, we will give at least 30 days&apos; notice on mygully.in and offer a way to export your data.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>10. Termination</h2>
          <p>You can stop using Gully at any time. You can delete your data by emailing <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a>.</p>
          <p>We may suspend or remove your access to specific features (such as video uploads) if you violate these terms. We will not arbitrarily delete nominations from residents who have used the service in good faith.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>11. Changes to these terms</h2>
          <p>We may update these terms from time to time. When we make meaningful changes, we will update the &quot;Last updated&quot; date and, for significant changes, display a notice on mygully.in. Continued use of the service after a change means you accept the revised terms.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>12. Governing law and jurisdiction</h2>
          <p>These terms are governed by the laws of India. Any dispute arising from these terms or your use of Gully will be subject to the exclusive jurisdiction of the courts of Chennai, Tamil Nadu, India.</p>
        </section>

        <section style={s.section}>
          <h2 style={s.h2}>13. Contact</h2>
          <p>
            <strong>Gully (mygully.in)</strong><br />
            Chennai, Tamil Nadu, India<br />
            Email: <a href="mailto:hello@mygully.in" style={s.link}>hello@mygully.in</a>
          </p>
        </section>

        <footer style={s.footer}>
          <a href="/" style={s.footerLink}>← Back to Gully</a>
          <a href="/privacy" style={s.footerLink}>Privacy Policy →</a>
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
  ul: { fontSize: 15, lineHeight: 1.7, paddingLeft: 22, margin: '0 0 12px' },
  link: { color: '#e85d26', textDecoration: 'underline' },
  footer: { borderTop: '1px solid #e5e5e0', paddingTop: 24, marginTop: 40, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 },
  footerLink: { fontFamily: 'Arial, sans-serif', fontSize: 13, color: '#666', textDecoration: 'none' },
};
