export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || API_URL || 'http://localhost:4000';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
