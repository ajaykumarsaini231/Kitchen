import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { startMemoryMongo, stopMemoryMongo } from '../src/memoryDb.js';
import { connectDB } from '../src/db.js';
import { ensureSeeded } from '../src/seedData.js';
import { ensureUsersSeeded } from '../src/seedUsers.js';
import { createApp } from '../src/app.js';

let app;

beforeAll(async () => {
  const uri = await startMemoryMongo();
  await connectDB(uri);
  await ensureSeeded();
  await ensureUsersSeeded();
  app = createApp();
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  await stopMemoryMongo();
});

async function login(email, password) {
  const res = await request(app).post('/api/auth/login').send({ email, password });
  return res.body.token;
}

describe('auth', () => {
  it('logs in an admin and returns a token + role', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@metnmat.com', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('admin');
  });

  it('rejects bad credentials (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@metnmat.com', password: 'wrong' });
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects malformed login body (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });
});

describe('dishes', () => {
  it('GET /api/dishes returns seeded dishes (public)', async () => {
    const res = await request(app).get('/api/dishes');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(50);
    expect(res.body[0]).toHaveProperty('dishId');
    expect(res.body[0]).toHaveProperty('isPublished');
    expect(res.body[0]).toHaveProperty('price');
  });

  it('rejects toggle without auth (401)', async () => {
    const res = await request(app).patch('/api/dishes/1/toggle');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHENTICATED');
  });

  it('admin can toggle a dish', async () => {
    const token = await login('admin@metnmat.com', 'admin123');
    const before = (await request(app).get('/api/dishes')).body.find(
      (d) => d.dishId === '1'
    ).isPublished;
    const res = await request(app)
      .patch('/api/dishes/1/toggle')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(!before);
  });

  it('viewer is forbidden from toggling (403)', async () => {
    const token = await login('viewer@metnmat.com', 'viewer123');
    const res = await request(app)
      .patch('/api/dishes/2/toggle')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('validates the explicit-set body (400)', async () => {
    const token = await login('admin@metnmat.com', 'admin123');
    const res = await request(app)
      .patch('/api/dishes/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ isPublished: 'yes' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('simulate-external flips a dish (public demo endpoint)', async () => {
    const before = (await request(app).get('/api/dishes')).body.find(
      (d) => d.dishId === '3'
    ).isPublished;
    const res = await request(app).post('/api/dishes/3/simulate-external');
    expect(res.status).toBe(200);
    expect(res.body.isPublished).toBe(!before);
  });

  it('returns 404 for an unknown dish toggle', async () => {
    const token = await login('admin@metnmat.com', 'admin123');
    const res = await request(app)
      .patch('/api/dishes/does-not-exist/toggle')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('CRUD + pagination', () => {
  it('paginates with X-Total-Count', async () => {
    const res = await request(app).get('/api/dishes?limit=5&page=1');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(5);
    expect(Number(res.headers['x-total-count'])).toBeGreaterThanOrEqual(12);
  });

  it('filters by published and search query', async () => {
    const res = await request(app).get('/api/dishes?published=true&q=paneer');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((d) => d.isPublished)).toBe(true);
    expect(res.body.every((d) => /paneer/i.test(d.dishName))).toBe(true);
  });

  it('admin can create, update, then soft-delete a dish', async () => {
    const token = await login('admin@metnmat.com', 'admin123');
    const auth = { Authorization: `Bearer ${token}` };

    const created = await request(app)
      .post('/api/dishes')
      .set(auth)
      .send({ dishName: 'Test Tiramisu', isPublished: false });
    expect(created.status).toBe(201);
    expect(created.body.dishName).toBe('Test Tiramisu');
    const id = created.body.dishId;

    const updated = await request(app)
      .put(`/api/dishes/${id}`)
      .set(auth)
      .send({ dishName: 'Updated Tiramisu', isPublished: true });
    expect(updated.status).toBe(200);
    expect(updated.body.dishName).toBe('Updated Tiramisu');
    expect(updated.body.isPublished).toBe(true);

    const del = await request(app).delete(`/api/dishes/${id}`).set(auth);
    expect(del.status).toBe(200);

    // Soft-deleted dish no longer appears in listings.
    const list = await request(app).get('/api/dishes');
    expect(list.body.find((d) => d.dishId === id)).toBeUndefined();
  });

  it('blocks create for non-admins (viewer 403)', async () => {
    const token = await login('viewer@metnmat.com', 'viewer123');
    const res = await request(app)
      .post('/api/dishes')
      .set('Authorization', `Bearer ${token}`)
      .send({ dishName: 'Nope' });
    expect(res.status).toBe(403);
  });

  it('GET /api/dishes/:dishId returns a single dish (public)', async () => {
    const res = await request(app).get('/api/dishes/1');
    expect(res.status).toBe(200);
    expect(res.body.dishId).toBe('1');
    expect(res.body).toHaveProperty('dishName');
  });

  it('GET /api/dishes/:dishId returns 404 for unknown dish', async () => {
    const res = await request(app).get('/api/dishes/nope-404');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
  });
});
