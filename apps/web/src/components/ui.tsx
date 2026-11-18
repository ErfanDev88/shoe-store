import { Loader2, Star } from 'lucide-react';
import ShoeArt from './ShoeArt';

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (<div><label className="label">{label}</label>{children}{hint && <p className="mt-1 text-xs text-neutral-500">{hint}</p>}</div>);
}
export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((i) => (<Star key={i} width={size} height={size} className={i <= Math.round(value) ? 'fill-accent text-accent' : 'text-neutral-300'} />))}
    </span>
  );
}
export const Spinner = () => <Loader2 className="mx-auto my-12 h-6 w-6 animate-spin text-neutral-400" role="status" aria-label="loading" />;
export const ImagePlaceholder = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center justify-center bg-neutral-100 p-6 ${className}`}><ShoeArt className="w-full opacity-30" title="" /></div>
);
export const Empty = ({ text }: { text: string }) => <p className="py-12 text-center text-neutral-500">{text}</p>;
