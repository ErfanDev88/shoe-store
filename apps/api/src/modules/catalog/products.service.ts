import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { escapeRegex } from '../../common/dto/pagination.dto';
import { isDuplicateKey, uniqueSlug } from '../../common/utils/slug.util';
import { CreateProductDto, ProductQuery, UpdateProductDto } from './catalog.dto';
import { Product } from './schemas/product.schema';
import { Brand, Category } from './schemas/taxonomy.schemas';

const final = (base: number, discount: number) => Math.round((base * (100 - discount)) / 100);
const POPULATE = [
  { path: 'brand', select: 'name slug' },
  { path: 'category', select: 'name slug' },
];

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private readonly model: Model<Product>,
    @InjectModel(Brand.name) private readonly brands: Model<Brand>,
    @InjectModel(Category.name) private readonly categories: Model<Category>,
  ) {}

  // ---------------- public ----------------
  private async buildFilter(q: ProductQuery, onlyActive: boolean): Promise<FilterQuery<Product>> {
    const filter: FilterQuery<Product> = onlyActive ? { isActive: true } : {};
    const and: FilterQuery<Product>[] = [];

    if (q.q) {
      const re = new RegExp(escapeRegex(q.q), 'i');
      and.push({ $or: [{ 'title.fa': re }, { 'title.en': re }, { tags: re }] });
    }
    if (q.brand) {
      const b = await this.brands.findOne({ slug: q.brand }).select('_id').lean();
      and.push({ brand: b?._id ?? null });
    }
    if (q.category) {
      const c = await this.categories.findOne({ slug: q.category }).select('_id').lean();
      const ids = c ? [c._id, ...(await this.categories.find({ parent: c._id }).distinct('_id'))] : [];
      and.push({ category: { $in: ids } });
    }
    if (q.gender) and.push({ gender: { $in: [q.gender, 'unisex'] } });
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      and.push({ finalPrice: { ...(q.minPrice !== undefined && { $gte: q.minPrice }), ...(q.maxPrice !== undefined && { $lte: q.maxPrice }) } });
    }
    if (q.onSale) and.push({ discountPercent: { $gt: 0 } });

    const elem: Record<string, unknown> = {};
    if (q.size !== undefined) elem.size = q.size;
    if (q.color) elem['color.hex'] = new RegExp(`^#?${q.color.replace('#', '')}$`, 'i');
    if (q.inStock || q.size !== undefined || q.color) elem.stock = { $gt: 0 };
    if (Object.keys(elem).length) and.push({ variants: { $elemMatch: elem } });

    if (and.length) filter.$and = and;
    return filter;
  }

  async listPublic(q: ProductQuery) {
    const filter = await this.buildFilter(q, true);
    const sort: Record<string, 1 | -1> =
      { newest: { createdAt: -1 }, price_asc: { finalPrice: 1 }, price_desc: { finalPrice: -1 }, best: { soldCount: -1 }, rating: { ratingAvg: -1 } }[q.sort] as Record<string, 1 | -1>;
    const [items, total] = await Promise.all([
      this.model.find(filter).select('-description').sort({ ...sort, _id: 1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate(POPULATE).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) };
  }

  async getBySlug(slug: string) {
    const p = await this.model.findOne({ slug, isActive: true }).populate(POPULATE).lean();
    if (!p) throw new NotFoundException('PRODUCT_NOT_FOUND');
    return p;
  }

  async related(slug: string) {
    const p = await this.model.findOne({ slug, isActive: true }).select('category').lean();
    if (!p) return [];
    return this.model
      .find({ isActive: true, category: p.category, slug: { $ne: slug } })
      .select('-description').sort({ soldCount: -1 }).limit(4).populate(POPULATE).lean();
  }

  async facets() {
    const base = { isActive: true };
    const [sizes, colors, price] = await Promise.all([
      this.model.distinct('variants.size', base),
      this.model.aggregate([
        { $match: base }, { $unwind: '$variants' },
        { $group: { _id: { $toLower: '$variants.color.hex' }, name: { $first: '$variants.color.name' } } },
        { $project: { _id: 0, hex: '$_id', name: 1 } },
      ]),
      this.model.aggregate([{ $match: base }, { $group: { _id: null, min: { $min: '$finalPrice' }, max: { $max: '$finalPrice' } } }]),
    ]);
    return { sizes: (sizes as number[]).sort((a, b) => a - b), colors, priceRange: { min: price[0]?.min ?? 0, max: price[0]?.max ?? 0 } };
  }

  // ---------------- admin ----------------
  async adminList(q: ProductQuery) {
    const filter = await this.buildFilter(q, false);
    const [items, total] = await Promise.all([
      this.model.find(filter).select('-description').sort({ createdAt: -1 }).skip((q.page - 1) * q.limit).limit(q.limit).populate(POPULATE).lean(),
      this.model.countDocuments(filter),
    ]);
    return { items, total, page: q.page, limit: q.limit, pages: Math.ceil(total / q.limit) };
  }

  async adminGet(id: string) {
    const p = await this.model.findById(id).lean();
    if (!p) throw new NotFoundException('PRODUCT_NOT_FOUND');
    return p;
  }

  private assertVariants(variants: { sku: string }[]) {
    const skus = variants.map((v) => v.sku);
    if (new Set(skus).size !== skus.length) throw new BadRequestException('DUPLICATE_SKU');
  }
  private async assertRefs(brand?: string, category?: string) {
    if (brand && !(await this.brands.exists({ _id: brand }))) throw new BadRequestException('INVALID_BRAND');
    if (category && !(await this.categories.exists({ _id: category }))) throw new BadRequestException('INVALID_CATEGORY');
  }

  async create(dto: CreateProductDto) {
    this.assertVariants(dto.variants);
    await this.assertRefs(dto.brand, dto.category);
    const slug = await uniqueSlug(dto.slug ?? dto.title.en, async (s) => !!(await this.model.exists({ slug: s })));
    try {
      return await this.model.create({
        ...dto,
        slug,
        discountPercent: dto.discountPercent ?? 0,
        finalPrice: final(dto.basePrice, dto.discountPercent ?? 0),
      });
    } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('SKU_TAKEN');
      throw e;
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const doc = await this.model.findById(id);
    if (!doc) throw new NotFoundException('PRODUCT_NOT_FOUND');
    if (dto.variants) this.assertVariants(dto.variants);
    await this.assertRefs(dto.brand, dto.category);
    if (dto.slug && dto.slug !== doc.slug) {
      if (await this.model.exists({ slug: dto.slug })) throw new ConflictException('SLUG_TAKEN');
    }
    Object.assign(doc, dto);
    doc.finalPrice = final(doc.basePrice, doc.discountPercent);
    try {
      return await doc.save();
    } catch (e) {
      if (isDuplicateKey(e)) throw new ConflictException('SKU_TAKEN');
      throw e;
    }
  }

  /** "Delete" archives the product (orders keep their own snapshots); reactivate with PATCH isActive. */
  async archive(id: string) {
    const res = await this.model.updateOne({ _id: id }, { $set: { isActive: false } });
    if (!res.matchedCount) throw new NotFoundException('PRODUCT_NOT_FOUND');
    return { archived: true };
  }

  async setStock(id: string, sku: string, stock: number) {
    const res = await this.model.updateOne({ _id: id, 'variants.sku': sku }, { $set: { 'variants.$.stock': stock } });
    if (!res.matchedCount) throw new NotFoundException('VARIANT_NOT_FOUND');
    return { sku, stock };
  }
}
