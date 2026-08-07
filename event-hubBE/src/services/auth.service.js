import { User } from '../models/User.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';

function toAuthPayload(user) {
  return { sub: user.id, role: user.role };
}

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const passwordHash = await hashPassword(password);
  const user = await User.create({ name, email, passwordHash, role });

  const token = signToken(toAuthPayload(user));
  return { user, token };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const token = signToken(toAuthPayload(user));
  return { user, token };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  return user;
}
