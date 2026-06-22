import { API_URL } from './config';

const sortByIdNumeric = (a, b) =>
  a.dishId.localeCompare(b.dishId, undefined, { numeric: true });

/** Published dishes for the public menu (ISR-cached on the server). */
export async function getPublishedDishes() {
  try {
    const res = await fetch(`${API_URL}/api/dishes?published=true`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data.sort(sortByIdNumeric) : [];
  } catch {
    return [];
  }
}

/** Single dish by id (server-side). Returns null if missing. */
export async function getDish(dishId) {
  try {
    const res = await fetch(`${API_URL}/api/dishes/${encodeURIComponent(dishId)}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/** Client-side fetch (no cache) used by the real-time refresher. */
export async function fetchPublishedDishesClient() {
  const res = await fetch(`${API_URL}/api/dishes?published=true`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load menu');
  const data = await res.json();
  return Array.isArray(data) ? data.sort(sortByIdNumeric) : [];
}

async function postJson(path, payload) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const createOrder = (payload) => postJson('/api/orders', payload);
export const createReservation = (payload) => postJson('/api/reservations', payload);

export async function getOrder(orderNumber) {
  const res = await fetch(`${API_URL}/api/orders/${orderNumber}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}
