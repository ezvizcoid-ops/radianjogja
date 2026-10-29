import { InventoryItem } from '../types';

export interface SupplierApiConfig {
  endpoint: string;
  apiKey: string;
  supplierName: string;
  autoSyncIntervalMinutes: number;
  lastSyncStatus: 'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR';
  lastSyncMessage?: string;
  lastSyncAt?: string;
}

export const DEFAULT_SUPPLIER_API: SupplierApiConfig = {
  endpoint: 'https://api.fiberindotelco.co.id/v2/warehouse/stock',
  apiKey: 'rj_live_sec_99a8bc471d2ef91048b',
  supplierName: 'PT. Fiberindo Distribusi Jogja',
  autoSyncIntervalMinutes: 60,
  lastSyncStatus: 'IDLE',
  lastSyncAt: new Date(Date.now() - 3600000 * 2).toISOString(),
};

export interface SyncResult {
  success: boolean;
  syncedItemsCount: number;
  latencyMs: number;
  message: string;
  updatedStock: Partial<InventoryItem>[];
  timestamp: string;
}

/**
 * Execute real API simulation sync with third-party supplier warehouse
 */
export async function syncInventoryWithSupplier(
  currentItems: InventoryItem[],
  config: SupplierApiConfig = DEFAULT_SUPPLIER_API
): Promise<SyncResult> {
  const start = performance.now();

  // Simulate network roundtrip to telco supplier API
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 400));
  const latencyMs = Math.round(performance.now() - start);

  // Generate updated quantities from supplier backend
  const updatedStock = currentItems.map((item) => {
    // Simulate supplier delta adjustment
    const delta = Math.floor(Math.random() * 5) - 1; // -1 to +3
    const newQty = Math.max(item.minThreshold + 1, item.quantity + delta);
    return {
      id: item.id,
      sku: item.sku,
      quantity: newQty,
      lastSyncedAt: new Date().toISOString(),
    };
  });

  return {
    success: true,
    syncedItemsCount: updatedStock.length,
    latencyMs,
    message: `Berhasil tersinkronisasi dengan ${config.supplierName} (${latencyMs}ms)`,
    updatedStock,
    timestamp: new Date().toISOString(),
  };
}
