import { Bill, Customer, EmailDispatchLog } from '../types';
import { formatIndoDate, formatRupiah } from '../utils/export';

// Local storage key for email history
const EMAIL_LOGS_KEY = 'radian_jogja_email_dispatches';

export function getDispatchedEmails(): EmailDispatchLog[] {
  try {
    const raw = localStorage.getItem(EMAIL_LOGS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDispatchedEmail(log: EmailDispatchLog) {
  try {
    const current = getDispatchedEmails();
    const updated = [log, ...current].slice(0, 50); // Keep last 50
    localStorage.setItem(EMAIL_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save email dispatch log:', e);
  }
}

/**
 * Generate official payment receipt HTML email template
 */
export function generateReceiptEmailHTML(bill: Bill, customer?: Customer): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0f172a; color: #334155; margin: 0; padding: 20px; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.2); }
    .header { background: linear-gradient(135deg, #0284c7 0%, #2563eb 50%, #4f46e5 100%); padding: 30px; text-align: center; color: #ffffff; }
    .brand-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
    .brand-sub { font-size: 13px; opacity: 0.9; margin-top: 5px; }
    .badge { display: inline-block; background-color: #10b981; color: white; padding: 6px 16px; border-radius: 9999px; font-size: 12px; font-weight: 700; margin-top: 15px; }
    .content { padding: 30px; }
    .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 8px; }
    .desc { font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
    .table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    .table th { background: #f8fafc; text-align: left; padding: 10px 12px; font-size: 12px; color: #64748b; border-bottom: 1px solid #e2e8f0; }
    .table td { padding: 12px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .total-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .total-label { font-size: 12px; color: #166534; font-weight: 600; text-transform: uppercase; }
    .total-val { font-size: 22px; color: #15803d; font-weight: 800; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="brand-title">RADIAN JOGJA</h1>
      <p class="brand-sub">Solusi Internet Fiber Optik Istimewa Yogyakarta</p>
      <div class="badge">PEMBAYARAN BERHASIL DIVERIFIKASI</div>
    </div>
    <div class="content">
      <div class="greeting">Halo ${bill.customerName},</div>
      <p class="desc">Terima kasih telah melakukan pembayaran tagihan internet RADIAN JOGJA. Layanan koneksi internet rumah Anda tetap aktif dan beroperasi dalam performa maksimal.</p>

      <table class="table">
        <tr>
          <th>Nomor Invoice</th>
          <td><strong>${bill.invoiceNo}</strong></td>
        </tr>
        <tr>
          <th>ID Pelanggan</th>
          <td>${bill.customerCode}</td>
        </tr>
        <tr>
          <th>Paket Internet</th>
          <td>${bill.packageName}</td>
        </tr>
        <tr>
          <th>Periode Tagihan</th>
          <td>Bulan ${bill.periodMonth} / Tahun ${bill.periodYear}</td>
        </tr>
        <tr>
          <th>Waktu Pembayaran</th>
          <td>${bill.paidAt ? formatIndoDate(bill.paidAt) : 'Hari ini'}</td>
        </tr>
        <tr>
          <th>Metode Bayar</th>
          <td>${bill.paymentMethod || 'Payment Gateway'}</td>
        </tr>
        <tr>
          <th>Referensi Transaksi</th>
          <td>${bill.paymentReference || 'TX-RADIAN-' + bill.id.slice(0, 10).toUpperCase()}</td>
        </tr>
      </table>

      <div class="total-box">
        <div class="total-label">Total Pembayaran Lunas</div>
        <div class="total-val">${formatRupiah(bill.totalAmount)}</div>
      </div>

      <p style="font-size: 13px; color: #64748b; line-height: 1.6;">
        Bukti pembayaran ini sah dan diterbitkan secara digital oleh sistem automasi RADIAN JOGJA. Anda juga dapat mengunduh dokumen kuitansi resmi dalam format PDF langsung melalui aplikasi pelanggan.
      </p>
    </div>
    <div class="footer">
      <p style="margin: 0 0 6px 0;">Butuh bantuan teknis? Hubungi NOC Support RADIAN JOGJA 24/7 di WhatsApp 0812-3456-7890</p>
      <p style="margin: 0;">&copy; 2026 RADIAN JOGJA. Seluruh Hak Cipta Dilindungi.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Automate email dispatch when bill is paid
 */
export async function sendAutomaticPaymentReport(bill: Bill, customer?: Customer): Promise<EmailDispatchLog> {
  const html = generateReceiptEmailHTML(bill, customer);
  const log: EmailDispatchLog = {
    id: 'eml_' + Math.random().toString(36).substring(2, 9),
    recipientEmail: bill.customerEmail,
    recipientName: bill.customerName,
    subject: `[LUNAS] Konfirmasi Pembayaran Tagihan Internet RADIAN JOGJA - ${bill.invoiceNo}`,
    invoiceNo: bill.invoiceNo,
    amount: bill.totalAmount,
    sentAt: new Date().toISOString(),
    status: 'DELIVERED',
    htmlContent: html,
  };

  // Simulate network delivery
  await new Promise((r) => setTimeout(r, 600));
  saveDispatchedEmail(log);

  return log;
}
