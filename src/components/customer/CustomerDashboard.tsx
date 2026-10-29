import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  HelpCircle,
  History,
  LifeBuoy,
  Mail,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  Smartphone,
  Wifi,
  X,
} from 'lucide-react';
import { Bill, Customer, Ticket } from '../../types';
import { exportSingleInvoicePDF, formatIndoDate, formatRupiah } from '../../utils/export';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface CustomerDashboardProps {
  customer: Customer;
  bills: Bill[];
  tickets: Ticket[];
  onOpenPaymentGateway: (bill: Bill) => void;
  onViewEmailReceipt: (bill: Bill) => void;
  onCreateTicket: (newTicket: Ticket) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  customer,
  bills,
  tickets,
  onOpenPaymentGateway,
  onViewEmailReceipt,
  onCreateTicket,
}) => {
  const { currentUser } = useAuth();
  const { pushNotification } = useNotification();

  const [activeSubTab, setActiveSubTab] = useState<'billing' | 'history' | 'tickets' | 'selfcheck'>('billing');
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);

  // Self diagnostic state
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<string | null>(null);

  // New ticket state
  const [ticketCategory, setTicketCategory] = useState<Ticket['category']>('Internet Lambat');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');

  // Customer specific bills
  const myBills = bills.filter(
    (b) => b.customerId === customer.id || b.customerCode === customer.customerCode
  );
  const unpaidBill = myBills.find((b) => b.status === 'UNPAID' || b.status === 'OVERDUE');
  const paidBills = myBills.filter((b) => b.status === 'PAID');

  // Customer specific tickets
  const myTickets = tickets.filter(
    (t) => t.customerId === customer.id || t.customerName.includes(customer.name)
  );

  const handleRunSelfCheck = async () => {
    setIsDiagnosticRunning(true);
    setDiagnosticResult(null);
    await new Promise((r) => setTimeout(r, 1500));
    setDiagnosticResult(
      `Status ONT Normal &bull; Sinyal Optik: ${customer.signalDbm} dBm &bull; Ping NOC: 1.9ms &bull; Download: 49.8 Mbps`
    );
    setIsDiagnosticRunning(false);
  };

  const handleCreateNewComplaint = (e: React.FormEvent) => {
    e.preventDefault();

    const newTicket: Ticket = {
      id: 'tkt_' + Math.random().toString(36).substring(2, 9),
      ticketNo: `TCK/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      category: ticketCategory,
      priority: ticketCategory === 'Kabel Putus / LOS Merah' ? 'CRITICAL' : 'MEDIUM',
      subject: ticketSubject,
      description: ticketDescription,
      status: 'OPEN',
      opticalAttenuationDbm: customer.signalDbm,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onCreateTicket(newTicket);
    setShowCreateTicketModal(false);
    setTicketSubject('');
    setTicketDescription('');

    pushNotification({
      title: 'Tiket Keluhan Terkirim',
      message: `Keluhan "${ticketSubject}" berhasil dikirimkan ke NOC Radian Jogja. Teknisi akan segera menindaklanjuti.`,
      type: 'TICKET',
      recipientRole: 'customer',
    });
  };

  return (
    <div className="space-y-6">
      {/* Customer Subscriber Card (Clean, modern, mobile-friendly) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/40 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center ring-1 ring-cyan-500/30 shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white">{customer.name}</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                {customer.status}
              </span>
            </div>
            <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-2">
              <span>ID: <strong className="text-cyan-400 font-mono">{customer.customerCode}</strong></span>
              <span>&bull;</span>
              <span>Wilayah: <strong className="text-emerald-400">{customer.areaZone}</strong></span>
              <span>&bull;</span>
              <span>IP: <strong className="text-cyan-300 font-mono">{customer.assignedIp}</strong></span>
              <span>&bull;</span>
              <span>ODP: <strong className="text-slate-300 font-mono">{customer.odpBox}</strong></span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Paket: <strong className="text-white">{customer.packageName}</strong> &bull; Biaya: <strong className="text-cyan-300">{formatRupiah(customer.monthlyFee)}/bln</strong>
            </p>
          </div>
        </div>

        {/* Quick Self-Check Ping & Portal Account badge */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 self-start md:self-auto">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Akun Portal Terverifikasi Admin</span>
          </div>
          <button
            type="button"
            disabled={isDiagnosticRunning}
            onClick={handleRunSelfCheck}
            className="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/80 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Activity className={`w-3.5 h-3.5 text-cyan-400 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
            <span>{isDiagnosticRunning ? 'Mendiagnosa...' : 'Tes Sinyal ONT'}</span>
          </button>
        </div>
      </div>

      {diagnosticResult && (
        <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span dangerouslySetInnerHTML={{ __html: diagnosticResult }} />
        </div>
      )}

      {/* Sub-tabs Navigation for Customer */}
      <div className="flex border-b border-slate-800 text-xs">
        <button
          type="button"
          onClick={() => setActiveSubTab('billing')}
          className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'billing'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Tagihan Aktif</span>
          {unpaidBill && (
            <span className="w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('history')}
          className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'history'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat &amp; Kuitansi ({paidBills.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab('tickets')}
          className={`px-4 py-2.5 font-bold border-b-2 transition flex items-center gap-2 ${
            activeSubTab === 'tickets'
              ? 'border-cyan-500 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <LifeBuoy className="w-4 h-4" />
          <span>Keluhan &amp; Tiket ({myTickets.length})</span>
        </button>
      </div>

      {/* Tab 1: Tagihan Aktif & Payment Gateway */}
      {activeSubTab === 'billing' && (
        <div className="space-y-4">
          {unpaidBill ? (
            <div className="p-6 rounded-2xl bg-slate-900 border border-cyan-500/30 shadow-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-semibold text-rose-400 uppercase tracking-wider block">
                    Menunggu Pembayaran
                  </span>
                  <h3 className="text-xl font-extrabold text-white mt-1">
                    Tagihan Internet Periode {unpaidBill.periodMonth}/{unpaidBill.periodYear}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Nomor Faktur: {unpaidBill.invoiceNo}
                  </span>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-400 block">Total yang Harus Dibayar</span>
                  <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                    {formatRupiah(unpaidBill.totalAmount)}
                  </span>
                  <span className="text-[11px] text-amber-400 block mt-0.5">
                    Jatuh Tempo: {formatIndoDate(unpaidBill.dueDate)}
                  </span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Tarif Paket Internet</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{formatRupiah(unpaidBill.amount)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">PPN (11%)</span>
                  <span className="font-bold text-white text-sm mt-0.5 block">{formatRupiah(unpaidBill.taxAmount)}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 block">Kode Unik Verifikasi</span>
                  <span className="font-bold text-cyan-400 text-sm mt-0.5 block">+{unpaidBill.uniqueCode}</span>
                </div>
              </div>

              {/* Pay Now Button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Kuitansi resmi dikirimkan langsung ke email Anda secara otomatis setelah pembayaran.</span>
                </p>

                <button
                  type="button"
                  onClick={() => onOpenPaymentGateway(unpaidBill)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Bayar Sekarang (QRIS / VA / E-Wallet)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-extrabold text-base text-white">Semua Tagihan Sudah Lunas!</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Terima kasih, pembayaran internet rumah Anda telah terkonfirmasi. Layanan internet tetap aktif berkecepatan penuh.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Riwayat Pembayaran & Kuitansi PDF */}
      {activeSubTab === 'history' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">No. Faktur</th>
                  <th className="px-4 py-3">Periode</th>
                  <th className="px-4 py-3">Total Bayar</th>
                  <th className="px-4 py-3">Metode Bayar</th>
                  <th className="px-4 py-3">Tanggal Lunas</th>
                  <th className="px-4 py-3 text-right">Dokumen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {myBills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-3 font-mono font-bold text-white">{b.invoiceNo}</td>
                    <td className="px-4 py-3">Bulan {b.periodMonth}/{b.periodYear}</td>
                    <td className="px-4 py-3 font-mono font-extrabold text-cyan-300">
                      {formatRupiah(b.totalAmount)}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{b.paymentMethod || 'Menunggu'}</td>
                    <td className="px-4 py-3 text-slate-400">{formatIndoDate(b.paidAt)}</td>
                    <td className="px-4 py-3 text-right">
                      {b.status === 'PAID' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => onViewEmailReceipt(b)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition"
                            title="Buka Laporan Email"
                          >
                            <Mail className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Email</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => exportSingleInvoicePDF(b, customer)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-[11px] font-bold flex items-center gap-1 transition"
                            title="Unduh Kuitansi PDF Resmi"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onOpenPaymentGateway(b)}
                          className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] transition"
                        >
                          Bayar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Tiket Keluhan & Bantuan Teknis */}
      {activeSubTab === 'tickets' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Tiket Pengaduan &amp; Bantuan Saya</h3>
            <button
              type="button"
              onClick={() => setShowCreateTicketModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-md shadow-cyan-600/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lapor Keluhan Baru</span>
            </button>
          </div>

          <div className="space-y-3">
            {myTickets.length === 0 ? (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
                Tidak ada riwayat keluhan. Koneksi internet Anda berjalan normal.
              </div>
            ) : (
              myTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-cyan-400 font-bold text-xs">{t.ticketNo}</span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {t.category}
                      </span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === 'RESOLVED' || t.status === 'CLOSED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {t.status}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-white">{t.subject}</h4>
                  <p className="text-xs text-slate-300">{t.description}</p>

                  {t.actionNotes && (
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[11px] text-slate-300 mt-2">
                      <strong className="text-cyan-400">Respon Teknisi:</strong> {t.actionNotes}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreateTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Buat Tiket Keluhan Baru</h3>
              <button
                type="button"
                onClick={() => setShowCreateTicketModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewComplaint} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Kategori Kendala</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Internet Lambat">Internet Lambat / Kecepatan Turun</option>
                  <option value="Kabel Putus / LOS Merah">Lampu LOS Modem Merah (Kabel Putus)</option>
                  <option value="Router Tidak Memancarkan Sinyal">Router Tidak Memancarkan Sinyal WiFi</option>
                  <option value="Ganti Password WiFi">Permintaan Ubah Kata Sandi / Nama WiFi</option>
                  <option value="Pindah Posisi ONT">Relokasi / Pindah Titik Pasang ONT</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Judul Keluhan Singkat *</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: WiFi sering putus sejak kemarin sore"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Rincian Keluhan *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Jelaskan kendala yang dialami, lampu indikator modem yang menyala, dll..."
                  value={ticketDescription}
                  onChange={(e) => setTicketDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTicketModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Kirim Keluhan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
