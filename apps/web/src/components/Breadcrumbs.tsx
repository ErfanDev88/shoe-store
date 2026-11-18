import { ChevronRight } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/routing';

export default async function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const t = await getTranslations();
  const all = [{ href: '/', label: t('nav.home') }, ...items];
  return (
    <nav aria-label="breadcrumb" className="mb-6 text-sm text-neutral-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {all.map((it, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {it.href && i < all.length - 1 ? <Link href={it.href} className="link-u hover:text-fg">{it.label}</Link> : <span aria-current={i === all.length - 1 ? 'page' : undefined} className={i === all.length - 1 ? 'text-fg' : ''}>{it.label}</span>}
            {i < all.length - 1 && <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />}
          </li>
        ))}
      </ol>
    </nav>
  );
}
