import * as authService from '../services/auth.service.js';

export async function register(req, res, next) {
  try {
    const { user, token } = await authService.registerUser(req.body);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, token } = await authService.loginUser(req.body);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.auth.sub);
    res.json({ user });
  } catch (err) {
    next(err);
  }
}
