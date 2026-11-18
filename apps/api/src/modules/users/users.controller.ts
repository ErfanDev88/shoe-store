import { Body, Controller, Delete, ForbiddenException, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AuthUser } from '../../common/types/auth.types';
import {
  CreateAddressDto,
  ListUsersQuery,
  UpdateActiveDto,
  UpdateAddressDto,
  UpdateProfileDto,
  UpdateRoleDto,
} from './users.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // ----- current user -----
  @Get('me')
  async me(@CurrentUser() auth: AuthUser) {
    const user = await this.users.findById(auth.id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return this.users.toPublic(user);
  }

  @Patch('me')
  async updateMe(@CurrentUser() auth: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.toPublic(await this.users.updateProfile(auth.id, dto));
  }

  @Get('me/addresses')
  async addresses(@CurrentUser() auth: AuthUser) {
    const user = await this.users.findById(auth.id);
    if (!user) throw new NotFoundException('USER_NOT_FOUND');
    return this.users.toPublic(user).addresses;
  }

  @Post('me/addresses')
  async addAddress(@CurrentUser() auth: AuthUser, @Body() dto: CreateAddressDto) {
    return this.users.toPublic(await this.users.addAddress(auth.id, dto)).addresses;
  }

  @Patch('me/addresses/:addressId')
  async updateAddress(
    @CurrentUser() auth: AuthUser,
    @Param('addressId', ParseObjectIdPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.users.toPublic(await this.users.updateAddress(auth.id, addressId, dto)).addresses;
  }

  @Delete('me/addresses/:addressId')
  async removeAddress(
    @CurrentUser() auth: AuthUser,
    @Param('addressId', ParseObjectIdPipe) addressId: string,
  ) {
    return this.users.toPublic(await this.users.removeAddress(auth.id, addressId)).addresses;
  }

  // ----- admin -----
  @Roles(Role.Admin)
  @Get()
  list(@Query() query: ListUsersQuery) {
    return this.users.list(query);
  }

  @Roles(Role.Admin)
  @Patch(':id/role')
  async setRole(
    @CurrentUser() auth: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    if (id === auth.id) throw new ForbiddenException('CANNOT_MODIFY_SELF');
    return this.users.toPublic(await this.users.updateAccess(id, { role: dto.role }));
  }

  @Roles(Role.Admin)
  @Patch(':id/active')
  async setActive(
    @CurrentUser() auth: AuthUser,
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateActiveDto,
  ) {
    if (id === auth.id) throw new ForbiddenException('CANNOT_MODIFY_SELF');
    return this.users.toPublic(await this.users.updateAccess(id, { isActive: dto.isActive }));
  }
}
