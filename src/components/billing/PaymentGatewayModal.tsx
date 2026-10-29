import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Mail,
  QrCode,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { Bill, Customer } from '../../types';
import { formatIndoDate, formatRupiah, exportSingleInvoicePDF } from '../../utils/export';
import { sendAutomaticPaymentReport } from '../../services/emailService';
import { useNotification } from '../../context/NotificationContext';

interface PaymentGatewayModalProps {
  bill: Bill;
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paidBill: Bill) => void;
}

type PaymentChannel = 'qris' | 'va_bca' | 'va_mandiri' | 'va_bri' | 'gopay' | 'dana';

export const PaymentGatewayModal: React.FC<PaymentGatewayModalProps> = ({
  bill,
  customer,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [selectedChannel, setSelectedChannel] = useState<PaymentChannel>('qris');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(899); // 14:59
  const [completedBill, setCompletedBill] = useState<Bill | null>(null);

  const { pushNotification } = useNotification();

  // Timer countdown
  useEffect(() => {
    if (!isOpen || isSuccess) return;
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isSuccess]);

  if (!isOpen) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const vaNumber = `8920${bill.customerCode.replace(/\D/g, '')}${bill.periodMonth}${String(bill.uniqueCode).padStart(3, '0')}`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSimulatePayment = async () => {
    setIsProcessing(true);

    try {
      // Simulate gateway processing delay
      await new Promise((r) => setTimeout(r, 1200));

      const channelNameMap: Record<PaymentChannel, string> = {
        qris: 'QRIS Realtime (NMID 8920198)',
        va_bca: 'BCA Virtual Account',
        va_mandiri: 'Mandiri Virtual Account',
        va_bri: 'BRI Virtual Account',
        gopay: 'GoPay E-Wallet',
        dana: 'DANA E-Wallet',
      };

      const now = new Date().toISOString();
      const paidBill: Bill = {
        ...bill,
        status: 'PAID',
        paidAt: now,
        paymentMethod: channelNameMap[selectedChannel],
        paymentReference: `TX-RADIAN-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
        emailReportSent: true,
        emailReportTimestamp: now,
      };

      // 1. Dispatch automated email receipt to customer
      await sendAutomaticPaymentReport(paidBill, customer);

      // 2. Fire push notification to system
      pushNotification({
        title: 'Pembayaran Tagihan Dikonfirmasi',
        message: `Pembayaran ${bill.invoiceNo} senilai ${formatRupiah(bill.totalAmount)} oleh ${bill.customerName} via ${channelNameMap[selectedChannel]} berhasil lunas. Laporan otomatis terkirim ke email ${bill.customerEmail}.`,
        type: 'PAYMENT',
        recipientRole: 'admin',
      });

      // 3. Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#10b981', '#f59e0b'],
        });
      } catch {
        // Confetti safe fallback
      }

      setCompletedBill(paidBill);
      setIsSuccess(true);
      onPaymentSuccess(paidBill);
    } catch (e) {
      console.error('Payment simulation failed:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden text-slate-100 my-auto">
        {/* Modal Header */}
        <div className="relative p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center ring-1 ring-cyan-500/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Payment Gateway</h3>
              <p className="text-xs text-slate-400">RADIAN JOGJA &bull; Transaksi Aman & Terenkripsi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-5">
          {!isSuccess ? (
            <>
              {/* Invoice Summary Box */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Tagihan Internet</span>
                  <span className="text-2xl font-extrabold text-cyan-400">
                    {formatRupiah(bill.totalAmount)}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {bill.packageName} &bull; Periode {bill.periodMonth}/{bill.periodYear}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 animate-pulse" />
                  <span>{formattedTime}</span>
                </div>
              </div>

              {/* Payment Channel Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5 block">
                  Pilih Saluran Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('qris')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      selectedChannel === 'qris'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span className="text-xs font-bold">QRIS Instant</span>
                    <span className="text-[10px] text-emerald-400 font-medium">Bebas Biaya</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('va_bca')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      selectedChannel === 'va_bca'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-5 h-5 rounded font-bold text-xs flex items-center justify-center bg-blue-600 text-white">
                      B
                    </div>
                    <span className="text-xs font-bold">BCA VA</span>
                    <span className="text-[10px] text-slate-400">Auto Cek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChannel('gopay')}
                    className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1.5 ${
                      selectedChannel === 'gopay'
                        ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold">GoPay / E-Wallet</span>
                    <span className="text-[10px] text-slate-400">1-Klik Bayar</span>
                  </button>
                </div>
              </div>

              {/* Payment Details according to Channel */}
              {selectedChannel === 'qris' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 px-2">
                    <span className="font-semibold text-white">QRIS Nasional</span>
                    <span>NMID: ID1029482910</span>
                  </div>

                  {/* High Quality Stylized QR Code Graphic */}
                  <div className="inline-block p-3 rounded-2xl bg-white shadow-lg mx-auto">
                    <svg viewBox="0 0 160 160" className="w-44 h-44">
                      {/* Stylized QR Grid */}
                      <rect width="160" height="160" fill="#ffffff" />
                      {/* Top Left Finder */}
                      <rect x="10" y="10" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="18" y="18" width="24" height="24" fill="#ffffff" rx="2" />
                      <rect x="24" y="24" width="12" height="12" fill="#0284c7" rx="2" />
                      {/* Top Right Finder */}
                      <rect x="110" y="10" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="118" y="18" width="24" height="24" fill="#ffffff" rx="2" />
                      <rect x="124" y="24" width="12" height="12" fill="#0284c7" rx="2" />
                      {/* Bottom Left Finder */}
                      <rect x="10" y="110" width="40" height="40" fill="#0f172a" rx="4" />
                      <rect x="18" y="118" width="24" height="24" fill="#ffffff" rx="2" />
                      <rect x="24" y="124" width="12" height="12" fill="#0284c7" rx="2" />
                      {/* Dynamic Mock Data Dots */}
                      <g fill="#1e293b">
                        <rect x="60" y="20" width="8" height="8" />
                        <rect x="75" y="20" width="8" height="8" />
                        <rect x="90" y="30" width="8" height="8" />
                        <rect x="60" y="40" width="8" height="8" />
                        <rect x="80" y="50" width="8" height="8" />
                        <rect x="20" y="65" width="8" height="8" />
                        <rect x="40" y="70" width="8" height="8" />
                        <rect x="60" y="70" width="12" height="12" fill="#0284c7" />
                        <rect x="80" y="70" width="8" height="8" />
                        <rect x="100" y="70" width="8" height="8" />
                        <rect x="130" y="70" width="8" height="8" />
                        <rect x="20" y="90" width="8" height="8" />
                        <rect x="40" y="90" width="8" height="8" />
                        <rect x="70" y="90" width="8" height="8" />
                        <rect x="90" y="90" width="8" height="8" />
                        <rect x="120" y="90" width="8" height="8" />
                        <rect x="60" y="110" width="8" height="8" />
                        <rect x="80" y="120" width="8" height="8" />
                        <rect x="100" y="110" width="8" height="8" />
                        <rect x="120" y="130" width="8" height="8" />
                        <rect x="140" y="120" width="8" height="8" />
                      </g>
                      {/* Center Brand Badge */}
                      <circle cx="80" cy="80" r="16" fill="#0f172a" />
                      <circle cx="80" cy="80" r="14" fill="#0284c7" />
                      <text x="80" y="85" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">RJ</text>
                    </svg>
                  </div>

                  <p className="text-xs text-slate-400">
                    Buka BCA Mobile, Livin, BRImo, GoPay, OVO, ShopeePay atau DANA lalu scan QRIS di atas.
                  </p>
                </div>
              )}

              {selectedChannel === 'va_bca' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Nomor Virtual Account BCA</span>
                    <span className="text-emerald-400 font-medium">Aktif 24 Jam</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-700">
                    <span className="font-mono text-base font-bold text-white tracking-wider">
                      {vaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(vaNumber)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-semibold transition"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copied ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p>1. Buka m-BCA &gt; m-Transfer &gt; BCA Virtual Account</p>
                    <p>2. Masukkan nomor VA di atas lalu pastikan nama penerima: RADIAN JOGJA</p>
                    <p>3. Konfirmasi PIN pembayaran.</p>
                  </div>
                </div>
              )}

              {selectedChannel === 'gopay' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Pilihan E-Wallet Instan</span>
                    <span className="text-cyan-400 font-medium">Verifikasi Otomatis</span>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Integrasi instan langsung membuka aplikasi GoPay / DANA di ponsel Anda.</span>
                  </div>
                </div>
              )}

              {/* Security Banner */}
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Enkripsi 256-bit SSL &bull; Laporan otomatis terkirim ke email pelanggan setelah lunas.</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleSimulatePayment}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <>
                      <span>Bayar Sekarang</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Success State */
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-white">Pembayaran Sukses!</h4>
                <p className="text-sm text-slate-300 mt-1">
                  Tagihan <span className="font-semibold text-white">{bill.invoiceNo}</span> telah LUNAS.
                </p>
                <p className="text-xs text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>Kuitansi resmi dikirimkan otomatis ke {bill.customerEmail}</span>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Terbayar:</span>
                  <span className="font-bold text-white">{formatRupiah(bill.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Metode Bayar:</span>
                  <span className="font-semibold text-cyan-400">{completedBill?.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">No. Referensi:</span>
                  <span className="font-mono text-slate-300">{completedBill?.paymentReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Akses:</span>
                  <span className="text-emerald-400 font-bold">AKTIF & STABIL</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => completedBill && exportSingleInvoicePDF(completedBill, customer)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-4 h-4 text-cyan-400" />
                  <span>Unduh Kuitansi PDF</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
