export default function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`} aria-label="SOLE STORE">
      <svg viewBox="0 0 32 32" className="h-7 w-7" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="rgb(var(--brand))" />
        <path d="M6.5 21.5c3.5-6 8.5-7.5 12.5-4.5 2 1.5 4.500 2 6.500 1" fill="none" stroke="rgb(var(--brand-fg))" strokeWidth="2.600" strokeLinecap="round" />
        <path d="M6.500 25.500h19" stroke="rgb(var(--accent))" strokeWidth="2.600" strokeLinecap="round" />
      </svg>
      <span className="display text-lg leading-none tracking-[0.18em]" dir="ltr">SOLE<span className="font-normal opacity-60"> STORE</span></span>
    </span>
  );
}
