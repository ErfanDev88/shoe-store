import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { uniqueSlug } from '../../common/utils/slug.util';
import { TaxonomyDto, UpdateTaxonomyDto } from './catalog.dto';
import { Product } from './schemas/product.schema';
import { Brand, Category } from './schemas/taxonomy.schemas';

export type Kind = 'brand' | 'category';

@Injectable()
export class TaxonomyService {
  constructor(
    @InjectModel(Brand.name) private readonly brands: Model<Brand>,
    @InjectModel(Category.name) private readonly categories: Model<Category>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
  ) {}

  private model(kind: Kind): Model<any> {
    return kind === 'brand' ? this.brands : this.categories;
  }

  list(kind: Kind, onlyActive: boolean) {
    return this.model(kind).find(onlyActive ? { isActive: true } : {}).sort({ 'name.fa': 1 }).lean();
  }

  async create(kind: Kind, dto: TaxonomyDto) {
    const model = this.model(kind);
    const slug = await uniqueSlug(dto.slug ?? dto.name.en, async (s) => !!(await model.exists({ slug: s })));
    const data: Record<string, unknown> = { name: dto.name, slug, image: dto.image, isActive: dto.isActive ?? true };
    if (kind === 'category') data.parent = await this.checkParent(dto.parent);
    return model.create(data);
  }

  async update(kind: Kind, id: string, dto: UpdateTaxonomyDto) {
    const model = this.model(kind);
    const doc = await model.findById(id);
    if (!doc) throw new NotFoundException('NOT_FOUND');
    if (dto.slug && dto.slug !== doc.slug) {
      if (await model.exists({ slug: dto.slug })) throw new ConflictException('SLUG_TAKEN');
      doc.slug = dto.slug;
    }
    if (dto.name) doc.name = dto.name;
    if (dto.image !== undefined) doc.image = dto.image;
    if (dto.isActive !== undefined) doc.isActive = dto.isActive;
    if (kind === 'category' && dto.parent !== undefined) {
      if (dto.parent === id) throw new BadRequestException('INVALID_PARENT');
      doc.parent = await this.checkParent(dto.parent);
    }
    return doc.save();
  }

  async remove(kind: Kind, id: string) {
    const used = await this.products.exists(kind === 'brand' ? { brand: id } : { category: id });
    if (used) throw new BadRequestException('IN_USE'); // deactivate instead
    if (kind === 'category' && (await this.categories.exists({ parent: id }))) throw new BadRequestException('HAS_CHILDREN');
    const res = await this.model(kind).deleteOne({ _id: id });
    if (!res.deletedCount) throw new NotFoundException('NOT_FOUND');
    return { deleted: true };
  }

  private async checkParent(parent?: string) {
    if (!parent) return null;
    const p = await this.categories.findById(parent).lean();
    if (!p) throw new BadRequestException('INVALID_PARENT');
    if (p.parent) throw new BadRequestException('MAX_DEPTH_2'); // keep the tree two levels deep
    return p._id;
  }
}
