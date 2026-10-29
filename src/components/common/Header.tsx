import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronDown,
  Globe,
  LogOut,
  Mail,
  Shield,
  UserCheck,
  Volume2,
  VolumeX,
  Wifi,
  Wrench,
  User,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { UserRole } from '../../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const { currentUser, currentCustomer, currentRole, setRole, loginWithGoogle, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, soundEnabled, toggleSound } =
    useNotification();

  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const roleLabels: Record<UserRole, { label: string; badge: string; color: string; icon: any }> = {
    admin: {
      label: 'Admin NOC (Full Akses)',
      badge: 'ADMIN',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
      icon: Shield,
    },
    technician: {
      label: 'Teknisi Lapangan (Budi)',
      badge: 'TEKNISI',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      icon: Wrench,
    },
    customer: {
      label: `Pelanggan (${currentCustomer?.name || 'MAMI'} #${currentCustomer?.customerCode || '104080'})`,
      badge: 'PELANGGAN',
      color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      icon: UserCheck,
    },
  };

  const CurrentRoleIcon = roleLabels[currentRole].icon;

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Left: Logo & Network Indicator */}
        <div className="flex items-center gap-4">
          <Logo size="md" />

          {/* Real-time Network Telemetry Pulse (Admin & Tech only) */}
          {currentRole !== 'customer' && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium text-emerald-400">OLT 3 Wilayah Online</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-slate-400 font-mono">Minomartani &bull; Sedayu &bull; Nanggulan</span>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowRoleMenu((v) => !v)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 text-xs text-white transition shadow-sm"
              title="Ganti Peran Akses"
            >
              <CurrentRoleIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-semibold hidden sm:inline">{roleLabels[currentRole].label}</span>
              <span className="font-semibold inline sm:hidden">{roleLabels[currentRole].badge}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role dropdown */}
            {showRoleMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowRoleMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1.5 z-40 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Pilih Peran Akun
                  </div>
                  {(['admin', 'technician', 'customer'] as UserRole[]).map((role) => {
                    const RoleIcon = roleLabels[role].icon;
                    const isActive = currentRole === role;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => {
                          setRole(role);
                          setShowRoleMenu(false);
                          if (role === 'admin') setActiveTab('dashboard');
                          if (role === 'technician') setActiveTab('tech-tasks');
                          if (role === 'customer') setActiveTab('cust-billing');
                        }}
                        className={`w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/80 transition ${
                          isActive ? 'bg-cyan-950/40 text-cyan-300 font-bold' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <RoleIcon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                          <div>
                            <div className="font-medium text-white">{roleLabels[role].label}</div>
                            <div className="text-[10px] text-slate-400">
                              {role === 'admin'
                                ? 'Full Akses Sistem'
                                : role === 'technician'
                                ? 'Tugas Lapangan & Tiket'
                                : 'Tagihan & Keluhan'}
                            </div>
                          </div>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-cyan-400" />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Real-Time Push Notification Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifMenu((v) => !v)}
              className="relative p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition"
              title="Notifikasi Real-time"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-extrabold text-slate-950 ring-2 ring-slate-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowNotifMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-40 overflow-hidden text-xs">
                  <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-white">Notifikasi Push</h4>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold text-[10px]">
                          {unreadCount} Baru
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleSound}
                        className="p-1 text-slate-400 hover:text-white transition"
                        title={soundEnabled ? 'Matikan Suara Bell' : 'Nyalakan Suara Bell'}
                      >
                        {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                      </button>
                      <button
                        type="button"
                        onClick={markAllAsRead}
                        className="text-[11px] text-cyan-400 hover:underline font-medium"
                      >
                        Tandai Dibaca
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        Belum ada notifikasi push.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markAsRead(n.id)}
                          className={`p-3 transition cursor-pointer hover:bg-slate-800/50 ${
                            !n.read ? 'bg-cyan-950/20' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-white">{n.title}</span>
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {new Date(n.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px] mt-1 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* User Profile Dropdown with ACTIVE LOGOUT */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu((v) => !v)}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-xs text-white transition"
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white font-bold flex items-center justify-center text-[11px]">
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
              <span className="font-medium hidden md:inline truncate max-w-[110px]">
                {currentUser?.name || 'User'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
            </button>

            {showProfileMenu && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowProfileMenu(false)} />
                <div className="absolute right-0 mt-2 w-60 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-2 z-40 text-xs">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="font-bold text-white truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
                    <span className="mt-1 inline-block text-[10px] font-bold text-cyan-400 uppercase">
                      Peran: {currentRole}
                    </span>
                  </div>

                  {/* ACTIVE WORKING LOGOUT BUTTON */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-3 py-2.5 text-left hover:bg-rose-950/40 flex items-center gap-2 text-rose-400 font-bold transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Keluar (Logout)</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* DIRECT LOGOUT BUTTON (Explicitly requested by user) */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/20 text-xs font-semibold transition"
            title="Keluar dari akun saat ini"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
