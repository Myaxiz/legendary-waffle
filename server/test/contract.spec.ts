import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createApp } from '../src/app';

// Do not modify this file.

let tmpDir: string;
let storeFile: string;
let app: ReturnType<typeof createApp>;

const validItem = {
  name: 'Milk',
  category: 'dairy',
  quantity: 1,
  unit: 'l',
};

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setUTCHours(12, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pantry-'));
  storeFile = path.join(tmpDir, 'store.json');
  process.env.STORE_PATH = storeFile;
  app = createApp();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  delete process.env.STORE_PATH;
});

describe('GET /api/items', () => {
  it('returns 200 and an array', async () => {
    const res = await request(app).get('/api/items');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/items', () => {
  it('creates an item with defaults', async () => {
    const res = await request(app).post('/api/items').send(validItem);
    expect([200, 201]).toContain(res.status);
    expect(res.body).toMatchObject({
      name: 'Milk',
      category: 'dairy',
      quantity: 1,
      unit: 'l',
      lowStockThreshold: 1,
    });
    expect(res.body.expiresAt ?? null).toBeNull();
    expect(typeof res.body.id).toBe('string');
  });

  it('persists the created item', async () => {
    await request(app).post('/api/items').send({ ...validItem, name: 'Oat Milk' });
    const res = await request(app).get('/api/items');
    expect(res.body.some((i: any) => i.name === 'Oat Milk')).toBe(true);
  });

  const invalidCases: Array<[string, any, string]> = [
    ['missing name', { category: 'dairy', quantity: 1, unit: 'l' }, 'name'],
    ['negative quantity', { ...validItem, quantity: -1 }, 'quantity'],
    ['unknown unit', { ...validItem, unit: 'stone' }, 'unit'],
    ['unknown category', { ...validItem, category: 'candy' }, 'category'],
    ['invalid expiresAt', { ...validItem, expiresAt: 'not-a-date' }, 'expiresAt'],
  ];

  for (const [label, payload, field] of invalidCases) {
    it(`rejects ${label} with 400`, async () => {
      const res = await request(app).post('/api/items').send(payload);
      expect(res.status).toBe(400);
      expect(typeof res.body.error).toBe('string');
      if (res.body.field !== undefined) {
        expect(res.body.field).toBe(field);
      }
    });
  }

  it('rejects malformed JSON with 400', async () => {
    const res = await request(app)
      .post('/api/items')
      .set('Content-Type', 'application/json')
      .send('{"name":');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/items filters', () => {
  beforeEach(async () => {
    await request(app).post('/api/items').send({
      name: 'Greek Yogurt', category: 'dairy', quantity: 3, unit: 'pack',
      lowStockThreshold: 1, expiresAt: isoDaysFromNow(3),
    });
    await request(app).post('/api/items').send({
      name: 'Yoghurt Drink', category: 'dairy', quantity: 0, unit: 'l',
      lowStockThreshold: 1, expiresAt: isoDaysFromNow(30),
    });
    await request(app).post('/api/items').send({
      name: 'Cheddar', category: 'dairy', quantity: 5, unit: 'g',
      lowStockThreshold: 2, expiresAt: null,
    });
    await request(app).post('/api/items').send({
      name: 'Bread', category: 'pantry', quantity: 1, unit: 'count',
      lowStockThreshold: 1, expiresAt: isoDaysFromNow(2),
    });
  });

  it('matches q as a case-insensitive substring on name', async () => {
    const res = await request(app).get('/api/items?q=yog');
    expect(res.status).toBe(200);
    const names = res.body.map((i: any) => i.name).sort();
    expect(names).toEqual(['Greek Yogurt', 'Yoghurt Drink']);
  });

  it('matches category exactly', async () => {
    const res = await request(app).get('/api/items?category=pantry');
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Bread');
  });

  it('filters by lowStock', async () => {
    const res = await request(app).get('/api/items?lowStock=true');
    const names = res.body.map((i: any) => i.name).sort();
    expect(names).toEqual(['Bread', 'Yoghurt Drink']);
  });

  it('filters by expiringSoon', async () => {
    const res = await request(app).get('/api/items?expiringSoon=true');
    const names = res.body.map((i: any) => i.name).sort();
    expect(names).toEqual(['Bread', 'Greek Yogurt']);
  });

  it('composes q, category, lowStock, and expiringSoon', async () => {
    const res = await request(app).get('/api/items?q=yog&category=dairy&lowStock=true&expiringSoon=false');
    const names = res.body.map((i: any) => i.name);
    expect(names).toEqual(['Yoghurt Drink']);
  });
});

describe('PATCH /api/items/:id', () => {
  it('updates a subset of fields', async () => {
    const created = await request(app).post('/api/items').send(validItem);
    const res = await request(app)
      .patch(`/api/items/${created.body.id}`)
      .send({ quantity: 5 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(5);
    expect(res.body.name).toBe('Milk');
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).patch('/api/items/does-not-exist').send({ quantity: 2 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/items/:id', () => {
  it('deletes an item', async () => {
    const created = await request(app).post('/api/items').send(validItem);
    const del = await request(app).delete(`/api/items/${created.body.id}`);
    expect([200, 204]).toContain(del.status);
    const list = await request(app).get('/api/items');
    expect(list.body).toHaveLength(0);
  });

  it('returns 404 for an unknown id', async () => {
    const res = await request(app).delete('/api/items/does-not-exist');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/shopping-list', () => {
  it('returns auto entries for low-stock items and manual entries separately', async () => {
    await request(app).post('/api/items').send({ ...validItem, name: 'Eggs', quantity: 0, lowStockThreshold: 1 });
    await request(app).post('/api/items').send({ ...validItem, name: 'Butter', quantity: 4, lowStockThreshold: 1 });
    const res = await request(app).get('/api/shopping-list');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.auto)).toBe(true);
    expect(Array.isArray(res.body.manual)).toBe(true);
    const autoNames = res.body.auto.map((i: any) => i.name).sort();
    expect(autoNames).toEqual(['Eggs']);
  });
});

describe('manual shopping list entries', () => {
  it('creates a manual entry', async () => {
    const res = await request(app).post('/api/shopping-list').send({ name: 'Dish Soap' });
    expect([200, 201]).toContain(res.status);
    expect(res.body.name).toBe('Dish Soap');
    expect(typeof res.body.id).toBe('string');
  });

  it('updates and deletes a manual entry', async () => {
    const created = await request(app).post('/api/shopping-list').send({ name: 'Dish Soap', quantity: 1, unit: 'count' });
    const id = created.body.id;

    const patched = await request(app).patch(`/api/shopping-list/${id}`).send({ quantity: 3 });
    expect(patched.status).toBe(200);
    expect(patched.body.quantity).toBe(3);

    const deleted = await request(app).delete(`/api/shopping-list/${id}`);
    expect([200, 204]).toContain(deleted.status);

    const list = await request(app).get('/api/shopping-list');
    expect(list.body.manual).toHaveLength(0);
  });

  it('rejects PATCH and DELETE on an auto entry with 409', async () => {
    const item = await request(app).post('/api/items').send({
      ...validItem, name: 'Eggs', quantity: 0, lowStockThreshold: 1,
    });
    const list = await request(app).get('/api/shopping-list');
    const autoId = list.body.auto[0].id;

    const patchRes = await request(app).patch(`/api/shopping-list/${autoId}`).send({ quantity: 2 });
    expect(patchRes.status).toBe(409);

    const deleteRes = await request(app).delete(`/api/shopping-list/${autoId}`);
    expect(deleteRes.status).toBe(409);

    // The underlying item is unaffected.
    const items = await request(app).get('/api/items');
    expect(items.body.find((i: any) => i.id === item.body.id)).toBeTruthy();
  });
});

describe('persistence', () => {
  it('retains data across an app restart', async () => {
    await request(app).post('/api/items').send({ ...validItem, name: 'Rice' });
    const app2 = createApp();
    const res = await request(app2).get('/api/items?q=rice');
    expect(res.body).toHaveLength(1);
  });
});

describe('unknown route', () => {
  it('returns 404', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
  });
});