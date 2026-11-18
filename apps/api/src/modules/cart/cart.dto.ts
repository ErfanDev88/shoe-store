import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsMongoId, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class AddToCartDto {
  @IsMongoId() productId: string;
  @IsString() @MaxLength(40) sku: string;
  @IsInt() @Min(1) @Max(10) quantity: number;
}
export class SetQuantityDto {
  @IsInt() @Min(1) @Max(10) quantity: number;
}
export class MergeCartDto {
  @IsArray() @ArrayMaxSize(30) @ValidateNested({ each: true }) @Type(() => AddToCartDto) items: AddToCartDto[];
}
