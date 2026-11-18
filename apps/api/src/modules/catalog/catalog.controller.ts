import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreateProductDto, ProductQuery, SetStockDto, TaxonomyDto, UpdateProductDto, UpdateTaxonomyDto } from './catalog.dto';
import { ProductsService } from './products.service';
import { TaxonomyService } from './taxonomy.service';

// ---------- public ----------
@Public()
@Controller()
export class CatalogPublicController {
  constructor(
    private readonly taxonomy: TaxonomyService,
    private readonly products: ProductsService,
  ) {}

  @Get('brands') brands() { return this.taxonomy.list('brand', true); }
  @Get('categories') categories() { return this.taxonomy.list('category', true); }
  @Get('products') list(@Query() q: ProductQuery) { return this.products.listPublic(q); }
  @Get('products/facets') facets() { return this.products.facets(); }
  @Get('products/:slug') one(@Param('slug') slug: string) { return this.products.getBySlug(slug); }
  @Get('products/:slug/related') related(@Param('slug') slug: string) { return this.products.related(slug); }
}

// ---------- admin / content manager ----------
@Roles(Role.Admin, Role.Content)
@Controller('admin')
export class CatalogAdminController {
  constructor(
    private readonly taxonomy: TaxonomyService,
    private readonly products: ProductsService,
  ) {}

  @Get('brands') brands() { return this.taxonomy.list('brand', false); }
  @Post('brands') createBrand(@Body() dto: TaxonomyDto) { return this.taxonomy.create('brand', dto); }
  @Patch('brands/:id') updateBrand(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaxonomyDto) { return this.taxonomy.update('brand', id, dto); }
  @Delete('brands/:id') removeBrand(@Param('id', ParseObjectIdPipe) id: string) { return this.taxonomy.remove('brand', id); }

  @Get('categories') categories() { return this.taxonomy.list('category', false); }
  @Post('categories') createCategory(@Body() dto: TaxonomyDto) { return this.taxonomy.create('category', dto); }
  @Patch('categories/:id') updateCategory(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateTaxonomyDto) { return this.taxonomy.update('category', id, dto); }
  @Delete('categories/:id') removeCategory(@Param('id', ParseObjectIdPipe) id: string) { return this.taxonomy.remove('category', id); }

  @Get('products') list(@Query() q: ProductQuery) { return this.products.adminList(q); }
  @Get('products/:id') one(@Param('id', ParseObjectIdPipe) id: string) { return this.products.adminGet(id); }
  @Post('products') create(@Body() dto: CreateProductDto) { return this.products.create(dto); }
  @Patch('products/:id') update(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }
  @HttpCode(200) @Delete('products/:id') archive(@Param('id', ParseObjectIdPipe) id: string) { return this.products.archive(id); }
  @Patch('products/:id/stock') stock(@Param('id', ParseObjectIdPipe) id: string, @Body() dto: SetStockDto) { return this.products.setStock(id, dto.sku, dto.stock); }
}
