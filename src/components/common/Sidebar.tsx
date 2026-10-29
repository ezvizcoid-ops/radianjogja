import React from 'react';
import {
  Activity,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
  FileText,
  History,
  LayoutDashboard,
  LifeBuoy,
  Network,
  Package,
  Receipt,
  Server,
  ShieldCheck,
  Users,
  Wifi,
  Wrench,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  ticketBadgeCount?: number;
  unpaidBillsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  ticketBadgeCount = 0,
  unpaidBillsCount = 0,
}) => {
  const { currentRole, logout } = useAuth();

  // Navigation Items per Role
  const getNavItems = () => {
    if (currentRole === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard Ringkas', icon: LayoutDashboard },
        { id: 'customers', label: 'Data Pelanggan', icon: Users, badge: 'E2EE' },
        {
          id: 'billing',
          label: 'Penagihan & Invoice',
          icon: Receipt,
          badge: unpaidBillsCount > 0 ? `${unpaidBillsCount} Belum` : undefined,
          badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
        },
        { id: 'network', label: 'Monitoring Koneksi', icon: Activity },
        {
          id: 'tickets',
          label: 'Tiket Keluhan',
          icon: LifeBuoy,
          badge: ticketBadgeCount > 0 ? `${ticketBadgeCount} Aktif` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        { id: 'inventory', label: 'Inventaris & API Pihak Ke-3', icon: Package },
      ];
    }

    if (currentRole === 'technician') {
      return [
        {
          id: 'tech-tasks',
          label: 'Tugas Tiket Lapangan',
          icon: Wrench,
          badge: ticketBadgeCount > 0 ? `${ticketBadgeCount} Tugas` : undefined,
          badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
        },
        { id: 'tech-optical', label: 'Cek Redaman Optik (dBm)', icon: Network },
        { id: 'network', label: 'Status OLT & POP', icon: Server },
      ];
    }

    // Customer navigation
    return [
      {
        id: 'cust-billing',
        label: 'Tagihan & Bayar (Gateway)',
        icon: CreditCard,
        badge: unpaidBillsCount > 0 ? 'Perlu Bayar' : 'Lunas',
        badgeColor: unpaidBillsCount > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400',
      },
      { id: 'cust-history', label: 'Riwayat Pembayaran & PDF', icon: History },
      { id: 'cust-complaint', label: 'Lapor Keluhan Teknis', icon: LifeBuoy },
      { id: 'cust-selfcheck', label: 'Tes Sinyal & WiFi Rumah', icon: Wifi },
    ];
  };

  const navItems = getNavItems();

  return (
    <>
      {/* Desktop Left Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900/60 border-r border-slate-800/80 p-4 shrink-0 min-h-[calc(100vh-61px)]">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {currentRole === 'admin'
            ? 'Menu Administrasi'
            : currentRole === 'technician'
            ? 'Menu Teknisi Lapangan'
            : 'Portal Mandiri Pelanggan'}
        </div>

        <nav className="space-y-1.5 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Support Widget */}
        {/* Bottom Support Widget & Logout */}
        <div className="mt-auto pt-4 border-t border-slate-800/80 space-y-2">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>NOC RADIAN JOGJA</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              3 Wilayah: Minomartani &bull; Sedayu &bull; Nanggulan
            </p>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Keluar (Logout)</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sticky Bottom Bar for Smartphones (Optimal on Mobile Cellular) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 px-2 py-1.5 flex items-center justify-around shadow-2xl">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-xl text-[10px] transition relative ${
                isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-2 w-2 rounded-full bg-cyan-500" />
                )}
              </div>
              <span className="mt-1 truncate max-w-[68px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
