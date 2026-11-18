import { PartialType } from '@nestjs/mapped-types';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import { normalizeIranMobile } from '../../common/utils/phone.util';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const phone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (normalizeIranMobile(value) ?? value) : value;

export class UpdateProfileDto {
  @IsOptional() @Transform(trim) @IsString() @Length(1, 50) firstName?: string;
  @IsOptional() @Transform(trim) @IsString() @Length(1, 50) lastName?: string;
}

export class CreateAddressDto {
  @Transform(trim) @IsString() @Length(1, 60) title: string;
  @Transform(trim) @IsString() @Length(1, 100) receiver: string;
  @Transform(phone) @Matches(/^09\d{9}$/, { message: 'INVALID_PHONE' }) phone: string;
  @Transform(trim) @IsString() @Length(1, 60) province: string;
  @Transform(trim) @IsString() @Length(1, 60) city: string;
  @Transform(trim) @IsString() @Length(5, 500) address: string;
  @Transform(trim) @Matches(/^\d{10}$/, { message: 'INVALID_POSTAL_CODE' }) postalCode: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}

export class ListUsersQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit: number = 20;
  @IsOptional() @Transform(trim) @IsString() @MaxLength(100) search?: string;
}

export class UpdateRoleDto {
  @IsEnum(Role) role: Role;
}

export class UpdateActiveDto {
  @IsBoolean() isActive: boolean;
}
