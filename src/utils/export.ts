import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Bill, Customer, InventoryItem, Ticket } from '../types';

/**
 * Format currency to IDR Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format Date to Indonesian format
 */
export function formatIndoDate(dateStr?: string | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Export Individual Payment Receipt / Invoice to PDF
 */
export function exportSingleInvoicePDF(bill: Bill, customer?: Customer) {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 40, 'F');

  // Accent Line
  doc.setFillColor(2, 132, 199); // sky-600
  doc.rect(0, 40, 210, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RADIAN JOGJA', 15, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('ISP & Solusi Jaringan Internet Fiber Optik Istimewa', 15, 27);
  doc.text('Jl. Kaliurang KM 8.5, Ngaglik, Sleman, D.I. Yogyakarta | info@radianjogja.net', 15, 33);

  // Status Badge on top right
  const isPaid = bill.status === 'PAID';
  doc.setFillColor(isPaid ? 22 : 220, isPaid ? 101 : 38, isPaid ? 52 : 38);
  doc.roundedRect(150, 14, 45, 14, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(isPaid ? 'LUNAS (PAID)' : 'BELUM BAYAR', 155, 23);

  // Invoice Details Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(14);
  doc.text('FAKTUR TAGIHAN & BUKTI PEMBAYARAN', 15, 55);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 58, 195, 58);

  // Left column: Customer Info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Ditagihkan Kepada:', 15, 66);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`Nama Pelanggan : ${bill.customerName}`, 15, 73);
  doc.text(`ID Pelanggan   : ${bill.customerCode}`, 15, 79);
  doc.text(`Email          : ${bill.customerEmail}`, 15, 85);
  if (customer?.address) {
    doc.text(`Alamat Pasang  : ${customer.address.slice(0, 40)}`, 15, 91);
    doc.text(`Area / ODP     : ${customer.areaZone} (${customer.odpBox})`, 15, 97);
  }

  // Right column: Invoice Meta
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Detail Dokumen:', 125, 66);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(`No. Faktur      : ${bill.invoiceNo}`, 125, 73);
  doc.text(`Periode Tagihan : Bulan ${bill.periodMonth}/${bill.periodYear}`, 125, 79);
  doc.text(`Jatuh Tempo     : ${formatIndoDate(bill.dueDate)}`, 125, 85);
  if (isPaid && bill.paidAt) {
    doc.text(`Tanggal Bayar   : ${formatIndoDate(bill.paidAt)}`, 125, 91);
    doc.text(`Metode          : ${bill.paymentMethod || 'Payment Gateway'}`, 125, 97);
  }

  // Item Table
  const tableStartY = 110;
  doc.setFillColor(241, 245, 249);
  doc.rect(15, tableStartY, 180, 10, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Deskripsi Layanan', 20, tableStartY + 7);
  doc.text('Kecepatan', 110, tableStartY + 7);
  doc.text('Jumlah', 165, tableStartY + 7);

  // Table Row
  doc.setFont('helvetica', 'normal');
  doc.text(`Langganan Internet Unlimited - ${bill.packageName}`, 20, tableStartY + 19);
  doc.text(customer?.bandwidthSpeed || 'Up to 50 Mbps', 110, tableStartY + 19);
  doc.text(formatRupiah(bill.amount), 165, tableStartY + 19);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, tableStartY + 25, 195, tableStartY + 25);

  // Summary Table
  let sumY = tableStartY + 33;
  doc.text('Subtotal:', 125, sumY);
  doc.text(formatRupiah(bill.amount), 165, sumY);

  sumY += 7;
  doc.text('PPN (11%):', 125, sumY);
  doc.text(formatRupiah(bill.taxAmount), 165, sumY);

  if (bill.uniqueCode > 0) {
    sumY += 7;
    doc.text('Kode Verifikasi:', 125, sumY);
    doc.text(formatRupiah(bill.uniqueCode), 165, sumY);
  }

  sumY += 5;
  doc.setFillColor(248, 250, 252);
  doc.rect(120, sumY, 75, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text('TOTAL TAGIHAN:', 125, sumY + 8);
  doc.text(formatRupiah(bill.totalAmount), 165, sumY + 8);

  // Footer / Verification QR info
  const footerY = 200;
  doc.setDrawColor(226, 232, 240);
  doc.line(15, footerY, 195, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Kuitansi ini adalah bukti pembayaran sah yang dihasilkan secara otomatis oleh sistem billing RADIAN JOGJA.', 15, footerY + 8);
  doc.text(`Ref ID: ${bill.paymentReference || 'TX-RADIAN-' + bill.id.slice(0, 8).toUpperCase()}`, 15, footerY + 14);
  doc.text('Terima kasih telah mempercayakan koneksi internet rumah Anda bersama RADIAN JOGJA.', 15, footerY + 20);

  // Save/Download
  doc.save(`Invoice_${bill.invoiceNo.replace(/\//g, '_')}.pdf`);
}

/**
 * Export Bill List to PDF Summary Report
 */
export function exportBillsReportPDF(bills: Bill[], periodTitle: string = 'Semua Periode') {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('RADIAN JOGJA - LAPORAN KEUANGAN & PENAGIHAN', 15, 18);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(186, 230, 253);
  doc.text(`Periode: ${periodTitle} | Diekspor pada: ${new Date().toLocaleString('id-ID')}`, 15, 26);

  let currentY = 44;
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');

  // Table header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, currentY, 180, 8, 'F');
  doc.text('No. Invoice', 17, currentY + 6);
  doc.text('Pelanggan', 55, currentY + 6);
  doc.text('Paket', 105, currentY + 6);
  doc.text('Total', 140, currentY + 6);
  doc.text('Status', 175, currentY + 6);

  currentY += 12;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  let totalRevenue = 0;
  let paidCount = 0;

  bills.forEach((b) => {
    if (currentY > 275) {
      doc.addPage();
      currentY = 20;
    }
    if (b.status === 'PAID') {
      totalRevenue += b.totalAmount;
      paidCount++;
    }

    doc.text(b.invoiceNo, 17, currentY);
    doc.text(b.customerName.slice(0, 22), 55, currentY);
    doc.text(b.packageName.slice(0, 16), 105, currentY);
    doc.text(formatRupiah(b.totalAmount), 140, currentY);
    doc.text(b.status, 175, currentY);

    currentY += 7;
  });

  // Summary box
  currentY += 5;
  if (currentY > 260) {
    doc.addPage();
    currentY = 20;
  }
  doc.setFillColor(240, 253, 250);
  doc.rect(15, currentY, 180, 18, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Terbayar: ${paidCount} / ${bills.length} Tagihan`, 20, currentY + 8);
  doc.text(`Total Pendapatan Terkumpul: ${formatRupiah(totalRevenue)}`, 20, currentY + 14);

  doc.save(`Laporan_Billing_RADIAN_JOGJA_${new Date().toISOString().slice(0, 10)}.pdf`);
}

/**
 * Export Bills to Excel (.xlsx)
 */
export function exportBillsToExcel(bills: Bill[], filename: string = 'Laporan_Tagihan_RADIAN_JOGJA') {
  const rows = bills.map((b) => ({
    'No Faktur': b.invoiceNo,
    'ID Pelanggan': b.customerCode,
    'Nama Pelanggan': b.customerName,
    'Email': b.customerEmail,
    'Paket': b.packageName,
    'Periode': `${b.periodMonth}/${b.periodYear}`,
    'Tarif Dasar': b.amount,
    'PPN (11%)': b.taxAmount,
    'Kode Unik': b.uniqueCode,
    'Total Tagihan (Rp)': b.totalAmount,
    'Status': b.status,
    'Jatuh Tempo': b.dueDate ? b.dueDate.slice(0, 10) : '',
    'Tanggal Bayar': b.paidAt ? b.paidAt.slice(0, 10) : '',
    'Metode Bayar': b.paymentMethod || '',
    'Laporan Email Terkirim': b.emailReportSent ? 'Ya' : 'Belum',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Tagihan');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Customers to Excel (.xlsx)
 */
export function exportCustomersToExcel(customers: Customer[], filename: string = 'Data_Pelanggan_RADIAN_JOGJA') {
  const rows = customers.map((c) => ({
    'ID Pelanggan': c.customerCode,
    'Nama Lengkap': c.name,
    'Email': c.email,
    'No. WhatsApp': c.phone,
    'Paket Internet': c.packageName,
    'Kecepatan': c.bandwidthSpeed,
    'Biaya Bulanan (Rp)': c.monthlyFee,
    'Username PPPoE': c.pppoeUser,
    'IP Address': c.assignedIp,
    'MAC ONT': c.ontMac,
    'Kotak ODP': c.odpBox,
    'Area / Wilayah': c.areaZone,
    'Alamat Pemasangan': c.address,
    'Status Berlangganan': c.status,
    'Redaman Optik (dBm)': c.signalDbm,
    'Tanggal Pasang': c.installedAt ? c.installedAt.slice(0, 10) : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelanggan');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Tickets to Excel (.xlsx)
 */
export function exportTicketsToExcel(tickets: Ticket[], filename: string = 'Laporan_Tiket_RADIAN_JOGJA') {
  const rows = tickets.map((t) => ({
    'No Tiket': t.ticketNo,
    'Pelanggan': t.customerName,
    'Telepon': t.customerPhone,
    'Alamat': t.customerAddress,
    'Kategori': t.category,
    'Prioritas': t.priority,
    'Judul Gangguan': t.subject,
    'Status Tiket': t.status,
    'Teknisi Bertugas': t.assignedTechnicianName || 'Belum Ditugaskan',
    'Redaman (dBm)': t.opticalAttenuationDbm || '',
    'Catatan Tindakan': t.actionNotes || '',
    'Waktu Lapor': t.createdAt ? new Date(t.createdAt).toLocaleString('id-ID') : '',
    'Waktu Selesai': t.resolvedAt ? new Date(t.resolvedAt).toLocaleString('id-ID') : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tiket Gangguan');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Export Inventory Stock to Excel (.xlsx)
 */
export function exportInventoryToExcel(items: InventoryItem[], filename: string = 'Stok_Inventaris_RADIAN_JOGJA') {
  const rows = items.map((i) => ({
    'Kode SKU': i.sku,
    'Nama Barang / Alat': i.name,
    'Kategori': i.category,
    'Stok Tersedia': i.quantity,
    'Satuan': i.unit,
    'Batas Minimum': i.minThreshold,
    'Harga Satuan (Rp)': i.unitCost,
    'Lokasi Gudang': i.location,
    'Kode API Supplier': i.supplierApiCode,
    'Terakhir Sinkron': i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleString('id-ID') : '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaris');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
