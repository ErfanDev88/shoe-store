import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEnum, IsInt, IsMongoId, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min,
  ValidateNested,
} from 'class-validator';
import { LocalizedDto, LocalizedTextDto } from '../../common/dto/pagination.dto';
import { GENDERS, Gender } from './schemas/product.schema';

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const IMAGE = /^\/uploads\/[A-Za-z0-9._-]+\.webp$/;
const bool = ({ value }: { value: unknown }) => (value === 'true' ? true : value === 'false' ? false : value);

export class TaxonomyDto {
  @ValidateNested() @Type(() => LocalizedDto) name: LocalizedDto;
  @IsOptional() @Matches(SLUG, { message: 'INVALID_SLUG' }) @MaxLength(80) slug?: string;
  @IsOptional() @Matches(IMAGE, { message: 'INVALID_IMAGE' }) image?: string;
  @IsOptional() @IsMongoId() parent?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateTaxonomyDto extends PartialType(TaxonomyDto) {}

export class ColorDto {
  @ValidateNested() @Type(() => LocalizedDto) name: LocalizedDto;
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'INVALID_COLOR' }) hex: string;
}

export class VariantDto {
  @IsString() @Matches(/^[A-Za-z0-9._-]{2,40}$/, { message: 'INVALID_SKU' }) sku: string;
  @IsNumber() @Min(15) @Max(60) size: number;
  @ValidateNested() @Type(() => ColorDto) color: ColorDto;
  @IsInt() @Min(0) @Max(100000) stock: number;
}

export class CreateProductDto {
  @ValidateNested() @Type(() => LocalizedDto) title: LocalizedDto;
  @IsOptional() @Matches(SLUG, { message: 'INVALID_SLUG' }) @MaxLength(80) slug?: string;
  @IsOptional() @ValidateNested() @Type(() => LocalizedTextDto) description?: LocalizedTextDto;
  @IsMongoId() brand: string;
  @IsMongoId() category: string;
  @IsEnum(GENDERS) gender: Gender;
  @IsOptional() @IsString() @MaxLength(100) material?: string;
  @IsOptional() @IsString() @MaxLength(100) sole?: string;
  @IsOptional() @IsString() @MaxLength(100) closureType?: string;
  @IsOptional() @IsString() @MaxLength(100) season?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(40, { each: true }) tags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(10) @Matches(IMAGE, { each: true, message: 'INVALID_IMAGE' }) images?: string[];
  @IsInt() @Min(0) @Max(1_000_000_000) basePrice: number;
  @IsOptional() @IsInt() @Min(0) @Max(90) discountPercent?: number;
  @IsOptional() @IsInt() @Min(50) @Max(10000) weightGram?: number;
  @IsArray() @ArrayMaxSize(200) @ValidateNested({ each: true }) @Type(() => VariantDto) variants: VariantDto[];
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateProductDto extends PartialType(CreateProductDto) {}

export class SetStockDto {
  @IsString() sku: string;
  @IsInt() @Min(0) @Max(100000) stock: number;
}

export const SORTS = ['newest', 'price_asc', 'price_desc', 'best', 'rating'] as const;
export class ProductQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(60) limit: number = 12;
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @IsString() @MaxLength(80) brand?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsEnum(GENDERS) gender?: Gender;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() size?: number;
  @IsOptional() @Matches(/^#?[0-9a-fA-F]{6}$/) color?: string;
  @IsOptional() @Transform(bool) @IsBoolean() onSale?: boolean;
  @IsOptional() @Transform(bool) @IsBoolean() inStock?: boolean;
  @IsOptional() @IsEnum(SORTS) sort: (typeof SORTS)[number] = 'newest';
}
