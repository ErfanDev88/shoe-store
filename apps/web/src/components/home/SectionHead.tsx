import { ArrowUpRight } from 'lucide-react';
import { Link } from '@/i18n/routing';

export default function SectionHead({ eyebrow, title, href, cta }: { eyebrow?: string; title: string; href?: string; cta?: string }) {
  return (
    <div className="mb-8 flex items-end justify-between gap-4">
      <div>{eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}<h2 className="text-3xl md:text-4xl">{title}</h2></div>
      {href && cta && <Link href={href} className="link-u flex items-center gap-1 whitespace-nowrap pb-1 text-sm font-medium">{cta}<ArrowUpRight className="h-4 w-4 rtl:-scale-x-100" /></Link>}
    </div>
  );
}
