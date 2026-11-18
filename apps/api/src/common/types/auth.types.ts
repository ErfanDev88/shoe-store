import { Role } from '../enums/role.enum';

export interface AuthUser {
  id: string;
  role: Role;
}

export interface AccessPayload {
  sub: string;
  role: Role;
  tv: number; // user.tokenVersion at issue time
}
