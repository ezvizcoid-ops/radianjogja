import React, { useEffect, useState } from 'react';
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { Bell, CheckCircle2, ShieldAlert, Wifi, X } from 'lucide-react';
import { auth, db, handleFirestoreError, OperationType } from './firebase/config';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { Bill, Customer, DeviceNode, InventoryItem, Ticket, UserRole } from './types';
import {
  REAL_BILLS,
  REAL_CUSTOMERS,
  REAL_DEVICES,
  REAL_TICKETS,
} from './data/synchronizedData';
import { INITIAL_INVENTORY } from './data/mockInitialData';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { CustomerManagement } from './components/admin/CustomerManagement';
import { BillingManagement } from './components/admin/BillingManagement';
import { NetworkMonitoring } from './components/admin/NetworkMonitoring';
import { TicketManagement } from './components/admin/TicketManagement';
import { InventoryManagement } from './components/admin/InventoryManagement';
import { TechnicianDashboard } from './components/technician/TechnicianDashboard';
import { CustomerDashboard } from './components/customer/CustomerDashboard';
import { PaymentGatewayModal } from './components/billing/PaymentGatewayModal';
import { EmailReceiptModal } from './components/billing/EmailReceiptModal';
import { LoginScreen } from './components/auth/LoginScreen';

// Versioned Storage keys for synchronized real dataset (111 real customers across Minomartani, Sedayu, Nanggulan)
const STORAGE_KEYS = {
  CUSTOMERS: 'radian_customers_real_v2',
  BILLS: 'radian_bills_real_v2',
  TICKETS: 'radian_tickets_real_v2',
  DEVICES: 'radian_devices_real_v2',
  INVENTORY: 'radian_inventory_real_v2',
};

function MainApp() {
  const { currentRole, currentUser, currentCustomer, isLoggedIn } = useAuth();
  const { activeToast, dismissToast, pushNotification } = useNotification();

  // If user logged out, render the Login Screen immediately
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // Navigation tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Main Synchronized Entities State (Initialized from uploaded files)
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 100) return parsed;
      }
      return REAL_CUSTOMERS;
    } catch {
      return REAL_CUSTOMERS;
    }
  });

  const [bills, setBills] = useState<Bill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 500) return parsed;
      }
      return REAL_BILLS;
    } catch {
      return REAL_BILLS;
    }
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TICKETS);
      return saved ? JSON.parse(saved) : REAL_TICKETS;
    } catch {
      return REAL_TICKETS;
    }
  });

  const [devices, setDevices] = useState<DeviceNode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEVICES);
      return saved ? JSON.parse(saved) : REAL_DEVICES;
    } catch {
      return REAL_DEVICES;
    }
  });

  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVENTORY);
      return saved ? JSON.parse(saved) : INITIAL_INVENTORY;
    } catch {
      return INITIAL_INVENTORY;
    }
  });

  // Modals state
  const [activePaymentBill, setActivePaymentBill] = useState<Bill | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(bills));
  }, [bills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEVICES, JSON.stringify(devices));
  }, [devices]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
  }, [inventory]);

  // Adjust active tab when role changes
  useEffect(() => {
    if (currentRole === 'admin') {
      if (['tech-tasks', 'tech-optical', 'cust-billing', 'cust-history', 'cust-complaint', 'cust-selfcheck'].includes(activeTab)) {
        setActiveTab('dashboard');
      }
    } else if (currentRole === 'technician') {
      if (!['tech-tasks', 'tech-optical', 'network'].includes(activeTab)) {
        setActiveTab('tech-tasks');
      }
    } else if (currentRole === 'customer') {
      if (!['cust-billing', 'cust-history', 'cust-complaint', 'cust-selfcheck'].includes(activeTab)) {
        setActiveTab('cust-billing');
      }
    }
  }, [currentRole]);

  // Handlers for state updates
  const handleAddCustomer = (newCust: Customer) => {
    setCustomers((prev) => [newCust, ...prev]);
    pushNotification({
      title: 'Pelanggan Baru Terdaftar',
      message: `${newCust.name} (${newCust.customerCode}) telah ditambahkan di wilayah ${newCust.areaZone}.`,
      type: 'SYSTEM',
      recipientRole: 'admin',
    });
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCust.id ? updatedCust : c)));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  const handleImportBatchCustomers = (newCustomers: Customer[]) => {
    setCustomers((prev) => [...newCustomers, ...prev]);
    pushNotification({
      title: 'Import Dokumen Berhasil',
      message: `Sebanyak ${newCustomers.length} pelanggan baru berhasil diimpor.`,
      type: 'SYSTEM',
      recipientRole: 'admin',
    });
  };

  const handleAddBill = (newBill: Bill) => {
    setBills((prev) => [newBill, ...prev]);
  };

  const handleUpdateBill = (updatedBill: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === updatedBill.id ? updatedBill : b)));
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets((prev) => prev.map((t) => (t.id === updatedTicket.id ? updatedTicket : t)));
  };

  const handleAddTicket = (newTicket: Ticket) => {
    setTickets((prev) => [newTicket, ...prev]);
  };

  const handleUpdateDevice = (updatedDevice: DeviceNode) => {
    setDevices((prev) => prev.map((d) => (d.id === updatedDevice.id ? updatedDevice : d)));
  };

  const handleOpenPaymentGateway = (bill: Bill) => {
    setActivePaymentBill(bill);
    setIsPaymentModalOpen(true);
  };

  const handleViewEmailReceipt = (bill: Bill) => {
    setActiveReceiptBill(bill);
    setIsReceiptModalOpen(true);
  };

  const handlePaymentSuccess = (paidBill: Bill) => {
    handleUpdateBill(paidBill);
  };

  // Find customer object for active customer portal view
  const activeCustomerObject =
    (currentCustomer && customers.find((c) => c.id === currentCustomer.id || c.customerCode === currentCustomer.customerCode)) ||
    customers[0];

  const unpaidBillsCount = bills.filter((b) => b.status === 'UNPAID' || b.status === 'OVERDUE').length;
  const activeTicketsCount = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased">
      {/* Top Header with working Logout */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main App Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto pb-20 md:pb-8">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          ticketBadgeCount={activeTicketsCount}
          unpaidBillsCount={unpaidBillsCount}
        />

        {/* Dynamic Main View */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto min-w-0">
          {/* Admin Views */}
          {currentRole === 'admin' && (
            <>
              {activeTab === 'dashboard' && (
                <AdminDashboard
                  customers={customers}
                  bills={bills}
                  tickets={tickets}
                  devices={devices}
                  onNavigate={setActiveTab}
                  onOpenNewBillModal={() => setActiveTab('billing')}
                  onOpenNewCustomerModal={() => setActiveTab('customers')}
                  onViewEmailReceipt={handleViewEmailReceipt}
                />
              )}

              {activeTab === 'customers' && (
                <CustomerManagement
                  customers={customers}
                  onAddCustomer={handleAddCustomer}
                  onUpdateCustomer={handleUpdateCustomer}
                  onDeleteCustomer={handleDeleteCustomer}
                  onImportBatchCustomers={handleImportBatchCustomers}
                />
              )}

              {activeTab === 'billing' && (
                <BillingManagement
                  bills={bills}
                  customers={customers}
                  onOpenPaymentGateway={handleOpenPaymentGateway}
                  onViewEmailReceipt={handleViewEmailReceipt}
                  onAddBill={handleAddBill}
                  onUpdateBill={handleUpdateBill}
                />
              )}

              {activeTab === 'network' && (
                <NetworkMonitoring devices={devices} onUpdateDevice={handleUpdateDevice} />
              )}

              {activeTab === 'tickets' && (
                <TicketManagement
                  tickets={tickets}
                  customers={customers}
                  onUpdateTicket={handleUpdateTicket}
                  onAddTicket={handleAddTicket}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryManagement items={inventory} onUpdateItems={setInventory} />
              )}
            </>
          )}

          {/* Technician Views */}
          {currentRole === 'technician' && (
            <>
              {activeTab === 'tech-tasks' && (
                <TechnicianDashboard
                  tickets={tickets}
                  customers={customers}
                  onUpdateTicket={handleUpdateTicket}
                />
              )}

              {activeTab === 'tech-optical' && (
                <NetworkMonitoring devices={devices} onUpdateDevice={handleUpdateDevice} />
              )}

              {activeTab === 'network' && (
                <NetworkMonitoring devices={devices} onUpdateDevice={handleUpdateDevice} />
              )}
            </>
          )}

          {/* Customer Portal Views (Only for registered customer account) */}
          {currentRole === 'customer' && (
            <CustomerDashboard
              customer={activeCustomerObject}
              bills={bills}
              tickets={tickets}
              onOpenPaymentGateway={handleOpenPaymentGateway}
              onViewEmailReceipt={handleViewEmailReceipt}
              onCreateTicket={handleAddTicket}
            />
          )}
        </main>
      </div>

      {/* Payment Gateway Modal */}
      {activePaymentBill && (
        <PaymentGatewayModal
          bill={activePaymentBill}
          customer={customers.find((c) => c.id === activePaymentBill.customerId)}
          isOpen={isPaymentModalOpen}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setActivePaymentBill(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* Email Receipt Preview Modal */}
      {activeReceiptBill && (
        <EmailReceiptModal
          bill={activeReceiptBill}
          isOpen={isReceiptModalOpen}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setActiveReceiptBill(null);
          }}
        />
      )}

      {/* Floating Push Notification Toast Alert */}
      {activeToast && (
        <div className="fixed top-16 right-4 z-50 max-w-sm w-full bg-slate-900/95 border border-cyan-500/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="font-bold text-xs text-white truncate">{activeToast.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {activeToast.message}
              </p>
            </div>
            <button
              onClick={dismissToast}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppWithRole />
    </AuthProvider>
  );
}

function AppWithRole() {
  const { currentRole } = useAuth();
  return (
    <NotificationProvider currentRole={currentRole}>
      <MainApp />
    </NotificationProvider>
  );
}
