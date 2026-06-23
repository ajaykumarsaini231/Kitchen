import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartProvider from '../components/CartProvider';
import KeepAlive from '../components/KeepAlive';
import { SITE_URL } from '../lib/config';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const space = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space',
  display: 'swap',
});
const jet = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jet',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'METNMAT Kitchen — Menu',
    template: '%s · METNMAT Kitchen',
  },
  description:
    'Explore the METNMAT Kitchen menu — fresh, handcrafted dishes, updated live.',
  openGraph: {
    title: 'METNMAT Kitchen — Menu',
    description: 'Fresh, handcrafted dishes, updated live.',
    type: 'website',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
};

// Set theme before paint (dark-first default).
const themeScript = `try{var t=localStorage.getItem('theme');if(t==='light'){document.documentElement.classList.remove('dark')}else{document.documentElement.classList.add('dark')}}catch(e){}`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${space.variable} ${jet.variable}`}
      suppressHydrationWarning
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <CartProvider>
          <KeepAlive />
          <Header />
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
