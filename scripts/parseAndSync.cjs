const fs = require('fs');
const path = require('path');

// Read files
const minoTxt = fs.readFileSync(path.join(__dirname, '../public/assets/aistudio/list-klien_minomartani_dd964fe2.txt'), 'utf8');
const nangTxt = fs.readFileSync(path.join(__dirname, '../public/assets/aistudio/list-klien_nanggulan_e361be0a.txt'), 'utf8');
const sedaTxt = fs.readFileSync(path.join(__dirname, '../public/assets/aistudio/list-klien_sedayu_fce90b1d.txt'), 'utf8');
const csvNang = fs.readFileSync(path.join(__dirname, '../public/assets/aistudio/1_1752f88c.csv'), 'utf8');
const csvMinoSeda = fs.readFileSync(path.join(__dirname, '../public/assets/aistudio/2_ec91c1ee.csv'), 'utf8');

function parseRouterOS(content) {
  const lines = content.split('\n');
  const items = [];
  let current = null;

  for (let l of lines) {
    const trimmed = l.trim();
    if (trimmed.startsWith(';;;')) {
      if (current && current.name) items.push(current);
      current = { comment: trimmed.replace(';;;', '').trim() };
      continue;
    }
    const nameMatch = l.match(/name="([^"]+)"/);
    const targetMatch = l.match(/target=([^\s]+)/);
    const maxLimitMatch = l.match(/max-limit=([^\s]+)/);

    if (nameMatch) {
      if (!current) current = {};
      current.name = nameMatch[1];
    }
    if (targetMatch) {
      if (!current) current = {};
      current.target = targetMatch[1].replace(/\/32/g, '');
    }
    if (maxLimitMatch) {
      if (!current) current = {};
      current.maxLimit = maxLimitMatch[1];
    }
    if (current && current.name && current.target && (l.includes('burst-time') || l.includes('bucket-size') || trimmed === '')) {
      items.push(current);
      current = null;
    }
  }
  if (current && current.name) items.push(current);
  return items.filter(c => c.name && !c.name.includes('# GLOBAL'));
}

function parseCSV(content) {
  const lines = content.split('\n');
  const rows = [];
  for (let l of lines) {
    if (!l.trim()) continue;
    const parts = l.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (parts.length > 3) rows.push(parts);
  }
  return rows;
}

const minoQueues = parseRouterOS(minoTxt);
const nangQueues = parseRouterOS(nangTxt);
const sedaQueues = parseRouterOS(sedaTxt);

const csvNangRows = parseCSV(csvNang).filter(r => r[1] && r[1].trim() && !r[1].startsWith('Nama') && !r[1].startsWith('TAGIHAN'));
const csvMinoSedaRows = parseCSV(csvMinoSeda).filter(r => r[1] && r[1].trim() && !r[1].includes('Nama') && !r[1].includes('TAGIHAN'));

// Separate Mino and Sedayu rows from 2_ec91c1ee.csv
// Rows with indexes up to 39 are Minomartani, 40 to 51 are Sedayu, 52+ are additional
const minoRows = [];
const sedaRows = [];
for (let r of csvMinoSedaRows) {
  const name = r[1].toLowerCase();
  const num = parseInt(r[0]);
  if (num >= 40 && num <= 51) {
    sedaRows.push(r);
  } else if (name === 'catur' || name === 'uges' || name === 'yudis' || name === 'adam' || name === 'uut' || name === 'ferry' || name === 'heru' || name === 'blok a' || name === 'aul' || name === 'mul' || name === 'bagas' || name === 'sigit') {
    sedaRows.push(r);
  } else {
    minoRows.push(r);
  }
}

console.log(`Parsed: Mino=${minoRows.length}, Seda=${sedaRows.length}, Nang=${csvNangRows.length}`);

// Month mapping
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

function normalizeName(str) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function findBestQueue(clientName, queues) {
  const cNorm = normalizeName(clientName);
  const words = cNorm.split(' ').filter(w => w.length > 2 && w !== 'tgl' && w !== 'ok' && w !== 'new');

  let best = null;
  let maxScore = 0;

  for (let q of queues) {
    const qNorm = normalizeName(q.name);
    if (qNorm === cNorm) return q;

    let score = 0;
    for (let w of words) {
      if (qNorm.includes(w)) score += 2;
    }
    if (score > maxScore) {
      maxScore = score;
      best = q;
    }
  }

  return maxScore >= 2 ? best : null;
}

// Extract signal dBm from queue name or comment
function extractSignalDbm(queue) {
  if (!queue) return -19.4;
  const text = (queue.name || '') + ' ' + (queue.comment || '');
  const match = text.match(/\[?\s*(-?\d{2})\s*\]?\s*(?:dbm|huawei|zim|hsgq)?/i);
  if (match) {
    let val = parseInt(match[1]);
    if (val > 0) val = -val;
    if (val <= -10 && val >= -35) return val;
  }
  return Number((-18.5 - (Math.random() * 4)).toFixed(1));
}

// Convert maxLimit e.g. "30800k/30800k" or "101M/101M" to readable speed
function formatSpeed(maxLimit) {
  if (!maxLimit) return '20 Mbps';
  if (maxLimit.includes('M')) {
    const num = parseInt(maxLimit);
    return `${num || 50} Mbps`;
  }
  if (maxLimit.includes('k')) {
    const num = Math.round(parseInt(maxLimit) / 1000);
    return `${num || 20} Mbps`;
  }
  return '30 Mbps';
}

const allCustomers = [];
const allBills = [];

function processRegion(rows, queues, regionName) {
  rows.forEach((r, idx) => {
    const rawName = r[1].trim();
    if (!rawName) return;

    const rawCode = r[2] ? r[2].trim() : '';
    const code = rawCode && rawCode.length >= 4 ? rawCode : `${regionName.slice(0, 3).toUpperCase()}-${String(idx + 1).padStart(3, '0')}`;
    const tglPasang = r[3] ? r[3].trim() : '2025-01-10';
    
    // Fee parsing e.g. "100" -> 100000, "150" -> 150000, "75" -> 75000, "50" -> 50000, "200" -> 200000
    const rawFee = r[4] ? parseInt(r[4].replace(/\D/g, '')) : 100;
    const monthlyFee = (rawFee > 0 && rawFee < 1000) ? rawFee * 1000 : (rawFee >= 1000 ? rawFee : 100000);

    const queue = findBestQueue(rawName, queues);
    const assignedIp = queue ? queue.target.split(',')[0] : `3.3.3.${50 + idx}`;
    const signalDbm = extractSignalDbm(queue);
    const bandwidthSpeed = queue ? formatSpeed(queue.maxLimit) : (monthlyFee >= 200000 ? '50 Mbps' : monthlyFee >= 150000 ? '30 Mbps' : '20 Mbps');

    const cleanName = rawName.replace(/^s\s+\d+\s+/, '').replace(/\s+ok$/i, '').trim();
    const custId = `cust_${regionName.toLowerCase()}_${idx + 1}`;

    const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${code}@radianjogja.net`;
    const username = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const defaultPassword = `Radian@${code.slice(-4) || '1234'}`;

    const customerObj = {
      id: custId,
      customerCode: code,
      name: cleanName,
      email: email,
      phone: `0812${String(10000000 + idx * 83).slice(0, 8)}`,
      packageId: monthlyFee >= 200000 ? 'pkg-50m' : monthlyFee >= 150000 ? 'pkg-30m' : 'pkg-20m',
      packageName: `Paket Internet ${bandwidthSpeed}`,
      bandwidthSpeed: bandwidthSpeed,
      monthlyFee: monthlyFee,
      pppoeUser: `${username}@radian`,
      assignedIp: assignedIp,
      ontMac: `48:8A:D2:${String(idx + 10).padStart(2, '0')}:9B:40`,
      odpBox: `ODP-${regionName.slice(0, 3).toUpperCase()}-${String(Math.floor(idx / 8) + 1).padStart(2, '0')}/08`,
      areaZone: regionName, // "Minomartani" | "Sedayu" | "Nanggulan"
      address: `Wilayah ${regionName}, D.I. Yogyakarta`,
      status: (queue && queue.name && queue.name.includes('OFF')) ? 'ISOLATED' : 'ACTIVE',
      encryptedNik: `E2EE::MzQwND${Buffer.from(String(3404000000000000 + idx)).toString('base64').slice(0, 16)}`,
      rawNik: String(3404010101900000 + idx + 1),
      signalDbm: signalDbm,
      dueDateDay: 10,
      installedAt: tglPasang.includes('2025') ? '2025-01-15T00:00:00.000Z' : '2026-01-10T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      // Portal Registration attributes (Managed by Admin)
      portalAccess: {
        isRegistered: idx % 3 !== 2, // sebagian besar terdaftar, admin bisa mendaftarkan yang belum
        username: username,
        password: defaultPassword,
        registeredAt: new Date(Date.now() - (idx * 3600000 * 24)).toISOString(),
      }
    };

    allCustomers.push(customerObj);

    // Process Month Payment Columns (columns index 6 to 17 correspond to Jan to Des)
    // In 1_1752f88c.csv: Jan=col 6, Feb=7, Mar=8, Apr=9, Mei=10, Jun=11, Jul=12, Agu=13, Sep=14, Okt=15, Nov=16, Des=17
    // In 2_ec91c1ee.csv: Jan=col 6, Feb=7, Mar=8, Apr=9, Mei=10, Jun=11, Jul=12, Agu=13, Sep=14, Okt=15, Nov=16, Des=17
    for (let m = 0; m < 12; m++) {
      const colIdx = 6 + m;
      const val = (r[colIdx] || '').trim();
      const monthNum = m + 1;

      // Only generate bill if month is up to current period (Okt/Nov 2026)
      if (monthNum > 11) continue;

      const isPaid = val !== '' && val !== '**';
      const baseAmount = monthlyFee;
      const taxAmount = Math.round(baseAmount * 0.11);
      const uniqueCode = (idx * 7 + monthNum * 13) % 900 + 100;
      const totalAmount = baseAmount + taxAmount + (isPaid ? 0 : uniqueCode);

      const billId = `bill_${custId}_2026_${monthNum}`;
      const invNo = `INV/RJ/2026/${String(monthNum).padStart(2, '0')}/${code.replace(/\D/g, '').slice(-4) || String(1000 + idx)}`;

      let paidAtDate = null;
      let payMethod = 'QRIS Realtime';

      if (isPaid) {
        if (val.toLowerCase().includes('cash')) {
          payMethod = 'Tunai (Kasir NOC)';
        } else if (val.toLowerCase().includes('bca')) {
          payMethod = 'BCA Virtual Account';
        } else {
          payMethod = 'Transfer / QRIS Realtime';
        }
        paidAtDate = `2026-${String(monthNum).padStart(2, '0')}-08T10:30:00.000Z`;
      }

      const billObj = {
        id: billId,
        invoiceNo: invNo,
        customerId: custId,
        customerCode: code,
        customerName: cleanName,
        customerEmail: email,
        packageName: customerObj.packageName,
        periodMonth: monthNum,
        periodYear: 2026,
        amount: baseAmount,
        taxAmount: taxAmount,
        uniqueCode: isPaid ? 0 : uniqueCode,
        totalAmount: isPaid ? baseAmount : totalAmount,
        status: isPaid ? 'PAID' : (monthNum < 10 ? 'OVERDUE' : 'UNPAID'),
        dueDate: `2026-${String(monthNum).padStart(2, '0')}-10T23:59:59.000Z`,
        paidAt: paidAtDate,
        paymentMethod: isPaid ? payMethod : undefined,
        paymentReference: isPaid ? `TX-${code}-${monthNum}` : undefined,
        emailReportSent: isPaid,
        emailReportTimestamp: paidAtDate,
        createdAt: `2026-${String(monthNum).padStart(2, '0')}-01T00:00:00.000Z`,
        rawPaymentNote: val,
      };

      allBills.push(billObj);
    }
  });
}

processRegion(minoRows, minoQueues, 'Minomartani');
processRegion(sedaRows, sedaQueues, 'Sedayu');
processRegion(csvNangRows, nangQueues, 'Nanggulan');

console.log(`Total generated real customers: ${allCustomers.length}`);
console.log(`Total generated real bills: ${allBills.length}`);

// Generate TypeScript file
const tsContent = `// Synchronized Real Dataset for RADIAN JOGJA from uploaded files
// Regions: Minomartani, Sedayu, Nanggulan
// Total Real Customers: ${allCustomers.length}
// Total Real Invoices: ${allBills.length}

import { Customer, Bill, DeviceNode, InventoryItem, Ticket, UserProfile } from '../types';

export interface PortalCustomer extends Customer {
  portalAccess: {
    isRegistered: boolean;
    username: string;
    password?: string;
    registeredAt?: string;
  };
}

export const REAL_CUSTOMERS: PortalCustomer[] = ${JSON.stringify(allCustomers, null, 2)};

export const REAL_BILLS: Bill[] = ${JSON.stringify(allBills, null, 2)};

export const REAL_DEVICES: DeviceNode[] = [
  {
    id: 'olt-mino-01',
    name: 'OLT Minomartani Core (ZTE C320 GPON)',
    type: 'OLT',
    ipAddress: '3.3.3.1',
    location: 'POP Minomartani, Ngaglik, Sleman',
    status: 'ONLINE',
    latencyMs: 1.6,
    packetLoss: 0,
    opticalRxDbm: -19.2,
    cpuUsagePercent: 32,
    connectedClients: ${allCustomers.filter(c => c.areaZone === 'Minomartani').length},
    lastPing: new Date().toISOString(),
  },
  {
    id: 'olt-seda-01',
    name: 'OLT Sedayu Hub (Huawei MA5608T)',
    type: 'OLT',
    ipAddress: '3.3.3.1',
    location: 'POP Sedayu, Bantul Barat',
    status: 'ONLINE',
    latencyMs: 2.1,
    packetLoss: 0,
    opticalRxDbm: -18.8,
    cpuUsagePercent: 28,
    connectedClients: ${allCustomers.filter(c => c.areaZone === 'Sedayu').length},
    lastPing: new Date().toISOString(),
  },
  {
    id: 'olt-nang-01',
    name: 'OLT Nanggulan Sub-Station (Fiberhome)',
    type: 'OLT',
    ipAddress: '3.3.3.1',
    location: 'POP Nanggulan, Kulon Progo',
    status: 'ONLINE',
    latencyMs: 2.7,
    packetLoss: 0,
    opticalRxDbm: -20.5,
    cpuUsagePercent: 44,
    connectedClients: ${allCustomers.filter(c => c.areaZone === 'Nanggulan').length},
    lastPing: new Date().toISOString(),
  },
  {
    id: 'core-router-01',
    name: 'Core MikroTik CCR2116 Gateway Global',
    type: 'CORE_ROUTER',
    ipAddress: '10.200.0.1',
    location: 'Data Center RADIAN JOGJA',
    status: 'ONLINE',
    latencyMs: 0.9,
    packetLoss: 0,
    cpuUsagePercent: 25,
    connectedClients: ${allCustomers.length},
    lastPing: new Date().toISOString(),
  }
];

export const REAL_TICKETS: Ticket[] = [
  {
    id: 'tkt-01',
    ticketNo: 'TCK/2026/10/0101',
    customerId: 'cust_nanggulan_20',
    customerName: 'BOWO SABLON',
    customerPhone: '081210001577',
    customerAddress: 'Wilayah Nanggulan, D.I. Yogyakarta',
    category: 'Kabel Putus / LOS Merah',
    priority: 'HIGH',
    subject: 'Pemeriksaan redaman dropcore kabel optik Nanggulan',
    description: 'Redaman tercatat -13 dBm, perlu optimasi splitter di ODP Nanggulan.',
    status: 'IN_PROGRESS',
    assignedTechnicianId: 'tech-01',
    assignedTechnicianName: 'Budi Santoso',
    opticalAttenuationDbm: -13.0,
    actionNotes: 'Teknisi di lapangan memeriksa patchcord dan redaman ONT Zim.',
    createdAt: '2026-10-28T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tkt-02',
    ticketNo: 'TCK/2026/10/0102',
    customerId: 'cust_minomartani_1',
    customerName: 'AAN',
    customerPhone: '081210000000',
    customerAddress: 'Wilayah Minomartani, D.I. Yogyakarta',
    category: 'Internet Lambat',
    priority: 'MEDIUM',
    subject: 'Cek bandwidth limit IP 3.3.3.37',
    description: 'Pelanggan meminta optimasi frekuensi WiFi 5GHz.',
    status: 'OPEN',
    assignedTechnicianId: 'tech-01',
    assignedTechnicianName: 'Budi Santoso',
    opticalAttenuationDbm: -19.4,
    createdAt: '2026-10-29T02:00:00.000Z',
    updatedAt: new Date().toISOString(),
  }
];
`;

fs.writeFileSync(path.join(__dirname, '../src/data/synchronizedData.ts'), tsContent, 'utf8');
console.log('Successfully wrote src/data/synchronizedData.ts!');
