import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CatalogAdminController, CatalogPublicController } from './catalog.controller';
import { ProductsService } from './products.service';
import { Product, ProductSchema } from './schemas/product.schema';
import { Brand, BrandSchema, Category, CategorySchema } from './schemas/taxonomy.schemas';
import { TaxonomyService } from './taxonomy.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: Brand.name, schema: BrandSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CatalogPublicController, CatalogAdminController],
  providers: [ProductsService, TaxonomyService],
  exports: [ProductsService, TaxonomyService],
})
export class CatalogModule {}
