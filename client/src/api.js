import { getToken } from './auth.js';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Login failed (${res.status})`);
  return data; // { token, user }
}

export async function fetchDishes() {
  const res = await fetch(`${API_URL}/api/dishes`);
  if (!res.ok) throw new Error(`Failed to fetch dishes (${res.status})`);
  return res.json();
}

export async function createDish({ dishName, price, imageUrl, description, isPublished }) {
  const res = await fetch(`${API_URL}/api/dishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ dishName, price, imageUrl, description, isPublished }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Failed to add dish (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export async function toggleDish(dishId) {
  const res = await fetch(`${API_URL}/api/dishes/${dishId}/toggle`, {
    method: 'PATCH',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const err = new Error(`Failed to toggle dish (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * Demo helper: flips a dish via a direct DB write on the server, mimicking an
 * out-of-band backend change. The dashboard reacts through the change stream,
 * NOT through this response — so it proves the real-time path on screen.
 */
export async function simulateExternalChange(dishId) {
  const res = await fetch(`${API_URL}/api/dishes/${dishId}/simulate-external`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to simulate change (${res.status})`);
  return res.json();
}

export { API_URL };
