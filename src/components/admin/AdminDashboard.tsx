import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  FileText,
  LifeBuoy,
  Mail,
  Plus,
  Receipt,
  Server,
  TrendingUp,
  Users,
  Wifi,
} from 'lucide-react';
import { Bill, Customer, DeviceNode, Ticket } from '../../types';
import { formatIndoDate, formatRupiah, exportBillsReportPDF, exportBillsToExcel } from '../../utils/export';

interface AdminDashboardProps {
  customers: Customer[];
  bills: Bill[];
  tickets: Ticket[];
  devices: DeviceNode[];
  onNavigate: (tab: string) => void;
  onOpenNewBillModal: () => void;
  onOpenNewCustomerModal: () => void;
  onViewEmailReceipt: (bill: Bill) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  customers,
  bills,
  tickets,
  devices,
  onNavigate,
  onOpenNewBillModal,
  onOpenNewCustomerModal,
  onViewEmailReceipt,
}) => {
  // Calculations
  const activeCustomers = customers.filter((c) => c.status === 'ACTIVE').length;
  const isolatedCustomers = customers.filter((c) => c.status === 'ISOLATED').length;

  const currentMonthBills = bills;
  const paidBills = currentMonthBills.filter((b) => b.status === 'PAID');
  const unpaidBills = currentMonthBills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE');

  const totalCollectedRevenue = paidBills.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalPendingRevenue = unpaidBills.reduce((acc, b) => acc + b.totalAmount, 0);

  const openTickets = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS');
  const criticalTickets = tickets.filter((t) => t.priority === 'CRITICAL' && t.status !== 'CLOSED');

  const onlineNodes = devices.filter((d) => d.status === 'ONLINE').length;
  const warningNodes = devices.filter((d) => d.status === 'WARNING').length;

  return (
    <div className="space-y-6">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-white">Dashboard Operasional Admin NOC</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold">
              Live Real-Time
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau performa layanan internet fiber optik RADIAN JOGJA, penagihan pelanggan otomatis, dan penanganan tiket teknisi.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onOpenNewCustomerModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>Tambah Pelanggan</span>
          </button>
          <button
            type="button"
            onClick={onOpenNewBillModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Terbitkan Invoice</span>
          </button>
          <button
            type="button"
            onClick={() => exportBillsReportPDF(bills, 'Bulan Ini')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-md shadow-cyan-600/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>
          <button
            type="button"
            onClick={() => exportBillsToExcel(bills)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Active Subscribers */}
        <div
          onClick={() => onNavigate('customers')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Pelanggan</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{customers.length}</span>
            <span className="text-xs text-emerald-400 font-semibold">{activeCustomers} Aktif</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            {isolatedCustomers > 0 && (
              <span className="text-rose-400">{isolatedCustomers} Terisolir</span>
            )}
            <span>&bull; Tersebar di Sleman, Kota, Bantul</span>
          </div>
        </div>

        {/* KPI 2: Pendapatan Terkumpul */}
        <div
          onClick={() => onNavigate('billing')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Pendapatan Masuk</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-xl sm:text-2xl font-extrabold text-white">
              {formatRupiah(totalCollectedRevenue)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-emerald-400 font-medium">{paidBills.length} Terbayar</span>
            <span>&bull; Tagihan Unpaid: {formatRupiah(totalPendingRevenue)}</span>
          </div>
        </div>

        {/* KPI 3: Open Trouble Tickets */}
        <div
          onClick={() => onNavigate('tickets')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Tiket Gangguan</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:scale-110 transition">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">{openTickets.length}</span>
            <span className="text-xs text-amber-400 font-semibold">Butuh Penanganan</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            {criticalTickets.length > 0 ? (
              <span className="text-rose-400 font-semibold">{criticalTickets.length} Kritis (LOS)</span>
            ) : (
              <span className="text-emerald-400">Semua Terkendali</span>
            )}
            <span>&bull; Ditugaskan ke teknisi</span>
          </div>
        </div>

        {/* KPI 4: Infrastructure Nodes */}
        <div
          onClick={() => onNavigate('network')}
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Status OLT & POP</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center group-hover:scale-110 transition">
              <Server className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {onlineNodes} / {devices.length}
            </span>
            <span className="text-xs text-slate-400">UP</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            {warningNodes > 0 ? (
              <span className="text-amber-400 font-medium">{warningNodes} Warning (Redaman)</span>
            ) : (
              <span className="text-emerald-400">Semua Link 100% Up</span>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Grid: Bandwidth Telemetry + Recent Payment & Email Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Throughput & Sales Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Simulated Realtime Traffic Chart */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm sm:text-base text-white">
                  Monitoring Trafik Bandwidth ISP (Uplink 10 Gbps)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-cyan-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500" />
                  <span>Download: 2.84 Gbps</span>
                </div>
                <div className="flex items-center gap-1.5 text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500" />
                  <span>Upload: 1.15 Gbps</span>
                </div>
              </div>
            </div>

            {/* Simulated Live SVG Line Graph */}
            <div className="h-44 w-full bg-slate-950/70 rounded-xl p-3 border border-slate-800/80 relative overflow-hidden flex flex-col justify-end">
              <svg className="w-full h-32" preserveAspectRatio="none" viewBox="0 0 500 120">
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid horizontal lines */}
                <line x1="0" y1="30" x2="500" y2="30" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="65" x2="500" y2="65" stroke="#1e293b" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#1e293b" strokeDasharray="3 3" />

                {/* Download Traffic Area */}
                <path
                  d="M0,85 Q40,65 90,75 T180,45 T270,30 T360,40 T440,25 T500,35 L500,120 L0,120 Z"
                  fill="url(#cyanGrad)"
                />
                <path
                  d="M0,85 Q40,65 90,75 T180,45 T270,30 T360,40 T440,25 T500,35"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Upload Traffic Area */}
                <path
                  d="M0,98 Q50,90 100,85 T200,80 T300,70 T400,65 T500,75 L500,120 L0,120 Z"
                  fill="url(#indigoGrad)"
                />
                <path
                  d="M0,98 Q50,90 100,85 T200,80 T300,70 T400,65 T500,75"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2"
                />
              </svg>

              <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
                <span>00:00</span>
                <span>04:00</span>
                <span>08:00</span>
                <span>12:00</span>
                <span>16:00</span>
                <span>20:00</span>
                <span className="text-cyan-400 font-bold">Sekarang (Peak)</span>
              </div>
            </div>
          </div>

          {/* Sales Breakdown by Package & Jogja Area */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm sm:text-base text-white">
                Sebaran Wilayah & Performa Paket Internet
              </h3>
              <span className="text-xs text-slate-400">Yogyakarta & Sekitarnya</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Package distribution */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">Distribusi Paket Berlangganan</span>

                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Paket Keluarga 50 Mbps</span>
                      <span className="font-bold text-cyan-400">55%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-cyan-500 rounded-full w-[55%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Paket Pelajar 20 Mbps</span>
                      <span className="font-bold text-blue-400">25%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full w-[25%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Paket Bisnis 100 Mbps</span>
                      <span className="font-bold text-indigo-400">15%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full w-[15%]" />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 mb-1">
                      <span>Dedicated SOHO 200 Mbps</span>
                      <span className="font-bold text-amber-400">5%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full w-[5%]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Area Distribution - 3 Regions from Uploaded Files */}
              <div className="space-y-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-xs font-semibold text-slate-300 block">3 Wilayah Operasional RADIAN JOGJA</span>

                <div className="space-y-2 text-xs">
                  <div
                    onClick={() => onNavigate('customers')}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition cursor-pointer"
                  >
                    <div>
                      <span className="text-white font-bold block">1. Wilayah Minomartani</span>
                      <span className="text-[10px] text-slate-400">Ngaglik, Sleman &bull; RouterOS 6.47.9</span>
                    </div>
                    <span className="font-mono text-cyan-400 font-bold">
                      {customers.filter((c) => c.areaZone.toLowerCase().includes('mino')).length} Klien
                    </span>
                  </div>

                  <div
                    onClick={() => onNavigate('customers')}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition cursor-pointer"
                  >
                    <div>
                      <span className="text-white font-bold block">2. Wilayah Sedayu</span>
                      <span className="text-[10px] text-slate-400">Bantul Barat &bull; RouterOS 7.20.8</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">
                      {customers.filter((c) => c.areaZone.toLowerCase().includes('seda')).length} Klien
                    </span>
                  </div>

                  <div
                    onClick={() => onNavigate('customers')}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition cursor-pointer"
                  >
                    <div>
                      <span className="text-white font-bold block">3. Wilayah Nanggulan</span>
                      <span className="text-[10px] text-slate-400">Kulon Progo &bull; RouterOS 7.18.2</span>
                    </div>
                    <span className="font-mono text-amber-400 font-bold">
                      {customers.filter((c) => c.areaZone.toLowerCase().includes('nang')).length} Klien
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Realtime Activity & Automated Email Reports Feed */}
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">Report Otomatis Email</h3>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-bold">
                Auto-Dispatched
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              Laporan faktur &amp; tanda terima pembayaran terkirim otomatis ke email pelanggan saat pembayaran terverifikasi.
            </p>

            <div className="space-y-2.5">
              {paidBills.slice(0, 5).map((bill) => (
                <div
                  key={bill.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-xs text-white">{bill.customerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{bill.invoiceNo}</div>
                    </div>
                    <span className="text-xs font-bold text-emerald-400">
                      {formatRupiah(bill.totalAmount)}
                    </span>
                  </div>

                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1 text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="truncate max-w-[140px]">{bill.customerEmail}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onViewEmailReceipt(bill)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold text-[10px] underline"
                    >
                      Buka Email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Trouble Tickets in Admin Stream */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-sm text-white">Status Tiket Lapangan</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tickets')}
                className="text-xs text-cyan-400 hover:underline"
              >
                Lihat Semua
              </button>
            </div>

            <div className="space-y-2.5">
              {tickets.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{t.ticketNo}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        t.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-400'
                          : t.priority === 'HIGH'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] mt-1 font-medium truncate">{t.subject}</p>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Teknisi: {t.assignedTechnicianName || 'Belum'}</span>
                    <span className="capitalize">{t.status.replace('_', ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
