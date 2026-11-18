export default function Marquee({ words }: { words: string[] }) {
  const list = words.length ? words : ['SOLE', 'STORE'];
  const row = Array.from({ length: Math.max(2, Math.ceil(8 / list.length)) }, () => list).flat();
  return (
    <div className="overflow-hidden border-y py-5" aria-hidden="true">
      <div className="marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center gap-14">
            {row.map((w, i) => (<span key={i} className="display flex items-center gap-14 whitespace-nowrap text-3xl text-neutral-300 md:text-5xl">{w}<span className="text-accent">✦</span></span>))}
          </div>
        ))}
      </div>
    </div>
  );
}
