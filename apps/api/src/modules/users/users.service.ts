import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { Role } from '../../common/enums/role.enum';
import { Address, User, UserDocument } from './schemas/user.schema';
import { CreateAddressDto, ListUsersQuery, UpdateAddressDto, UpdateProfileDto } from './users.dto';

const MAX_ADDRESSES = 10;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;
const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly model: Model<User>) {}

  // ---------- lookups ----------
  findById(id: string) {
    return this.model.findById(id).exec();
  }
  findByPhone(phone: string) {
    return this.model.findOne({ phone }).exec();
  }
  findByEmailWithPassword(email: string) {
    return this.model.findOne({ email }).select('+passwordHash').exec();
  }
  async emailExists(email: string) {
    return !!(await this.model.exists({ email }));
  }

  // ---------- creation / auth state ----------
  createWithPhone(phone: string) {
    return this.model.create({ phone, isPhoneVerified: true });
  }
  createWithEmail(data: { email: string; passwordHash: string; firstName?: string; lastName?: string }) {
    return this.model.create(data);
  }
  markPhoneVerified(id: string) {
    return this.model.findByIdAndUpdate(id, { $set: { isPhoneVerified: true } }, { new: true }).exec();
  }

  async registerFailedLogin(id: string) {
    const user = await this.model
      .findByIdAndUpdate(id, { $inc: { failedLoginAttempts: 1 } }, { new: true })
      .exec();
    if (user && user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      await this.model.updateOne(
        { _id: id },
        { $set: { lockUntil: new Date(Date.now() + LOCK_MS), failedLoginAttempts: 0 } },
      );
    }
  }
  async resetLoginFailures(id: string) {
    await this.model.updateOne({ _id: id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: 1 } });
  }
  async bumpTokenVersion(id: string) {
    await this.model.updateOne({ _id: id }, { $inc: { tokenVersion: 1 } });
  }

  findByEmail(email: string) {
    return this.model.findOne({ email }).exec();
  }
  findByIdWithPassword(id: string) {
    return this.model.findById(id).select('+passwordHash').exec();
  }
  markEmailVerified(id: string) {
    return this.model.updateOne({ _id: id }, { $set: { isEmailVerified: true } });
  }
  /** Sets a new password, clears lockout and invalidates all existing access tokens. */
  async setPassword(id: string, passwordHash: string) {
    await this.model.updateOne(
      { _id: id },
      { $set: { passwordHash, failedLoginAttempts: 0 }, $unset: { lockUntil: 1 }, $inc: { tokenVersion: 1 } },
    );
  }

  // ---------- profile ----------
  async updateProfile(id: string, dto: UpdateProfileDto) {
    const user = await this.model.findByIdAndUpdate(id, { $set: dto }, { new: true }).exec();
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  // ---------- addresses (always scoped to the owner => no IDOR) ----------
  private async requireUser(id: string): Promise<UserDocument> {
    const user = await this.model.findById(id).exec();
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }
  private ensureOneDefault(user: UserDocument) {
    if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) {
      user.addresses[0].isDefault = true;
    }
  }

  async addAddress(userId: string, dto: CreateAddressDto) {
    const user = await this.requireUser(userId);
    if (user.addresses.length >= MAX_ADDRESSES) throw new BadRequestException('ADDRESS_LIMIT_REACHED');
    const makeDefault = !!dto.isDefault || user.addresses.length === 0;
    if (makeDefault) user.addresses.forEach((a) => (a.isDefault = false));
    user.addresses.push({ ...dto, isDefault: makeDefault } as Address);
    await user.save();
    return user;
  }

  async updateAddress(userId: string, addressId: string, dto: UpdateAddressDto) {
    const user = await this.requireUser(userId);
    const addr = user.addresses.find((a) => String(a._id) === addressId);
    if (!addr) throw new NotFoundException('ADDRESS_NOT_FOUND');
    const { isDefault, ...fields } = dto;
    Object.assign(addr, fields);
    if (isDefault === true) user.addresses.forEach((a) => (a.isDefault = a === addr));
    else if (isDefault === false) addr.isDefault = false;
    this.ensureOneDefault(user);
    await user.save();
    return user;
  }

  async removeAddress(userId: string, addressId: string) {
    const user = await this.requireUser(userId);
    if (!user.addresses.some((a) => String(a._id) === addressId)) {
      throw new NotFoundException('ADDRESS_NOT_FOUND');
    }
    user.addresses = user.addresses.filter((a) => String(a._id) !== addressId);
    this.ensureOneDefault(user);
    await user.save();
    return user;
  }

  // ---------- admin ----------
  async list(query: ListUsersQuery) {
    const filter: FilterQuery<User> = {};
    if (query.search) {
      const re = new RegExp(escapeRegex(query.search), 'i');
      filter.$or = [{ phone: re }, { email: re }, { firstName: re }, { lastName: re }];
    }
    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((query.page - 1) * query.limit)
        .limit(query.limit)
        .exec(),
      this.model.countDocuments(filter),
    ]);
    return { items: items.map((u) => this.toPublic(u)), total, page: query.page, limit: query.limit };
  }

  /** Role/active changes bump tokenVersion, so the user's existing tokens stop working at once. */
  async updateAccess(id: string, patch: { role?: Role; isActive?: boolean }) {
    const user = await this.model
      .findByIdAndUpdate(id, { $set: patch, $inc: { tokenVersion: 1 } }, { new: true })
      .exec();
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return user;
  }

  /** Used by the seed script. */
  ensureAdmin(phone: string, email?: string, passwordHash?: string) {
    const set: Record<string, unknown> = { role: Role.Admin, isPhoneVerified: true, isActive: true };
    if (email) set.email = email;
    if (passwordHash) set.passwordHash = passwordHash;
    return this.model.findOneAndUpdate({ phone }, { $set: set }, { upsert: true, new: true }).exec();
  }

  // ---------- serialization (never leaks passwordHash, lock state, tokenVersion) ----------
  toPublic(u: UserDocument) {
    return {
      id: u.id as string,
      phone: u.phone,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: u.role,
      isPhoneVerified: u.isPhoneVerified,
      isEmailVerified: u.isEmailVerified,
      isActive: u.isActive,
      addresses: (u.addresses ?? []).map((a) => ({
        id: String(a._id),
        title: a.title,
        receiver: a.receiver,
        phone: a.phone,
        province: a.province,
        city: a.city,
        address: a.address,
        postalCode: a.postalCode,
        isDefault: a.isDefault,
      })),
    };
  }
}
