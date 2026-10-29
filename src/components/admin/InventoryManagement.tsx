import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Globe,
  Package,
  Plus,
  RefreshCw,
  Search,
  Zap,
} from 'lucide-react';
import { InventoryItem } from '../../types';
import { exportInventoryToExcel, formatRupiah } from '../../utils/export';
import { DEFAULT_SUPPLIER_API, SupplierApiConfig, syncInventoryWithSupplier } from '../../services/thirdPartyApi';
import { useNotification } from '../../context/NotificationContext';

interface InventoryManagementProps {
  items: InventoryItem[];
  onUpdateItems: (updatedItems: InventoryItem[]) => void;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({ items, onUpdateItems }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [apiConfig, setApiConfig] = useState<SupplierApiConfig>(DEFAULT_SUPPLIER_API);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncHistory, setSyncHistory] = useState<{ time: string; msg: string; latency: number }[]>([
    {
      time: new Date(Date.now() - 3600000 * 3).toLocaleTimeString('id-ID'),
      msg: 'Sinkronisasi berkala terjadwal sukses',
      latency: 48,
    },
  ]);

  const { pushNotification } = useNotification();

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items.filter((i) => i.quantity <= i.minThreshold);

  // Trigger 3rd Party API Sync
  const handleSyncApi = async () => {
    setIsSyncing(true);
    try {
      const res = await syncInventoryWithSupplier(items, apiConfig);

      // Merge updated stock quantities
      const updated = items.map((item) => {
        const found = res.updatedStock.find((u) => u.id === item.id);
        return found ? { ...item, ...found } : item;
      });

      onUpdateItems(updated);
      setApiConfig((prev) => ({
        ...prev,
        lastSyncStatus: 'SUCCESS',
        lastSyncAt: res.timestamp,
        lastSyncMessage: res.message,
      }));

      setSyncHistory((prev) => [
        {
          time: new Date().toLocaleTimeString('id-ID'),
          msg: `${res.syncedItemsCount} item disinkronkan dengan gudang pusat`,
          latency: res.latencyMs,
        },
        ...prev.slice(0, 5),
      ]);

      pushNotification({
        title: 'Sinkronisasi Inventaris Sukses',
        message: `${res.message}. Stok perangkat ONT dan kabel fiber terbarukan.`,
        type: 'SYSTEM',
        recipientRole: 'admin',
      });
    } catch (e) {
      console.error('API Sync failed:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-white">Inventaris Perangkat &amp; Integrasi API</h2>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              API Supplier Terhubung
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pengelolaan stok modem ONT, kabel fiber dropcore, splitter ODP, serta sinkronisasi otomatis dengan API supplier telco.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sync 3rd party API button */}
          <button
            type="button"
            disabled={isSyncing}
            onClick={handleSyncApi}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menghubungi API...' : 'Sinkronisasi API Supplier'}</span>
          </button>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={() => exportInventoryToExcel(filteredItems)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* 3rd Party API Status Banner */}
      <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">{apiConfig.supplierName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                REST API v2 ACTIVE
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px] mt-0.5">{apiConfig.endpoint}</div>
          </div>
        </div>

        <div className="text-slate-400 text-right">
          <div>Terakhir Sinkron: <span className="text-slate-200 font-semibold">{apiConfig.lastSyncAt ? new Date(apiConfig.lastSyncAt).toLocaleString('id-ID') : '-'}</span></div>
          <div className="text-[10px] text-emerald-400">{apiConfig.lastSyncMessage || 'Semua stok dalam batas aman'}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        <input
          type="text"
          placeholder="Cari nama alat, SKU barang, atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Stock Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const isLow = item.quantity <= item.minThreshold;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-2xl bg-slate-900 border transition ${
                isLow ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold block">{item.sku}</span>
                  <h4 className="font-bold text-xs text-white mt-0.5">{item.name}</h4>
                  <span className="text-[10px] text-slate-400">{item.category}</span>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xl font-extrabold ${
                      isLow ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {item.quantity}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Batas Minimum: {item.minThreshold} {item.unit}</span>
                <span className="font-semibold text-slate-300">{formatRupiah(item.unitCost)}</span>
              </div>

              <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                <span>{item.location}</span>
                <span className="font-mono text-cyan-400">{item.supplierApiCode}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
