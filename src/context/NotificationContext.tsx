import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppNotification, UserRole } from '../types';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  soundEnabled: boolean;
  toggleSound: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  pushNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  activeToast: AppNotification | null;
  dismissToast: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    recipientRole: 'admin',
    title: 'Pembayaran Diterima',
    message: 'Pelanggan Bambang Kusuma (RJ-2024-105) telah membayar tagihan Rp 433.412 via GoPay. Laporan email otomatis terkirim.',
    type: 'PAYMENT',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'notif-2',
    recipientRole: 'technician',
    title: 'Tiket Baru Ditugaskan',
    message: 'Tiket #TCK/2026/10/0042 (Kabel Putus / LOS Merah di Condongcatur) memerlukan inspeksi lapangan segera.',
    type: 'TICKET',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'notif-3',
    recipientRole: 'customer',
    recipientId: 'cust-01',
    title: 'Tagihan Baru Terbit',
    message: 'Tagihan internet periode Oktober 2026 telah terbit sebesar Rp 277.647. Jatuh tempo 10 November 2026.',
    type: 'PAYMENT',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'notif-4',
    recipientRole: 'all',
    title: 'Pemeliharaan Jaringan Selesai',
    message: 'Optimalisasi routing core fiber optik backbone Jogja-Semarang telah selesai dengan latensi 1.2ms.',
    type: 'NETWORK_ALERT',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode; currentRole: UserRole }> = ({
  children,
  currentRole,
}) => {
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('radian_notifications');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeToast, setActiveToast] = useState<AppNotification | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('radian_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Storage warning:', e);
    }
  }, [notifications]);

  // Filter notifications for current role
  const roleNotifications = notifications.filter(
    (n) => n.recipientRole === 'all' || n.recipientRole === currentRole
  );

  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // Audio not allowed or audioCtx blocked
    }
  };

  const pushNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif_' + Math.random().toString(36).substring(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [newNotif, ...prev]);
    setActiveToast(newNotif);
    playChime();

    // Auto dismiss toast after 6 seconds
    setTimeout(() => {
      setActiveToast((current) => (current?.id === newNotif.id ? null : current));
    }, 6000);
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.recipientRole === 'all' || n.recipientRole === currentRole
          ? { ...n, read: true }
          : n
      )
    );
  };

  const toggleSound = () => setSoundEnabled((prev) => !prev);
  const dismissToast = () => setActiveToast(null);

  return (
    <NotificationContext.Provider
      value={{
        notifications: roleNotifications,
        unreadCount,
        soundEnabled,
        toggleSound,
        markAsRead,
        markAllAsRead,
        pushNotification,
        activeToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
