import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { ProductsService } from '../modules/catalog/products.service';
import { Product } from '../modules/catalog/schemas/product.schema';
import { TaxonomyService } from '../modules/catalog/taxonomy.service';

const COLORS = [
  { name: { fa: 'مشکی', en: 'Black' }, hex: '#111111' },
  { name: { fa: 'سفید', en: 'White' }, hex: '#f5f5f5' },
  { name: { fa: 'سرمه‌ای', en: 'Navy' }, hex: '#1f2a44' },
  { name: { fa: 'قهوه‌ای', en: 'Brown' }, hex: '#6b4423' },
  { name: { fa: 'قرمز', en: 'Red' }, hex: '#c0392b' },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  const model = app.get<Model<Product>>(getModelToken(Product.name));
  if (await model.estimatedDocumentCount()) {
    console.log('Products already exist - skipping demo seed.');
    return app.close();
  }
  const tax = app.get(TaxonomyService);
  const products = app.get(ProductsService);

  const brands = [];
  for (const [fa, en] of [['نایک', 'Nike'], ['آدیداس', 'Adidas'], ['پوما', 'Puma'], ['کلارک', 'Clarks']]) brands.push(await tax.create('brand', { name: { fa, en } }));
  const sport = await tax.create('category', { name: { fa: 'کفش ورزشی', en: 'Sneakers' } });
  const formal = await tax.create('category', { name: { fa: 'کفش رسمی', en: 'Formal' } });
  const boots = await tax.create('category', { name: { fa: 'بوت', en: 'Boots' } });
  const cats = [sport, formal, boots];

  const names: [string, string][] = [
    ['کتونی راحتی ایر', 'Air Comfort Sneaker'], ['کفش دویدن پرو', 'Pro Runner'], ['کتونی کلاسیک', 'Classic Sneaker'],
    ['کفش چرم رسمی', 'Leather Oxford'], ['کفش مجلسی', 'Dress Shoe'], ['بوت چرمی', 'Leather Boot'],
    ['نیم‌بوت زمستانی', 'Winter Ankle Boot'], ['کتونی اسپرت', 'Sport Lite'], ['کفش پیاده‌روی', 'Walker'], ['کتونی روزمره', 'Daily Sneaker'],
  ];
  let n = 0;
  for (const [fa, en] of names) {
    const i = n++;
    const colors = [COLORS[i % 5], COLORS[(i + 2) % 5]];
    await products.create({
      title: { fa, en },
      description: { fa: 'کفش راحت و با دوام، مناسب استفاده روزمره با زیره ضدلغزش.', en: 'Comfortable, durable shoe with a non-slip sole for everyday wear.' },
      brand: String(brands[i % brands.length]._id),
      category: String(cats[i % cats.length]._id),
      gender: (['men', 'women', 'unisex'] as const)[i % 3],
      material: i % 2 ? 'چرم طبیعی' : 'پارچه و مش', sole: 'لاستیک ضدلغزش', closureType: i % 2 ? 'بندی' : 'بدون بند', season: 'تمام فصول',
      tags: ['demo'], images: [],
      basePrice: 1_200_000 + i * 350_000, discountPercent: i % 3 === 0 ? 15 : 0, weightGram: 700 + (i % 4) * 150,
      variants: colors.flatMap((c, ci) => [39, 40, 41, 42, 43].map((size) => ({ sku: `DEMO${i + 1}-${ci}-${size}`, size, color: c, stock: (size + i) % 6 }))),
    });
  }
  console.log(`Demo data created: ${brands.length} brands, ${cats.length} categories, ${names.length} products (no images)`);
  await app.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
