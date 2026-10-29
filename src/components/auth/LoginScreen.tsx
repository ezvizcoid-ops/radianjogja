import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  LogIn,
  ShieldCheck,
  User,
  UserCheck,
  Wifi,
  Wrench,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useAuth } from '../../context/AuthContext';
import { REAL_CUSTOMERS } from '../../data/synchronizedData';
import { UserRole } from '../../types';

export const LoginScreen: React.FC = () => {
  const { loginAsCustomerAccount, loginAsDemoUser, loginWithGoogle } = useAuth();

  const [activeTab, setActiveTab] = useState<'customer' | 'admin' | 'technician'>('customer');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleCustomerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const res = loginAsCustomerAccount(loginId, password);
    if (!res.success) {
      setErrorMessage(res.message);
    } else {
      setSuccessMessage(res.message);
    }
  };

  const handleQuickCustomerSelect = (code: string, name: string) => {
    setLoginId(code);
    setPassword('Radian@' + code.slice(-4));
    const res = loginAsCustomerAccount(code);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-cyan-500 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <Logo size="lg" />
          <h2 className="text-xl font-extrabold text-white mt-4">Sistem Manajemen &amp; Billing ISP</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Layanan Internet WiFi Rumahan Wilayah Minomartani, Sedayu &amp; Nanggulan Yogyakarta.
          </p>
        </div>

        {/* 3 Role Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950 rounded-2xl border border-slate-800 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('customer');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'customer'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Pelanggan</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin NOC</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('technician');
              setErrorMessage('');
            }}
            className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'technician'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Teknisi</span>
          </button>
        </div>

        {/* Tab 1: Customer Portal Login */}
        {activeTab === 'customer' && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-300">
              <span className="font-semibold block mb-0.5">Ketentuan Akses Portal:</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Akun portal didaftarkan secara resmi oleh Admin RADIAN JOGJA. Masukkan ID Pelanggan, Kode, atau Nama Klien yang telah terdaftar.
              </p>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-800 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleCustomerLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  ID Pelanggan / Kode / Nama Klien *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 104080 / MAMI / 102626 / AAN"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Kata Sandi Portal (Opsional)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    placeholder="Kata sandi yang didaftarkan Admin"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/25 transition flex items-center justify-center gap-2"
              >
                <span>Masuk ke Portal Pelanggan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Demo Pick from Real Uploaded Customers */}
            <div className="pt-3 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Pilih Cepat Akun Pelanggan Riil (Pengujian Instan):
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                {REAL_CUSTOMERS.slice(0, 6).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickCustomerSelect(c.customerCode, c.name)}
                    className="p-2 rounded-lg bg-slate-950/80 hover:bg-slate-800 border border-slate-800/80 text-left transition"
                  >
                    <span className="font-bold text-[11px] text-white block truncate">{c.name}</span>
                    <span className="text-[10px] text-cyan-400 font-mono block">{c.customerCode}</span>
                    <span className="text-[9px] text-slate-400 block">{c.areaZone}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Admin Login */}
        {activeTab === 'admin' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/30 text-xs text-rose-300">
              <span className="font-bold block mb-1">Akses Penuh Administrator NOC</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Kelola 111 pelanggan di 3 wilayah (Minomartani, Sedayu, Nanggulan), monitoring OLT, pendaftaran akun portal, dan billing.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Admin Email:</span>
                <span className="font-mono text-cyan-400 font-semibold">ezviz.co.id@gmail.com</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hak Akses:</span>
                <span className="text-rose-400 font-bold">FULL ACCESS (NOC)</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser('admin')}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-sm shadow-lg shadow-rose-600/25 transition flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Sebagai Admin NOC RADIAN</span>
              </button>

              <button
                type="button"
                onClick={loginWithGoogle}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-2"
              >
                <span>Masuk dengan Akun Google</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Technician Login */}
        {activeTab === 'technician' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/30 text-xs text-amber-300">
              <span className="font-bold block mb-1">Akses Tugas Lapangan Teknisi</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Teknisi hanya dapat melihat daftar tiket perbaikan yang ditugaskan, update tindakan teknis, dan mengukur redaman optik dBm pelanggan.
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => loginAsDemoUser('technician')}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">Budi Santoso</div>
                  <div className="text-[11px] text-slate-400">Teknisi Lapangan Area Sleman &amp; Kota</div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                  Login Budi
                </div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoUser('technician')}
                className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-left transition flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-white text-xs">Rizki Pratama</div>
                  <div className="text-[11px] text-slate-400">Teknisi Lapangan Area Bantul &amp; Kulon Progo</div>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 text-xs font-bold border border-amber-500/20">
                  Login Rizki
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
