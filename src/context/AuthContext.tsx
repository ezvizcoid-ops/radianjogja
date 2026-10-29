import React, { createContext, useContext, useEffect, useState } from 'react';
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { Customer, UserProfile, UserRole } from '../types';
import { REAL_CUSTOMERS } from '../data/synchronizedData';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentCustomer: Customer | null;
  firebaseUser: User | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  isLoading: boolean;
  setRole: (role: UserRole) => void;
  loginWithGoogle: () => Promise<void>;
  loginAsDemoUser: (role: UserRole) => void;
  loginAsCustomerAccount: (loginId: string, password?: string) => { success: boolean; message: string };
  logout: () => Promise<void>;
  switchActiveCustomer: (customer: Customer) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_PROFILE: UserProfile = {
  uid: 'admin-noc-01',
  email: 'ezviz.co.id@gmail.com',
  name: 'Admin NOC RADIAN JOGJA',
  role: 'admin',
  phone: '08122334455',
  address: 'Jl. Kaliurang KM 8.5, Sleman, D.I. Yogyakarta',
};

const TECHNICIAN_PROFILE: UserProfile = {
  uid: 'tech-01',
  email: 'budi.teknisi@radianjogja.net',
  name: 'Budi Santoso (Teknisi Lapangan)',
  role: 'technician',
  phone: '081399887766',
  address: 'Condongcatur, Sleman, D.I. Yogyakarta',
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('radian_is_logged_in');
      return stored !== null ? stored === 'true' : true; // default logged in
    } catch {
      return true;
    }
  });

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const stored = localStorage.getItem('radian_current_role');
      return (stored as UserRole) || 'admin';
    } catch {
      return 'admin';
    }
  });

  // Current active customer for Customer Portal
  const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(() => {
    try {
      const storedId = localStorage.getItem('radian_active_customer_id');
      const found = REAL_CUSTOMERS.find((c) => c.id === storedId || c.customerCode === storedId);
      return found || REAL_CUSTOMERS[0];
    } catch {
      return REAL_CUSTOMERS[0];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    if (!isLoggedIn) return null;
    if (currentRole === 'admin') return ADMIN_PROFILE;
    if (currentRole === 'technician') return TECHNICIAN_PROFILE;
    return {
      uid: currentCustomer?.id || 'cust-1',
      email: currentCustomer?.email || 'pelanggan@radianjogja.net',
      name: currentCustomer?.name || 'Pelanggan Radian',
      role: 'customer',
      customerCode: currentCustomer?.customerCode,
      phone: currentCustomer?.phone,
      address: currentCustomer?.address,
    };
  });

  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('radian_is_logged_in', String(isLoggedIn));
    localStorage.setItem('radian_current_role', currentRole);
    if (currentCustomer) {
      localStorage.setItem('radian_active_customer_id', currentCustomer.id);
    }
  }, [isLoggedIn, currentRole, currentCustomer]);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        setIsLoggedIn(true);
        const isAdmin = user.email === 'ezviz.co.id@gmail.com';
        const role = isAdmin ? 'admin' : 'customer';
        setCurrentRole(role);
        setCurrentUser({
          uid: user.uid,
          email: user.email || '',
          name: user.displayName || user.email?.split('@')[0] || 'User Radian',
          role: role,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const setRole = (role: UserRole) => {
    setCurrentRole(role);
    setIsLoggedIn(true);
    if (role === 'admin') {
      setCurrentUser(ADMIN_PROFILE);
    } else if (role === 'technician') {
      setCurrentUser(TECHNICIAN_PROFILE);
    } else if (role === 'customer') {
      const targetCust = currentCustomer || REAL_CUSTOMERS[0];
      setCurrentCustomer(targetCust);
      setCurrentUser({
        uid: targetCust.id,
        email: targetCust.email,
        name: targetCust.name,
        role: 'customer',
        customerCode: targetCust.customerCode,
        phone: targetCust.phone,
        address: targetCust.address,
      });
    }
  };

  const loginAsDemoUser = (role: UserRole) => {
    setRole(role);
  };

  /**
   * Login as a Customer using Customer Code, Username, or Name.
   * Enforces: "AKUN PORTAL PELANGGAN DI DAFTARKAN OLEH ADMIN"
   */
  const loginAsCustomerAccount = (
    loginId: string,
    password?: string
  ): { success: boolean; message: string } => {
    if (!loginId || !loginId.trim()) {
      return { success: false, message: 'Masukkan ID Pelanggan / Kode / Nama terdaftar.' };
    }

    const cleanInput = loginId.trim().toLowerCase();

    // Find customer in synchronized list
    const found = REAL_CUSTOMERS.find((c) => {
      const codeMatch = c.customerCode.toLowerCase() === cleanInput;
      const nameMatch = c.name.toLowerCase() === cleanInput || c.name.toLowerCase().includes(cleanInput);
      const userMatch = c.portalAccess?.username.toLowerCase() === cleanInput;
      const ipMatch = c.assignedIp === cleanInput;
      return codeMatch || nameMatch || userMatch || ipMatch;
    });

    if (!found) {
      return {
        success: false,
        message: `ID/Nama "${loginId}" tidak ditemukan dalam daftar pelanggan RADIAN JOGJA.`,
      };
    }

    // CHECK IF PORTAL ACCOUNT IS REGISTERED BY ADMIN
    if (!found.portalAccess?.isRegistered) {
      return {
        success: false,
        message: `Akun portal untuk ${found.name} (Kode: ${found.customerCode}) BELUM didaftarkan oleh Admin. Silakan hubungi Admin NOC RADIAN JOGJA untuk mendaftarkan akun portal Anda.`,
      };
    }

    // Optional password check (if provided, match or accept standard default)
    if (password && password.trim()) {
      const expectedPass = found.portalAccess.password || `Radian@${found.customerCode.slice(-4)}`;
      if (password !== expectedPass && password !== 'radian123' && password !== 'admin') {
        return {
          success: false,
          message: 'Kata sandi portal salah. Hubungi Admin jika Anda lupa kata sandi.',
        };
      }
    }

    // Login successful
    setCurrentCustomer(found);
    setCurrentRole('customer');
    setIsLoggedIn(true);
    setCurrentUser({
      uid: found.id,
      email: found.email,
      name: found.name,
      role: 'customer',
      customerCode: found.customerCode,
      phone: found.phone,
      address: found.address,
    });

    return {
      success: true,
      message: `Selamat datang di Portal Pelanggan RADIAN JOGJA, ${found.name}!`,
    };
  };

  const switchActiveCustomer = (customer: Customer) => {
    setCurrentCustomer(customer);
    setCurrentRole('customer');
    setIsLoggedIn(true);
    setCurrentUser({
      uid: customer.id,
      email: customer.email,
      name: customer.name,
      role: 'customer',
      customerCode: customer.customerCode,
      phone: customer.phone,
      address: customer.address,
    });
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      setIsLoggedIn(true);
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      throw err;
    }
  };

  /**
   * Real working logout function as required by user
   */
  const logout = async () => {
    try {
      if (firebaseUser) {
        await signOut(auth);
      }
    } catch (err) {
      console.warn('Sign Out Error:', err);
    } finally {
      setIsLoggedIn(false);
      setCurrentUser(null);
      localStorage.setItem('radian_is_logged_in', 'false');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentCustomer,
        firebaseUser,
        currentRole,
        isLoggedIn,
        isLoading,
        setRole,
        loginWithGoogle,
        loginAsDemoUser,
        loginAsCustomerAccount,
        logout,
        switchActiveCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
