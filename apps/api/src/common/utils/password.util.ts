import * as argon2 from 'argon2';

// OWASP-recommended argon2id parameters
const options = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 };

export const hashPassword = (password: string) => argon2.hash(password, options);

export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password).catch(() => false);
