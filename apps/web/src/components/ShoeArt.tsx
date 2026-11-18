/** Theme-aware vector sneaker (used for hero, empty states and image placeholders). Replace the hero with real photography via NEXT_PUBLIC_HERO_IMAGE. */
export default function ShoeArt({ className = '', title = 'Sneaker' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 640 360" className={className} role="img" aria-label={title} fill="none">
      <ellipse cx="330" cy="326" rx="250" ry="14" fill="rgb(var(--fg) / .14)" />
      {/* outsole + midsole */}
      <path d="M58 268c0 24 30 40 80 40h384c58 0 84-18 78-46H58z" fill="rgb(var(--fg))" />
      <path d="M66 244l530 6c6 6 6 12 4 16H60c-2-8 0-16 6-22z" fill="rgb(var(--surface))" stroke="rgb(var(--n-300))" strokeWidth="1.500" />
      {/* upper */}
      <path d="M84 246c-4-46 14-88 48-108 20-12 38-10 52-22l22-26c10-10 24-10 36-2l24 18c30 18 70 24 110 44 56 28 126 38 172 62 30 16 44 26 48 38z" fill="rgb(var(--accent))" />
      {/* heel + toe caps */}
      <path d="M84 246c-4-32 2-60 16-82l28 6c-10 20-12 48-6 76z" fill="rgb(var(--fg))" opacity=".88" />
      <path d="M470 196c50 8 96 24 124 52l-74-2c-14-16-30-34-50-50z" fill="rgb(var(--fg))" opacity=".9" />
      {/* collar, tongue, laces */}
      <path d="M186 118c14 6 36 4 50-10l-30-18z" fill="rgb(var(--fg))" />
      <path d="M214 84c10-22 32-32 48-24 6 4 6 14 0 20l-20 10z" fill="rgb(var(--n-300))" />
      {[0, 1, 2, 3, 4].map((i) => (
        <path key={i} d={`M${254 + i * 25} ${116 + i * 11}l20-20`} stroke="rgb(var(--surface))" strokeWidth="6" strokeLinecap="round" />
      ))}
      {/* side stripe */}
      <path d="M140 232c110-28 240-18 360 8" stroke="rgb(var(--surface))" strokeWidth="9" strokeLinecap="round" opacity=".92" />
      {/* tread */}
      {Array.from({ length: 20 }, (_, i) => (<path key={i} d={`M${90 + i * 22} 282v14`} stroke="rgb(var(--surface))" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round" />))}
    </svg>
  );
}
