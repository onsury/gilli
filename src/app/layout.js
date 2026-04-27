import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-playfair',
  display: 'swap',
});

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL('https://mygully.in'),
  title: {
    default: "Gully — Chennai Neighbourhood Shops, By Pincode",
    template: "%s · Gully",
  },
  description: "The shops of your neighbourhood, honoured by the people who shop there. Chennai's first pincode-organised shop directory.",
  openGraph: {
    type: 'website',
    siteName: 'Gully',
    title: "Gully — Chennai Neighbourhood Shops, By Pincode",
    description: "The shops of your neighbourhood, honoured by the people who shop there.",
    url: 'https://mygully.in',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Gully — Chennai neighbourhood shops by pincode' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Gully — Chennai Neighbourhood Shops, By Pincode",
    description: "The shops of your neighbourhood, honoured by the people who shop there.",
    images: ['/og-default.png'],
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} ${playfair.variable}`}>
        {children}
      </body>
    </html>
  );
}
