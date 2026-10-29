import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Filter,
  Mail,
  Plus,
  Receipt,
  Search,
  Send,
  X,
} from 'lucide-react';
import { Bill, Customer } from '../../types';
import { exportBillsReportPDF, exportBillsToExcel, exportSingleInvoicePDF, formatIndoDate, formatRupiah } from '../../utils/export';
import { sendAutomaticPaymentReport } from '../../services/emailService';
import { useNotification } from '../../context/NotificationContext';

interface BillingManagementProps {
  bills: Bill[];
  customers: Customer[];
  onOpenPaymentGateway: (bill: Bill) => void;
  onViewEmailReceipt: (bill: Bill) => void;
  onAddBill: (newBill: Bill) => void;
  onUpdateBill: (updatedBill: Bill) => void;
}

export const BillingManagement: React.FC<BillingManagementProps> = ({
  bills,
  customers,
  onOpenPaymentGateway,
  onViewEmailReceipt,
  onAddBill,
  onUpdateBill,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const { pushNotification } = useNotification();

  // New Invoice Form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [periodMonth, setPeriodMonth] = useState(11);
  const [periodYear, setPeriodYear] = useState(2026);

  // Filter bills
  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paidTotal = bills.filter((b) => b.status === 'PAID').reduce((acc, b) => acc + b.totalAmount, 0);
  const unpaidTotal = bills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE').reduce((acc, b) => acc + b.totalAmount, 0);

  // Manual payment verification (if paid via cash or direct bank transfer)
  const handleMarkAsPaid = async (bill: Bill) => {
    const now = new Date().toISOString();
    const customer = customers.find((c) => c.id === bill.customerId);

    const updated: Bill = {
      ...bill,
      status: 'PAID',
      paidAt: now,
      paymentMethod: 'Verifikasi Admin (Transfer Bank/Tunai)',
      paymentReference: `MAN-VERIF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      emailReportSent: true,
      emailReportTimestamp: now,
    };

    // Auto send email report
    await sendAutomaticPaymentReport(updated, customer);

    pushNotification({
      title: 'Tagihan Berhasil Diverifikasi',
      message: `Faktur ${bill.invoiceNo} (${bill.customerName}) telah diverifikasi LUNAS. Laporan email otomatis terkirim.`,
      type: 'PAYMENT',
      recipientRole: 'admin',
    });

    onUpdateBill(updated);
  };

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find((c) => c.id === selectedCustomerId);
    if (!cust) return;

    const baseAmount = cust.monthlyFee;
    const taxAmount = Math.round(baseAmount * 0.11);
    const uniqueCode = Math.floor(100 + Math.random() * 899);
    const totalAmount = baseAmount + taxAmount + uniqueCode;

    const newInvoiceNo = `INV/RJ/${periodYear}/${String(periodMonth).padStart(2, '0')}/${Math.floor(1000 + Math.random() * 9000)}`;

    const newBill: Bill = {
      id: 'bill_' + Math.random().toString(36).substring(2, 9),
      invoiceNo: newInvoiceNo,
      customerId: cust.id,
      customerCode: cust.customerCode,
      customerName: cust.name,
      customerEmail: cust.email,
      packageName: `${cust.packageName} (${cust.bandwidthSpeed})`,
      periodMonth,
      periodYear,
      amount: baseAmount,
      taxAmount,
      uniqueCode,
      totalAmount,
      status: 'UNPAID',
      dueDate: `${periodYear}-${String(periodMonth).padStart(2, '0')}-${String(cust.dueDateDay).padStart(2, '0')}T23:59:59.000Z`,
      emailReportSent: false,
      createdAt: new Date().toISOString(),
    };

    onAddBill(newBill);
    setShowGenerateModal(false);

    pushNotification({
      title: 'Invoice Baru Diterbitkan',
      message: `Invoice ${newInvoiceNo} untuk ${cust.name} senilai ${formatRupiah(totalAmount)} berhasil dibuat.`,
      type: 'PAYMENT',
      recipientRole: 'admin',
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Banner with Stats & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white">Sistem Penagihan &amp; Faktur Otomatis</h2>
          <p className="text-xs text-slate-400">
            Automasi pengiriman kuitansi ke email pelanggan dan integrasi payment gateway real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportBillsReportPDF(filteredBills, 'Laporan Penagihan')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor PDF</span>
          </button>

          <button
            type="button"
            onClick={() => exportBillsToExcel(filteredBills)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Terbitkan Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* Mini Revenue Summaries */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Pendapatan Terkumpul</span>
            <span className="text-xl font-extrabold text-emerald-400">{formatRupiah(paidTotal)}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Tagihan Belum Dibayar / Tunggakan</span>
            <span className="text-xl font-extrabold text-amber-400">{formatRupiah(unpaidTotal)}</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Total Faktur Dikeluarkan</span>
            <span className="text-xl font-extrabold text-white">{bills.length} Faktur</span>
          </div>
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
            <Receipt className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor invoice (INV/...), nama pelanggan, atau ID..."
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
          <option value="ALL">Semua Status Tagihan</option>
          <option value="PAID">Lunas (PAID)</option>
          <option value="UNPAID">Belum Bayar (UNPAID)</option>
          <option value="OVERDUE">Jatuh Tempo (OVERDUE)</option>
        </select>
      </div>

      {/* Bills Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">No. Faktur &amp; Periode</th>
                <th className="px-4 py-3">Nama Pelanggan</th>
                <th className="px-4 py-3">Paket Layanan</th>
                <th className="px-4 py-3">Total Tagihan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Laporan Email</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Tidak ditemukan data tagihan.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const isPaid = b.status === 'PAID';
                  const cust = customers.find((c) => c.id === b.customerId);

                  return (
                    <tr key={b.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-white font-mono">{b.invoiceNo}</div>
                        <div className="text-[10px] text-slate-400">
                          Bulan {b.periodMonth}/{b.periodYear} &bull; Jatuh Tempo: {formatIndoDate(b.dueDate)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-200">{b.customerName}</div>
                        <div className="text-[11px] text-cyan-400 font-mono">{b.customerCode}</div>
                        <div className="text-[10px] text-slate-400">{b.customerEmail}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">{b.packageName}</div>
                        <div className="text-[10px] text-slate-400">
                          Dasar: {formatRupiah(b.amount)} + PPN: {formatRupiah(b.taxAmount)}
                        </div>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <div className="font-extrabold text-sm text-cyan-300">
                          {formatRupiah(b.totalAmount)}
                        </div>
                        {isPaid && b.paymentMethod && (
                          <div className="text-[10px] text-emerald-400 mt-0.5">
                            {b.paymentMethod}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isPaid
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : b.status === 'OVERDUE'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {b.emailReportSent ? (
                          <button
                            type="button"
                            onClick={() => onViewEmailReceipt(b)}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[10px] font-medium transition"
                          >
                            <Mail className="w-3 h-3 text-emerald-400" />
                            <span>Terkirim &bull; Lihat</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic">
                            Otomatis saat bayar
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Payment Gateway Trigger */}
                          {!isPaid ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onOpenPaymentGateway(b)}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[11px] flex items-center gap-1 transition"
                                title="Buka Gateway Pembayaran"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>Bayar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkAsPaid(b)}
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-emerald-950/40 text-slate-300 hover:text-emerald-300 text-[10px] transition"
                                title="Verifikasi Tunai"
                              >
                                Verif
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => exportSingleInvoicePDF(b, cust)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition"
                              title="Unduh Kuitansi PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-cyan-400" />
                              <span>PDF</span>
                            </button>
                          )}
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

      {/* Generate Invoice Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Terbitkan Invoice Tagihan Bulanan</h3>
              <button
                type="button"
                onClick={() => setShowGenerateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoice} className="py-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Pelanggan *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) - {c.packageName} ({formatRupiah(c.monthlyFee)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Bulan Periode</label>
                  <select
                    value={periodMonth}
                    onChange={(e) => setPeriodMonth(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                      <option key={m} value={m}>
                        Bulan {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tahun Periode</label>
                  <input
                    type="number"
                    value={periodYear}
                    onChange={(e) => setPeriodYear(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Sistem akan menghitung PPN 11% dan kode verifikasi 3 digit secara otomatis. Notifikasi invoice akan muncul di portal pelanggan.
              </p>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Terbitkan Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
