import type { Metadata, Viewport } from 'next';
import { Playfair_Display, Space_Grotesk, Vazirmatn } from 'next/font/google';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import '../globals.css';
import AppProviders from '@/components/AppProviders';
import Providers from '@/components/Providers';
import { routing } from '@/i18n/routing';

// Persian + Latin body font; a serif display face for Light Luxury and a grotesk for Dark Premium
const sans = Vazirmatn({ subsets: ['arabic', 'latin'], display: 'swap', variable: '--f-sans' });
const serif = Playfair_Display({ subsets: ['latin'], display: 'swap', variable: '--f-serif' });
const grotesk = Space_Grotesk({ subsets: ['latin'], display: 'swap', variable: '--f-grotesk' });

export const viewport: Viewport = {
  themeColor: [{ media: '(prefers-color-scheme: light)', color: '#faf7f2' }, { media: '(prefers-color-scheme: dark)', color: '#0b0b0d' }],
};

export async function generateMetadata({ params }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale: params.locale });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: { default: t('site.name'), template: `%s | ${t('site.name')}` },
    description: t('site.tagline'),
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: { locale: string } }) {
  if (!routing.locales.includes(params.locale as 'fa' | 'en')) notFound();
  const [messages, t] = await Promise.all([getMessages(), getTranslations()]);
  return (
    // suppressHydrationWarning: next-themes sets data-theme before React hydrates (prevents the theme flash)
    <html lang={params.locale} dir={params.locale === 'fa' ? 'rtl' : 'ltr'} suppressHydrationWarning className={`${sans.variable} ${serif.variable} ${grotesk.variable}`}>
      <body className="font-sans">
        <NextIntlClientProvider locale={params.locale} messages={messages}>
          <Providers>
            <AppProviders>
              <a href="#main" className="skip-link">{t('a11y.skip')}</a>
              {children}
            </AppProviders>
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
