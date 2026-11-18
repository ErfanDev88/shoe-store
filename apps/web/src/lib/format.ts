import type { Localized } from './types';

export const loc = (l: Localized | undefined, locale: string) => (locale === 'en' && l?.en ? l.en : (l?.fa ?? ''));
const tag = (locale: string) => (locale === 'fa' ? 'fa-IR' : 'en-US');
export const fmtNum = (n: number, locale: string) => n.toLocaleString(tag(locale));
export const fmtPrice = (n: number, locale: string, unit: string) => `${fmtNum(n, locale)} ${unit}`;
export const fmtDate = (d: string | Date, locale: string) =>
  new Date(d).toLocaleDateString(tag(locale), { year: 'numeric', month: 'long', day: 'numeric' });
export const fmtDateTime = (d: string | Date, locale: string) =>
  new Date(d).toLocaleString(tag(locale), { dateStyle: 'medium', timeStyle: 'short' });

export const PROVINCES = [
  'آذربایجان شرقی','آذربایجان غربی','اردبیل','اصفهان','البرز','ایلام','بوشهر','تهران','چهارمحال و بختیاری','خراسان جنوبی',
  'خراسان رضوی','خراسان شمالی','خوزستان','زنجان','سمنان','سیستان و بلوچستان','فارس','قزوین','قم','کردستان','کرمان',
  'کرمانشاه','کهگیلویه و بویراحمد','گلستان','گیلان','لرستان','مازندران','مرکزی','هرمزگان','همدان','یزد',
];

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Converts Persian/Arabic digits typed by users to ASCII digits. */
export const toEnDigits = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d))).replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d)));
