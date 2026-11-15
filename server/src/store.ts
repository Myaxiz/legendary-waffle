import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Item, ManualEntry } from '../../shared/types';

export interface StoreData {
  items: Item[];
  manual: ManualEntry[];
}

function storePath(): string {
  return process.env.STORE_PATH ?? path.resolve(__dirname, '../data/store.json');
}

function tmpPath(): string {
  return `${storePath()}.tmp`;
}

export async function readStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(storePath(), 'utf8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    return { items: parsed.items ?? [], manual: parsed.manual ?? [] };
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') {
      return { items: [], manual: [] };
    }
    throw err;
  }
}

export async function writeStore(data: StoreData): Promise<void> {
  const target = storePath();
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(tmpPath(), JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath(), target);
}

export async function updateStore(
  fn: (data: StoreData) => StoreData | Promise<StoreData>
): Promise<StoreData> {
  const next = await fn(await readStore());
  await writeStore(next);
  return next;
}