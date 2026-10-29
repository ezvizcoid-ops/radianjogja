import React, { useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  KeyRound,
  Lock,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  Wifi,
  X,
} from 'lucide-react';
import { Customer, CustomerStatus, RegionZone } from '../../types';
import { decryptSensitiveData, encryptSensitiveData, maskNik, maskPhone } from '../../utils/crypto';
import { exportCustomersToExcel, formatRupiah } from '../../utils/export';
import { INTERNET_PACKAGES } from '../../data/mockInitialData';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface CustomerManagementProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
  onImportBatchCustomers: (newCustomers: Customer[]) => void;
}

export const CustomerManagement: React.FC<CustomerManagementProps> = ({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer,
  onImportBatchCustomers,
}) => {
  const { switchActiveCustomer } = useAuth();
  const { pushNotification } = useNotification();

  // Sub-menu for the 3 regions requested by user
  const [activeRegionTab, setActiveRegionTab] = useState<'ALL' | RegionZone>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // E2EE state: whether admin unlocked decrypted sensitive NIKs
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPortalRegisterModal, setShowPortalRegisterModal] = useState(false);
  const [selectedCustForPortal, setSelectedCustForPortal] = useState<Customer | null>(null);
  const [portalUsername, setPortalUsername] = useState('');
  const [portalPassword, setPortalPassword] = useState('');
  const [copiedInfo, setCopiedInfo] = useState(false);

  // Filtered by Region Sub-Menu
  const regionFilteredCustomers = customers.filter((c) => {
    if (activeRegionTab === 'ALL') return true;
    return c.areaZone.toLowerCase().includes(activeRegionTab.toLowerCase());
  });

  // Filtered by Search & Status
  const displayedCustomers = regionFilteredCustomers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customerCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.assignedIp.includes(searchTerm) ||
      (c.portalAccess?.username && c.portalAccess.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      c.odpBox.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Region metrics
  const minoCount = customers.filter((c) => c.areaZone.toLowerCase().includes('mino')).length;
  const sedaCount = customers.filter((c) => c.areaZone.toLowerCase().includes('seda')).length;
  const nangCount = customers.filter((c) => c.areaZone.toLowerCase().includes('nang')).length;

  const currentTabRevenue = regionFilteredCustomers.reduce((acc, c) => acc + c.monthlyFee, 0);
  const registeredPortalCount = regionFilteredCustomers.filter((c) => c.portalAccess?.isRegistered).length;

  // Toggle End-to-End Decryption
  const handleToggleDecryption = async () => {
    if (isDecrypted) {
      setIsDecrypted(false);
      return;
    }

    const cache: Record<string, string> = {};
    for (const cust of customers) {
      if (cust.rawNik) {
        cache[cust.id] = cust.rawNik;
      } else {
        const dec = await decryptSensitiveData(cust.encryptedNik);
        cache[cust.id] = dec;
      }
    }
    setDecryptedCache(cache);
    setIsDecrypted(true);
  };

  // Open Portal Registration Modal for a Customer
  const handleOpenPortalRegister = (cust: Customer) => {
    setSelectedCustForPortal(cust);
    const defaultUser = cust.portalAccess?.username || cust.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const defaultPass = cust.portalAccess?.password || `Radian@${cust.customerCode.slice(-4) || '1234'}`;
    setPortalUsername(defaultUser);
    setPortalPassword(defaultPass);
    setShowPortalRegisterModal(true);
  };

  // Submit Portal Account Registration (by Admin)
  const handleSavePortalAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustForPortal) return;

    const updatedCust: Customer = {
      ...selectedCustForPortal,
      portalAccess: {
        isRegistered: true,
        username: portalUsername,
        password: portalPassword,
        registeredAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    };

    onUpdateCustomer(updatedCust);
    setShowPortalRegisterModal(false);

    pushNotification({
      title: 'Akun Portal Pelanggan Didaftarkan',
      message: `Akun portal untuk ${updatedCust.name} (ID: ${updatedCust.customerCode}) berhasil didaftarkan oleh Admin. Username: ${portalUsername}`,
      type: 'SYSTEM',
      recipientRole: 'admin',
    });
  };

  // Batch register all pending portal accounts
  const handleBatchRegisterAll = () => {
    let count = 0;
    customers.forEach((c) => {
      if (!c.portalAccess?.isRegistered) {
        const updated: Customer = {
          ...c,
          portalAccess: {
            isRegistered: true,
            username: c.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            password: `Radian@${c.customerCode.slice(-4) || '1234'}`,
            registeredAt: new Date().toISOString(),
          },
        };
        onUpdateCustomer(updated);
        count++;
      }
    });

    pushNotification({
      title: 'Batch Pendaftaran Portal Selesai',
      message: `Berhasil mendaftarkan ${count} akun portal pelanggan baru secara otomatis.`,
      type: 'SYSTEM',
      recipientRole: 'admin',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white">Data Pelanggan RADIAN JOGJA</h2>
          <p className="text-xs text-slate-400">
            Terbagi dalam 3 Wilayah Operasional: Minomartani, Sedayu, dan Nanggulan. Akun portal pelanggan dikelola dan didaftarkan oleh Admin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Decrypt PII Toggle */}
          <button
            type="button"
            onClick={handleToggleDecryption}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
              isDecrypted
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {isDecrypted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isDecrypted ? 'Kunci NIK' : 'Dekripsi E2EE NIK'}</span>
          </button>

          {/* Batch Register Portal Access */}
          <button
            type="button"
            onClick={handleBatchRegisterAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition"
            title="Daftarkan akun portal untuk pelanggan yang belum aktif"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Daftarkan Semua Akun Portal</span>
          </button>

          {/* Export to Excel */}
          <button
            type="button"
            onClick={() => exportCustomersToExcel(displayedCustomers, `Data_Pelanggan_${activeRegionTab}`)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
        </div>
      </div>

      {/* SUB-MENU TABS: 3 WILAYAH SESUAI PERMINTAAN USER */}
      <div className="flex border-b border-slate-800 overflow-x-auto gap-1 text-xs">
        <button
          type="button"
          onClick={() => setActiveRegionTab('ALL')}
          className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeRegionTab === 'ALL'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Semua Wilayah ({customers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRegionTab('Minomartani')}
          className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeRegionTab === 'Minomartani'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-cyan-400" />
          <span>Wilayah Minomartani ({minoCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRegionTab('Sedayu')}
          className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeRegionTab === 'Sedayu'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-400" />
          <span>Wilayah Sedayu ({sedaCount})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveRegionTab('Nanggulan')}
          className={`px-4 py-3 font-bold border-b-2 whitespace-nowrap transition flex items-center gap-2 ${
            activeRegionTab === 'Nanggulan'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-950/20'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4 text-amber-400" />
          <span>Wilayah Nanggulan ({nangCount})</span>
        </button>
      </div>

      {/* Regional Info Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total Klien Wilayah</span>
          <span className="text-xl font-extrabold text-white">{regionFilteredCustomers.length} Pelanggan</span>
          <span className="text-[10px] text-cyan-400 block mt-0.5">
            {activeRegionTab === 'ALL' ? 'Total Seluruh Wilayah' : `Sub-Area ${activeRegionTab}`}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Potensi Billing Bulanan</span>
          <span className="text-xl font-extrabold text-emerald-400">{formatRupiah(currentTabRevenue)}</span>
          <span className="text-[10px] text-slate-400 block mt-0.5">Tarif paket 50k - 200k</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Akun Portal Terdaftar</span>
          <span className="text-xl font-extrabold text-cyan-400">
            {registeredPortalCount} / {regionFilteredCustomers.length}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Didaftarkan oleh Admin</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Target IP Range</span>
          <span className="text-base font-extrabold font-mono text-slate-200">3.3.3.2 ~ 3.3.3.56</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">MikroTik RouterOS LAN</span>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama pelanggan, kode e.g. 104080, IP 3.3.3.x, atau ODP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
        >
          <option value="ALL">Semua Status Koneksi</option>
          <option value="ACTIVE">Aktif (ACTIVE)</option>
          <option value="ISOLATED">Terisolir (ISOLATED)</option>
        </select>
      </div>

      {/* Customers Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Nama &amp; Kode Pelanggan</th>
                <th className="px-4 py-3">Wilayah</th>
                <th className="px-4 py-3">IP Target &amp; Kecepatan</th>
                <th className="px-4 py-3">Biaya Paket</th>
                <th className="px-4 py-3">Redaman (dBm)</th>
                <th className="px-4 py-3">Akun Portal (Admin)</th>
                <th className="px-4 py-3 text-right">Kelola Akun</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {displayedCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ditemukan data pelanggan untuk wilayah {activeRegionTab}.
                  </td>
                </tr>
              ) : (
                displayedCustomers.map((cust) => {
                  const isRegistered = cust.portalAccess?.isRegistered;
                  const isHighAttenuation = cust.signalDbm < -25;

                  return (
                    <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                      {/* Name & Customer Code */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-white text-xs">{cust.name}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{cust.customerCode}</div>
                        <div className="text-[10px] text-slate-500">{cust.email}</div>
                      </td>

                      {/* Region Area */}
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-200 block">{cust.areaZone}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{cust.odpBox}</span>
                      </td>

                      {/* IP & Bandwidth */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-cyan-300 font-bold block">{cust.assignedIp}</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">{cust.bandwidthSpeed}</span>
                      </td>

                      {/* Monthly Fee */}
                      <td className="px-4 py-3">
                        <div className="font-extrabold text-white">{formatRupiah(cust.monthlyFee)}</div>
                        <div className="text-[10px] text-slate-500">per bulan</div>
                      </td>

                      {/* Optical Attenuation */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded text-[10px] ${
                            isHighAttenuation
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {cust.signalDbm} dBm
                        </span>
                      </td>

                      {/* Portal Registration Status (Registered by Admin) */}
                      <td className="px-4 py-3">
                        {isRegistered ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3" /> PORTAL AKTIF
                            </span>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              User: {cust.portalAccess?.username}
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              BELUM DAFTAR
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">
                              Perlu didaftarkan
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenPortalRegister(cust)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Daftarkan / Ubah Akun Portal"
                          >
                            <KeyRound className="w-3 h-3 text-cyan-400" />
                            <span>{isRegistered ? 'Edit Akun' : 'Daftarkan'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => switchActiveCustomer(cust)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold flex items-center gap-1 transition"
                            title="Masuk Sebagai Pelanggan Ini"
                          >
                            <span>Buka Portal</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Portal Account Registration Modal */}
      {showPortalRegisterModal && selectedCustForPortal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-white">Daftarkan Akun Portal Pelanggan</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPortalRegisterModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePortalAccount} className="py-4 space-y-3.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                  Data Pelanggan Terpilih
                </span>
                <div className="font-bold text-sm text-white">{selectedCustForPortal.name}</div>
                <div className="text-[11px] text-cyan-400 font-mono">
                  ID: {selectedCustForPortal.customerCode} &bull; Wilayah {selectedCustForPortal.areaZone}
                </div>
                <div className="text-[10px] text-slate-400">
                  IP: {selectedCustForPortal.assignedIp} &bull; Paket: {formatRupiah(selectedCustForPortal.monthlyFee)}/bln
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Username Portal Pelanggan *
                </label>
                <input
                  type="text"
                  required
                  value={portalUsername}
                  onChange={(e) => setPortalUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Pelanggan juga dapat login langsung menggunakan Kode: {selectedCustForPortal.customerCode}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kata Sandi Akses Portal *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={portalPassword}
                    onChange={(e) => setPortalPassword(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Akun Portal RADIAN JOGJA:\nNama: ${selectedCustForPortal.name}\nKode Pelanggan: ${selectedCustForPortal.customerCode}\nUsername: ${portalUsername}\nPassword: ${portalPassword}`);
                      setCopiedInfo(true);
                      setTimeout(() => setCopiedInfo(false), 2000);
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 transition"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copiedInfo ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40 text-[11px] text-emerald-300">
                Setelah didaftarkan oleh Admin, pelanggan dapat langsung login mandiri ke portal untuk cek tagihan, bayar via payment gateway, dan lapor keluhan.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPortalRegisterModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Aktifkan Akun Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
