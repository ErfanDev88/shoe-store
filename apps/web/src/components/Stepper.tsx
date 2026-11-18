import { useTranslations } from 'next-intl';

export default function Stepper({ step }: { step: 1 | 2 | 3 }) {
  const t = useTranslations();
  const steps = [t('cart.title'), t('checkout.title'), t('stepper.payment')];
  return (
    <ol className="mb-8 flex items-center gap-2 text-sm" aria-label="checkout steps">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none" aria-current={i + 1 === step ? 'step' : undefined}>
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${i + 1 <= step ? 'border-brand bg-brand text-brand-fg' : 'text-neutral-400'}`}>{i + 1}</span>
          <span className={i + 1 <= step ? 'font-semibold' : 'text-neutral-400'}>{s}</span>
          {i < steps.length - 1 && <span className={`h-px flex-1 ${i + 1 < step ? 'bg-brand' : 'bg-neutral-200'}`} />}
        </li>
      ))}
    </ol>
  );
}
