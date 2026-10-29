import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Filter,
  LifeBuoy,
  Plus,
  Search,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { Customer, Ticket, TicketPriority, TicketStatus } from '../../types';
import { exportTicketsToExcel, formatIndoDate } from '../../utils/export';
import { useNotification } from '../../context/NotificationContext';
import { INITIAL_USERS } from '../../data/mockInitialData';

interface TicketManagementProps {
  tickets: Ticket[];
  customers: Customer[];
  onUpdateTicket: (updated: Ticket) => void;
  onAddTicket: (newTicket: Ticket) => void;
}

export const TicketManagement: React.FC<TicketManagementProps> = ({
  tickets,
  customers,
  onUpdateTicket,
  onAddTicket,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');

  // Assign modal / Edit modal
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [assignedTechId, setAssignedTechId] = useState('');
  const [newStatus, setNewStatus] = useState<TicketStatus>('IN_PROGRESS');

  const { pushNotification } = useNotification();
  const technicians = INITIAL_USERS.filter((u) => u.role === 'technician');

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.assignedTechnicianName && t.assignedTechnicianName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleOpenAssignModal = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAssignedTechId(ticket.assignedTechnicianId || technicians[0]?.uid || '');
    setActionNotes(ticket.actionNotes || '');
    setNewStatus(ticket.status);
  };

  const handleSaveTicketUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const tech = technicians.find((t) => t.uid === assignedTechId);
    const isNowResolved = newStatus === 'RESOLVED' || newStatus === 'CLOSED';

    const updated: Ticket = {
      ...selectedTicket,
      status: newStatus,
      assignedTechnicianId: assignedTechId,
      assignedTechnicianName: tech ? tech.name : selectedTicket.assignedTechnicianName,
      actionNotes,
      resolvedAt: isNowResolved ? new Date().toISOString() : selectedTicket.resolvedAt,
      updatedAt: new Date().toISOString(),
    };

    onUpdateTicket(updated);
    setSelectedTicket(null);

    // Push Notification
    pushNotification({
      title: `Tiket ${updated.ticketNo} Diperbarui`,
      message: `Status tiket [${updated.category}] diubah menjadi ${newStatus}. Ditugaskan kepada: ${updated.assignedTechnicianName}.`,
      type: 'TICKET',
      recipientRole: 'all',
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <h2 className="text-lg font-extrabold text-white">Tiket Keluhan &amp; Penugasan Teknisi</h2>
          <p className="text-xs text-slate-400">
            Alokasikan laporan gangguan lapangan, pantau progress investigasi teknisi, dan redaman pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => exportTicketsToExcel(filteredTickets)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Tiket (Excel)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nomor tiket, nama pelanggan, judul, atau teknisi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua Status</option>
            <option value="OPEN">Baru (OPEN)</option>
            <option value="IN_PROGRESS">Diproses (IN_PROGRESS)</option>
            <option value="RESOLVED">Selesai (RESOLVED)</option>
            <option value="CLOSED">Ditutup (CLOSED)</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">Semua Prioritas</option>
            <option value="CRITICAL">Kritis (CRITICAL)</option>
            <option value="HIGH">Tinggi (HIGH)</option>
            <option value="MEDIUM">Sedang (MEDIUM)</option>
            <option value="LOW">Rendah (LOW)</option>
          </select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-xs">
            Tidak ada tiket gangguan ditemukan.
          </div>
        ) : (
          filteredTickets.map((t) => {
            const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';
            const isCritical = t.priority === 'CRITICAL';

            return (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-cyan-400 text-xs">{t.ticketNo}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCritical
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : t.priority === 'HIGH'
                            ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {t.priority}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {t.category}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm text-white">{t.subject}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{t.description}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-2 text-[11px] text-slate-400">
                      <span>Pelanggan: <strong className="text-slate-200">{t.customerName}</strong> ({t.customerPhone})</span>
                      <span>&bull;</span>
                      <span>Alamat: {t.customerAddress}</span>
                      {t.opticalAttenuationDbm && (
                        <>
                          <span>&bull;</span>
                          <span className={t.opticalAttenuationDbm < -25 ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                            Redaman: {t.opticalAttenuationDbm} dBm
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right side status and assign button */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        isResolved
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : t.status === 'IN_PROGRESS'
                          ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}
                    >
                      {t.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(t)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1.5 transition"
                    >
                      <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{t.assignedTechnicianName ? t.assignedTechnicianName : 'Tugaskan Teknisi'}</span>
                    </button>
                  </div>
                </div>

                {/* Notes box if any */}
                {t.actionNotes && (
                  <div className="mt-3 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-white">Catatan Teknisi: </span>
                      <span>{t.actionNotes}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Assign / Update Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-5 text-slate-100 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">
                Kelola Tiket #{selectedTicket.ticketNo}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTicketUpdate} className="py-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Pilih Teknisi Bertugas</label>
                <select
                  value={assignedTechId}
                  onChange={(e) => setAssignedTechId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {technicians.map((tech) => (
                    <option key={tech.uid} value={tech.uid}>
                      {tech.name} (NOC Field Technician - {tech.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Status Penanganan</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="OPEN">OPEN (Baru)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Sedang Ditangani)</option>
                  <option value="RESOLVED">RESOLVED (Perbaikan Selesai)</option>
                  <option value="CLOSED">CLOSED (Ditutup)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Catatan Tindakan Teknis Lapangan</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Misal: Selesai sambung kabel fiber dropcore putus, redaman normal kembali ke -19.4 dBm..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-md shadow-cyan-600/20"
                >
                  Perbarui Tiket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
