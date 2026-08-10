import { request } from './client.js';

export function login(credentials) {
  return request('/auth/login', { method: 'POST', body: credentials, auth: false });
}

export function register(details) {
  return request('/auth/register', { method: 'POST', body: details, auth: false });
}

export function me() {
  return request('/auth/me');
}
