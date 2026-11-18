import { OmitType, PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Matches, Max, Min } from 'class-validator';

const upper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);

export class CreateCouponDto {
  @Transform(upper) @IsString() @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'INVALID_COUPON_CODE' }) code: string;
  @IsEnum(['percent', 'fixed']) type: 'percent' | 'fixed';
  @IsInt() @Min(1) @Max(1_000_000_000) value: number;
  @IsOptional() @IsInt() @Min(0) minOrder?: number;
  @IsOptional() @IsInt() @Min(1) maxDiscount?: number;
  @IsOptional() @IsInt() @Min(1) usageLimit?: number;
  @IsOptional() @IsInt() @Min(1) perUserLimit?: number;
  @IsOptional() @IsDateString() startsAt?: string;
  @IsOptional() @IsDateString() expiresAt?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
export class UpdateCouponDto extends PartialType(OmitType(CreateCouponDto, ['code'] as const)) {}
export class CouponCodeDto {
  @Transform(upper) @IsString() @Matches(/^[A-Z0-9_-]{3,30}$/, { message: 'INVALID_COUPON_CODE' }) code: string;
}
