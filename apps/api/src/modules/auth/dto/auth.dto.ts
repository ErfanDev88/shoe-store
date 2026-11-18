import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { normalizeIranMobile } from '../../../common/utils/phone.util';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const lowerEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;
const phone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? (normalizeIranMobile(value) ?? value) : value;

export class RequestOtpDto {
  @Transform(phone)
  @Matches(/^09\d{9}$/, { message: 'INVALID_PHONE' })
  phone: string;
}

export class VerifyOtpDto {
  @Transform(phone)
  @Matches(/^09\d{9}$/, { message: 'INVALID_PHONE' })
  phone: string;

  @Matches(/^\d{6}$/, { message: 'INVALID_CODE_FORMAT' })
  code: string;
}

export class RegisterDto {
  @Transform(lowerEmail) @IsEmail() @MaxLength(254) email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'PASSWORD_TOO_WEAK' })
  password: string;

  @IsOptional() @Transform(trim) @IsString() @Length(1, 50) firstName?: string;
  @IsOptional() @Transform(trim) @IsString() @Length(1, 50) lastName?: string;
}

export class LoginDto {
  @Transform(lowerEmail) @IsEmail() @MaxLength(254) email: string;
  @IsString() @MinLength(1) @MaxLength(128) password: string;
}

const PASSWORD_RULES = (target: object, key: string) => {
  MinLength(8)(target, key);
  MaxLength(128)(target, key);
  Matches(/(?=.*[A-Za-z])(?=.*\d)/, { message: 'PASSWORD_TOO_WEAK' })(target, key);
};

export class VerifyEmailDto {
  @Matches(/^[a-f\d]{64}$/i, { message: 'TOKEN_INVALID_OR_EXPIRED' }) token: string;
}

export class ForgotPasswordDto {
  @Transform(lowerEmail) @IsEmail() @MaxLength(254) email: string;
}

export class ResetPasswordDto {
  @Matches(/^[a-f\d]{64}$/i, { message: 'TOKEN_INVALID_OR_EXPIRED' }) token: string;
  @IsString() @PASSWORD_RULES password: string;
}

export class ChangePasswordDto {
  @IsString() @MinLength(1) @MaxLength(128) currentPassword: string;
  @IsString() @PASSWORD_RULES newPassword: string;
}
