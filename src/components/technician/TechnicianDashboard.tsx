import React, { useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Wrench,
  Zap,
} from 'lucide-react';
import { Customer, Ticket } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';

interface TechnicianDashboardProps {
  tickets: Ticket[];
  customers: Customer[];
  onUpdateTicket: (updated: Ticket) => void;
}

export const TechnicianDashboard: React.FC<TechnicianDashboardProps> = ({
  tickets,
  customers,
  onUpdateTicket,
}) => {
  const { currentUser } = useAuth();
  const { pushNotification } = useNotification();

  // Selected ticket for active field investigation
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [fieldNote, setFieldNote] = useState('');
  const [measuredDbm, setMeasuredDbm] = useState<number>(-19.4);
  const [isMeasuring, setIsMeasuring] = useState(false);

  // Tickets assigned to this technician or open for assignment
  const myTickets = tickets.filter(
    (t) =>
      t.assignedTechnicianId === currentUser?.uid ||
      t.assignedTechnicianName?.toLowerCase().includes('budi') ||
      t.status === 'OPEN'
  );

  const activeTasks = myTickets.filter((t) => t.status !== 'RESOLVED' && t.status !== 'CLOSED');
  const resolvedTasks = myTickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED');

  // Measure optical attenuation on field
  const handleMeasureSignal = async () => {
    setIsMeasuring(true);
    await new Promise((r) => setTimeout(r, 800));
    const randomSignal = Number((-18.5 - Math.random() * 3.5).toFixed(1));
    setMeasuredDbm(randomSignal);
    setIsMeasuring(false);
  };

  const handleUpdateProgress = (ticket: Ticket, newStatus: 'IN_PROGRESS' | 'RESOLVED') => {
    const isNowDone = newStatus === 'RESOLVED';
    const updated: Ticket = {
      ...ticket,
      status: newStatus,
      assignedTechnicianId: currentUser?.uid || 'tech-01',
      assignedTechnicianName: currentUser?.name || 'Budi Santoso',
      actionNotes: fieldNote || ticket.actionNotes || 'Tindakan perbaikan dilakukan oleh teknisi lapangan.',
      opticalAttenuationDbm: measuredDbm,
      resolvedAt: isNowDone ? new Date().toISOString() : ticket.resolvedAt,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTicket(updated);
    setFieldNote('');

    pushNotification({
      title: isNowDone ? 'Tiket Lapangan Selesai' : 'Teknisi Sedang Menangani',
      message: `Tiket ${ticket.ticketNo} (${ticket.customerName}) telah ${
        isNowDone ? 'SELESAI DIPERBAIKI' : 'mulai dikerjakan di lapangan'
      } oleh ${currentUser?.name}. Redaman optik: ${measuredDbm} dBm.`,
      type: 'TICKET',
      recipientRole: 'all',
    });
  };

  return (
    <div className="space-y-5">
      {/* Technician Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950/30 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center ring-1 ring-amber-500/30">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white">
              Portal Tugas Teknisi &bull; {currentUser?.name || 'Budi Santoso'}
            </h1>
            <p className="text-xs text-slate-400">
              ID Teknisi: <span className="font-mono text-cyan-400">NOC-TECH-01</span> &bull; Area Tugas: Sleman &amp; Kota Yogyakarta
            </p>
          </div>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Tugas Aktif</span>
            <span className="text-base font-extrabold text-amber-400">{activeTasks.length}</span>
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-center">
            <span className="text-[10px] text-slate-400 block">Tiket Selesai</span>
            <span className="text-base font-extrabold text-emerald-400">{resolvedTasks.length}</span>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 block">
          Daftar Tugas Perbaikan Lapangan ({activeTasks.length} Tugas Menunggu)
        </h3>

        {activeTasks.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="font-semibold text-slate-300">Semua tugas tiket telah terselesaikan!</p>
            <p className="text-[11px] text-slate-400 mt-1">Standby untuk laporan panggilan gangguan berikutnya.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeTasks.map((ticket) => {
              const cust = customers.find((c) => c.id === ticket.customerId);
              const isSelected = activeTicketId === ticket.id;

              return (
                <div
                  key={ticket.id}
                  className={`p-5 rounded-2xl bg-slate-900 border transition ${
                    ticket.priority === 'CRITICAL'
                      ? 'border-rose-500/40 bg-rose-950/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-cyan-400 text-xs">
                          {ticket.ticketNo}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ticket.priority === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}
                        >
                          {ticket.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                          {ticket.category}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-white">{ticket.subject}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{ticket.description}</p>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border self-start ${
                        ticket.status === 'IN_PROGRESS'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>

                  {/* Customer Field Details Box */}
                  <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Alamat Pemasangan</span>
                        <span className="font-semibold text-white">{ticket.customerAddress}</span>
                        {cust && <span className="text-[10px] text-indigo-400 block mt-0.5">ODP: {cust.odpBox}</span>}
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Kontak Pelanggan</span>
                        <span className="font-semibold text-white">{ticket.customerName}</span>
                        <a
                          href={`https://wa.me/62${ticket.customerPhone.replace(/\D/g, '').replace(/^0/, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-emerald-400 font-semibold block mt-0.5 hover:underline"
                        >
                          WhatsApp: {ticket.customerPhone}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Zap className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 block">Redaman Terakhir</span>
                        <span className="font-mono font-bold text-white">
                          {ticket.opticalAttenuationDbm ? `${ticket.opticalAttenuationDbm} dBm` : '-'}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {cust ? `IP: ${cust.assignedIp}` : 'ZTE/Huawei ONT'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Field Action Drawer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTicketId(isSelected ? null : ticket.id)}
                      className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition"
                    >
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{isSelected ? 'Tutup Form Tindakan' : 'Input Tindakan & Ukur Redaman'}</span>
                    </button>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {ticket.status !== 'IN_PROGRESS' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateProgress(ticket, 'IN_PROGRESS')}
                          className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm"
                        >
                          Mulai Tangani
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleUpdateProgress(ticket, 'RESOLVED')}
                        className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tandai Selesai</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Form if expanded */}
                  {isSelected && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                      <div>
                        <label className="text-xs font-medium text-slate-400 block mb-1">
                          Catatan Teknisi Lapangan
                        </label>
                        <textarea
                          rows={2}
                          value={fieldNote}
                          onChange={(e) => setFieldNote(e.target.value)}
                          placeholder="Misal: Sudah diganti fast connector biru & dropcore dibersihkan..."
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
                        <div>
                          <span className="text-[11px] text-slate-400 block">Ukur Redaman Optik Lapangan (OPM)</span>
                          <span className="font-mono text-sm font-bold text-emerald-400">
                            {measuredDbm} dBm (Normal)
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={isMeasuring}
                          onClick={handleMeasureSignal}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-300 font-semibold flex items-center gap-1.5 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isMeasuring ? 'animate-spin' : ''}`} />
                          <span>{isMeasuring ? 'Mengukur...' : 'Ukur Sekarang'}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
