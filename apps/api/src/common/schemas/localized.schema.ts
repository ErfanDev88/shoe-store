import { Schema } from 'mongoose';

export interface Localized {
  fa: string;
  en?: string;
}

export const LocalizedSchema = new Schema(
  {
    fa: { type: String, required: true, trim: true, maxlength: 200 },
    en: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { _id: false },
);

export const LocalizedTextSchema = new Schema(
  {
    fa: { type: String, default: '', trim: true, maxlength: 5000 },
    en: { type: String, default: '', trim: true, maxlength: 5000 },
  },
  { _id: false },
);
