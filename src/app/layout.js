import { Cormorant_Garamond, Manrope, Pinyon_Script } from 'next/font/google';
import { wedding, siteUrl } from '@/config/wedding';
import './globals.css';

const serif = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const script = Pinyon_Script({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-script',
  display: 'swap',
});

const sans = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: wedding.seo.title,
  description: wedding.seo.description,
  applicationName: 'Dilki & Supun',
  openGraph: {
    type: 'website',
    title: 'Dilki & Supun are getting married',
    description: wedding.seo.description,
    siteName: 'Dilki & Supun',
    locale: 'en_GB',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dilki & Supun are getting married',
    description: wedding.seo.description,
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#352B2B',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${serif.variable} ${script.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        {/* Skip the opening card on reloads within the same visit, before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(sessionStorage.getItem('ds-opened')==='1')document.documentElement.setAttribute('data-opened','1')}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
