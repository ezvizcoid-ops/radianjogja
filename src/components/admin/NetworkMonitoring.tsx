import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Globe,
  Radio,
  RefreshCw,
  RotateCcw,
  Search,
  Server,
  Wifi,
  Zap,
} from 'lucide-react';
import { DeviceNode } from '../../types';
import { useNotification } from '../../context/NotificationContext';

interface NetworkMonitoringProps {
  devices: DeviceNode[];
  onUpdateDevice: (updated: DeviceNode) => void;
}

export const NetworkMonitoring: React.FC<NetworkMonitoringProps> = ({ devices, onUpdateDevice }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [rebootingId, setRebootingId] = useState<string | null>(null);

  const { pushNotification } = useNotification();

  const filteredDevices = devices.filter(
    (d) =>
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.ipAddress.includes(searchTerm) ||
      d.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePingTest = async (device: DeviceNode) => {
    setPingingId(device.id);
    await new Promise((r) => setTimeout(r, 900));

    const simulatedLatency = Number((1.2 + Math.random() * 2.5).toFixed(1));
    const updated: DeviceNode = {
      ...device,
      latencyMs: simulatedLatency,
      packetLoss: 0,
      lastPing: new Date().toISOString(),
    };

    onUpdateDevice(updated);
    setPingingId(null);

    pushNotification({
      title: 'Diagnostik Ping Sukses',
      message: `Node ${device.name} (${device.ipAddress}): Respon ${simulatedLatency}ms &bull; 0% Packet Loss.`,
      type: 'NETWORK_ALERT',
      recipientRole: 'admin',
    });
  };

  const handleRemoteReboot = async (device: DeviceNode) => {
    setRebootingId(device.id);
    await new Promise((r) => setTimeout(r, 1400));

    const updated: DeviceNode = {
      ...device,
      status: 'ONLINE',
      cpuUsagePercent: Math.floor(15 + Math.random() * 10),
      lastPing: new Date().toISOString(),
    };

    onUpdateDevice(updated);
    setRebootingId(null);

    pushNotification({
      title: 'Sinyal Reboot Node Dikirim',
      message: `Perangkat ${device.name} berhasil dimuat ulang dan stabil.`,
      type: 'NETWORK_ALERT',
      recipientRole: 'admin',
    });
  };

  return (
    <div className="space-y-5">
      {/* Network Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-white">Monitoring Infrastruktur Fiber &amp; OLT</h2>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              Semua Backbone Online
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Pemantauan langsung OLT Huawei/ZTE/Fiberhome, Core MikroTik Router, redaman optik dBm, dan latency ICMP.
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama node, IP, atau POP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Network Core Health Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total Bandwidth Terpakai</span>
          <span className="text-lg font-extrabold text-cyan-400">3.99 Gbps</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Kapasitas 10 Gbps (39.9%)</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Rata-rata Ping Latensi</span>
          <span className="text-lg font-extrabold text-emerald-400">2.1 ms</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ke Server Jogja IX / OpenIXP</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Rata-rata Redaman OLT</span>
          <span className="text-lg font-extrabold text-blue-400">-20.4 dBm</span>
          <span className="text-[10px] text-slate-500 block mt-0.5">Ideal Range (-18 ~ -24 dBm)</span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] text-slate-400 block">Total Klien Terhubung</span>
          <span className="text-lg font-extrabold text-white">2,209 Klien</span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">Sesi PPPoE Aktif</span>
        </div>
      </div>

      {/* Nodes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map((dev) => {
          const isWarning = dev.status === 'WARNING';
          const isOffline = dev.status === 'OFFLINE';
          const isPinging = pingingId === dev.id;
          const isRebooting = rebootingId === dev.id;

          return (
            <div
              key={dev.id}
              className={`p-4 rounded-2xl bg-slate-900 border transition ${
                isWarning
                  ? 'border-amber-500/50 bg-amber-950/10'
                  : isOffline
                  ? 'border-rose-500/50 bg-rose-950/10'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isWarning
                        ? 'bg-amber-500/20 text-amber-400'
                        : isOffline
                        ? 'bg-rose-500/20 text-rose-400'
                        : 'bg-cyan-500/10 text-cyan-400'
                    }`}
                  >
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-white leading-tight">{dev.name}</h4>
                    <span className="text-[10px] text-slate-400 font-mono">{dev.ipAddress}</span>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    dev.status === 'ONLINE'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : dev.status === 'WARNING'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {dev.status}
                </span>
              </div>

              {/* Node Location & Type */}
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800/80">
                <span>Lokasi: {dev.location}</span>
                <span className="font-mono text-cyan-400 font-semibold">{dev.type}</span>
              </div>

              {/* Telemetry Metrics */}
              <div className="grid grid-cols-3 gap-2 my-3 text-center">
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Ping Latency</span>
                  <span className="font-mono font-bold text-xs text-white">{dev.latencyMs} ms</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">Packet Loss</span>
                  <span
                    className={`font-mono font-bold text-xs ${
                      dev.packetLoss > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {dev.packetLoss}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 block">CPU Load</span>
                  <span className="font-mono font-bold text-xs text-slate-200">{dev.cpuUsagePercent}%</span>
                </div>
              </div>

              {dev.opticalRxDbm && (
                <div className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800 mb-3">
                  <span className="text-slate-400 text-[11px]">Sinyal Optik (Rx):</span>
                  <span
                    className={`font-mono font-bold ${
                      dev.opticalRxDbm < -25 ? 'text-amber-400' : 'text-emerald-400'
                    }`}
                  >
                    {dev.opticalRxDbm} dBm
                  </span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isPinging}
                  onClick={() => handlePingTest(dev)}
                  className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                >
                  <Activity className={`w-3.5 h-3.5 text-cyan-400 ${isPinging ? 'animate-spin' : ''}`} />
                  <span>{isPinging ? 'Pinging...' : 'Cek Ping'}</span>
                </button>

                <button
                  type="button"
                  disabled={isRebooting}
                  onClick={() => handleRemoteReboot(dev)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                  title="Remote Soft Reboot"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isRebooting ? 'animate-spin text-cyan-400' : ''}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
