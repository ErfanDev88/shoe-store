'use client';
import { m } from 'framer-motion';
import { Heart, LogIn, LogOut, Menu, Search, ShoppingBag, User as UserIcon } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useFmt } from '@/lib/use-fmt';
import { useAuth } from '@/stores/auth';
import { useCart } from '@/stores/cart';
import { useUi } from '@/stores/ui';
import { useWishlist } from '@/stores/wishlist';
import Logo from './Logo';
import Modal from './Modal';
import SearchDialog from './SearchDialog';
import ThemeToggle from './ThemeToggle';

const LINKS = [
  { href: '/products?gender=men', key: 'gender.men' },
  { href: '/products?gender=women', key: 'gender.women' },
  { href: '/products?gender=kids', key: 'gender.kids' },
  { href: '/products?sort=newest', key: 'nav.newArrivals' },
  { href: '/products?onSale=true', key: 'nav.sale', hot: true },
];

export default function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const f = useFmt();
  const { user, status, logout } = useAuth();
  const count = useCart((s) => s.view.itemCount);
  const liked = useWishlist((s) => s.ids.length);
  const { openCart, setSearch } = useUi();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  const staff = !!user && user.role !== 'customer';

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled ? 'border-b bg-bg/80 backdrop-blur-xl' : 'bg-bg'}`}>
      <div className="bg-brand py-1.5 text-center text-xs font-medium text-brand-fg">{t('header.announce')}</div>
      <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 md:px-6">
        <div className="flex items-center">
          <button className="icon-btn md:hidden" onClick={() => setMenu(true)} aria-label={t('header.menu')}><Menu className="h-5 w-5" /></button>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" aria-label={t('header.menu')}>
            {LINKS.map((l) => (
              <Link key={l.key} href={l.href} className={`link-u py-1 ${l.hot ? 'text-danger' : ''}`}>{t(l.key)}</Link>
            ))}
          </nav>
        </div>

        <Link href="/" aria-label="SOLE STORE"><Logo /></Link>

        <div className="flex items-center justify-end gap-0.5">
          <button className="icon-btn" onClick={() => setSearch(true)} aria-label={t('nav.search')}><Search className="h-5 w-5" /></button>
          <Link href="/account/wishlist" className="icon-btn hidden sm:inline-flex" aria-label={t('nav.wishlist')}>
            <Heart className="h-5 w-5" />
            {mounted && liked > 0 && <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />}
          </Link>
          <div className="hidden sm:block"><ThemeToggle /></div>
          <Link href={pathname} locale={locale === 'fa' ? 'en' : 'fa'} className="icon-btn text-xs font-bold" aria-label={locale === 'fa' ? 'English' : 'فارسی'}>{locale === 'fa' ? 'EN' : 'FA'}</Link>
          {status === 'authed' ? (
            <>
              <Link href={staff ? '/admin' : '/account'} className="icon-btn" aria-label={staff ? t('nav.admin') : t('nav.account')}><UserIcon className="h-5 w-5" /></Link>
              <button className="icon-btn hidden md:inline-flex" aria-label={t('nav.logout')} onClick={() => logout().then(() => router.push('/'))}><LogOut className="h-5 w-5" /></button>
            </>
          ) : status === 'guest' ? (
            <Link href="/login" className="icon-btn" aria-label={t('nav.login')}><LogIn className="h-5 w-5" /></Link>
          ) : null}
          <button className="icon-btn" onClick={openCart} aria-label={`${t('nav.cart')} (${mounted ? count : 0})`}>
            <ShoppingBag className="h-5 w-5" />
            {mounted && count > 0 && (
              <m.span key={count} initial={{ scale: 1.7 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }} className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-fg">{f.num(count)}</m.span>
            )}
          </button>
        </div>
      </div>

      <Modal open={menu} onClose={() => setMenu(false)} side="end" label={t('header.menu')}>
        <nav className="flex flex-col gap-1 p-6 pt-16 text-lg">
          {LINKS.map((l) => (<Link key={l.key} href={l.href} className={`rounded-lg px-3 py-3 hover:bg-neutral-100 ${l.hot ? 'text-danger' : ''}`}>{t(l.key)}</Link>))}
          <hr className="my-3" />
          <Link href="/account/wishlist" className="rounded-lg px-3 py-3 hover:bg-neutral-100">{t('nav.wishlist')}</Link>
          <Link href="/account/orders" className="rounded-lg px-3 py-3 hover:bg-neutral-100">{t('nav.orders')}</Link>
          <div className="mt-3 flex items-center justify-between px-3 text-sm"><span>{t('theme.label')}</span><ThemeToggle /></div>
          {status === 'authed' && <button className="mt-2 rounded-lg px-3 py-3 text-start text-danger hover:bg-neutral-100" onClick={() => logout().then(() => router.push('/'))}>{t('nav.logout')}</button>}
        </nav>
      </Modal>
      <SearchDialog />
    </header>
  );
}
