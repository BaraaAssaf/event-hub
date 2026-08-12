import * as authService from '../services/auth.service.js';
import { setAuthCookie, clearAuthCookie } from '../utils/authCookie.js';

export async function register(req, res) {
  const { user, token } = await authService.registerUser(req.body);
  setAuthCookie(res, token);
  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const { user, token } = await authService.loginUser(req.body);
  setAuthCookie(res, token);
  res.json({ user, token });
}

export async function logout(req, res) {
  clearAuthCookie(res);
  res.status(204).send();
}

export async function me(req, res) {
  const user = await authService.getUserById(req.auth.sub);
  res.json({ user });
}
