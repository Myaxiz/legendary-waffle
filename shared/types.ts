// Shared request/response types. Exported shapes must not change.

export type Category =
  | 'produce'
  | 'dairy'
  | 'meat'
  | 'pantry'
  | 'frozen'
  | 'beverage'
  | 'other';

export type Unit = 'count' | 'g' | 'kg' | 'ml' | 'l' | 'pack';

export const CATEGORIES: readonly Category[] = [
  'produce', 'dairy', 'meat', 'pantry', 'frozen', 'beverage', 'other',
] as const;

export const UNITS: readonly Unit[] = ['count', 'g', 'kg', 'ml', 'l', 'pack'] as const;

export interface Item {
  id: string;
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  lowStockThreshold: number;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ManualEntry {
  id: string;
  name: string;
  quantity: number;
  unit: Unit;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListResponse {
  auto: Item[];
  manual: ManualEntry[];
}

export interface ApiError {
  error: string;
  field?: string;
}

export interface CreateItemInput {
  name: string;
  category: Category;
  quantity: number;
  unit: Unit;
  lowStockThreshold?: number;
  expiresAt?: string | null;
}

export interface UpdateItemInput {
  name?: string;
  category?: Category;
  quantity?: number;
  unit?: Unit;
  lowStockThreshold?: number;
  expiresAt?: string | null;
}

export interface CreateManualEntryInput {
  name: string;
  quantity?: number;
  unit?: Unit;
}

export interface UpdateManualEntryInput {
  name?: string;
  quantity?: number;
  unit?: Unit;
}

export interface ItemFilters {
  q?: string;
  category?: Category;
  lowStock?: boolean;
  expiringSoon?: boolean;
}