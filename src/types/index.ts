export type UserRole = 'admin' | 'technician' | 'customer';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  customerCode?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type CustomerStatus = 'ACTIVE' | 'ISOLATED' | 'SUSPENDED' | 'PENDING_INSTALL';

export type RegionZone = 'Minomartani' | 'Sedayu' | 'Nanggulan';

export interface PortalAccess {
  isRegistered: boolean;
  username: string;
  password?: string;
  registeredAt?: string;
}

export interface Customer {
  id: string;
  customerCode: string;
  name: string;
  email: string;
  phone: string;
  packageId: string;
  packageName: string;
  bandwidthSpeed: string; // e.g. "30 Mbps"
  monthlyFee: number;
  pppoeUser: string;
  assignedIp: string;
  ontMac: string;
  odpBox: string; // e.g. "ODP-MIN-01/08"
  areaZone: RegionZone | string; // Minomartani | Sedayu | Nanggulan
  address: string;
  status: CustomerStatus;
  encryptedNik: string; // End-to-end encrypted or masked
  rawNik?: string; // Only visible upon explicit admin decryption
  signalDbm: number; // e.g. -19.4 dBm
  dueDateDay: number; // e.g. 10 of each month
  installedAt: string;
  updatedAt: string;
  portalAccess?: PortalAccess;
  rawPaymentNote?: string;
}

export type BillStatus = 'UNPAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Bill {
  id: string;
  invoiceNo: string;
  customerId: string;
  customerCode: string;
  customerName: string;
  customerEmail: string;
  packageName: string;
  periodMonth: number;
  periodYear: number;
  amount: number;
  taxAmount: number;
  uniqueCode: number;
  totalAmount: number;
  status: BillStatus;
  dueDate: string;
  paidAt?: string | null;
  paymentMethod?: string | null;
  paymentReference?: string | null;
  emailReportSent: boolean;
  emailReportTimestamp?: string | null;
  createdAt: string;
  rawPaymentNote?: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface Ticket {
  id: string;
  ticketNo: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  category: 'Kabel Putus / LOS Merah' | 'Internet Lambat' | 'Router Tidak Memancarkan Sinyal' | 'Ganti Password WiFi' | 'Pindah Posisi ONT' | 'Lainnya';
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  assignedTechnicianId?: string;
  assignedTechnicianName?: string;
  opticalAttenuationDbm?: number;
  actionNotes?: string;
  resolutionProofUrl?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type DeviceType = 'OLT' | 'CORE_ROUTER' | 'DISTRIBUTION_SWITCH' | 'ODP_SPLITTER' | 'CLIENT_ONT';
export type DeviceStatus = 'ONLINE' | 'WARNING' | 'OFFLINE';

export interface DeviceNode {
  id: string;
  name: string;
  type: DeviceType;
  ipAddress: string;
  location: string;
  status: DeviceStatus;
  latencyMs: number;
  packetLoss: number;
  opticalRxDbm?: number;
  cpuUsagePercent: number;
  connectedClients: number;
  lastPing: string;
}

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: 'Modem ONT' | 'Router WiFi' | 'Kabel Fiber' | 'ODP Splitter' | 'Tools & Splicer' | 'Aksesoris Konektor';
  quantity: number;
  unit: string;
  minThreshold: number;
  unitCost: number;
  location: string;
  supplierApiCode: string;
  lastSyncedAt: string;
}

export interface AppNotification {
  id: string;
  recipientRole: 'all' | 'admin' | 'technician' | 'customer';
  recipientId?: string;
  title: string;
  message: string;
  type: 'PAYMENT' | 'TICKET' | 'NETWORK_ALERT' | 'SYSTEM';
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface InternetPackage {
  id: string;
  name: string;
  speed: string;
  price: number;
  description: string;
  features: string[];
  popular?: boolean;
}

export interface EmailDispatchLog {
  id: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  invoiceNo: string;
  amount: number;
  sentAt: string;
  status: 'SENT' | 'DELIVERED';
  htmlContent: string;
}
