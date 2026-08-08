import * as authService from '../services/auth.service.js';

export async function register(req, res) {
  const { user, token } = await authService.registerUser(req.body);
  res.status(201).json({ user, token });
}

export async function login(req, res) {
  const { user, token } = await authService.loginUser(req.body);
  res.json({ user, token });
}

export async function me(req, res) {
  const user = await authService.getUserById(req.auth.sub);
  res.json({ user });
}
