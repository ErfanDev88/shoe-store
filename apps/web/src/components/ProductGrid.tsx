import type { Product } from '@/lib/types';
import { Reveal } from './motion/Reveal';
import ProductCard from './ProductCard';

export default function ProductGrid({ items, cols = 4 }: { items: Product[]; cols?: 3 | 4 }) {
  return (
    <div className={`grid grid-cols-2 gap-x-4 gap-y-9 md:grid-cols-3 ${cols === 4 ? 'lg:grid-cols-4' : ''}`}>
      {items.map((p, i) => (<Reveal key={p._id} delay={Math.min(i % 4, 3) * 0.06} y={18}><ProductCard p={p} priority={i < 4} /></Reveal>))}
    </div>
  );
}
