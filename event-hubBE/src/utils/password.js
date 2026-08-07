import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export function hashPassword(plainText) {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export function comparePassword(plainText, hash) {
  return bcrypt.compare(plainText, hash);
}
