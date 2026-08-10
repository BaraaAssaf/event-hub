import { request } from './client.js';

export function topVenues() {
  return request('/stats/top-venues');
}
