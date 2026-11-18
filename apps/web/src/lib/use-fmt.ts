'use client';
import { useLocale, useTranslations } from 'next-intl';
import { fmtDate, fmtDateTime, fmtNum, fmtPrice, loc } from './format';
import type { Localized } from './types';

export function useFmt() {
  const locale = useLocale();
  const t = useTranslations();
  return {
    locale,
    price: (n: number) => fmtPrice(n, locale, t('common.toman')),
    num: (n: number) => fmtNum(n, locale),
    date: (d: string | Date) => fmtDate(d, locale),
    dateTime: (d: string | Date) => fmtDateTime(d, locale),
    text: (l: Localized | undefined) => loc(l, locale),
  };
}

/** Maps an API error (code) to a translated message. */
export function useErrorText() {
  const t = useTranslations();
  return (e: unknown) => {
    const code = (e as { code?: string })?.code;
    return code && t.has(`errors.${code}`) ? t(`errors.${code}`) : t('errors.UNKNOWN');
  };
}
