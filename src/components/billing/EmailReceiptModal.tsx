import React from 'react';
import { CheckCircle2, Download, ExternalLink, Mail, Send, X } from 'lucide-react';
import { Bill } from '../../types';
import { generateReceiptEmailHTML } from '../../services/emailService';
import { exportSingleInvoicePDF } from '../../utils/export';

interface EmailReceiptModalProps {
  bill: Bill | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EmailReceiptModal: React.FC<EmailReceiptModalProps> = ({ bill, isOpen, onClose }) => {
  if (!isOpen || !bill) return null;

  const htmlContent = generateReceiptEmailHTML(bill);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-100 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Laporan Otomatis Email Pelanggan</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> DELIVERED
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Penerima: <span className="text-cyan-400 font-mono">{bill.customerEmail}</span> &bull; {bill.invoiceNo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Meta bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800/80 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div>
            <span className="font-semibold text-slate-300">Subjek: </span>
            <span>[LUNAS] Konfirmasi Pembayaran Tagihan Internet RADIAN JOGJA - {bill.invoiceNo}</span>
          </div>
          <div>
            <span className="font-semibold text-slate-300">Waktu Kirim: </span>
            <span>{bill.emailReportTimestamp ? new Date(bill.emailReportTimestamp).toLocaleString('id-ID') : 'Terkirim otomatis saat pembayaran'}</span>
          </div>
        </div>

        {/* Rendered HTML Email Preview */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-950/60">
          <div className="bg-white rounded-xl shadow-inner overflow-hidden border border-slate-700">
            <iframe
              srcDoc={htmlContent}
              title="Receipt Email Preview"
              className="w-full h-[380px] sm:h-[440px] border-none"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-slate-400 hidden sm:block">
            Sistem pengiriman email tersinkronisasi otomatis dengan status pembayaran Firestore.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => exportSingleInvoicePDF(bill)}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span>Unduh PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
