import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { ensureUserDocuments, logoutAccount } from '../services/authService';
import { clearDriveToken } from '../services/driveService';
import { AppUser, StudentProfile } from '../types';

interface AuthContextValue {
  firebaseUser: User | null;
  appUser: AppUser | null;
  studentProfile: StudentProfile | null;
  authReady: boolean;
  isLoading: boolean;
  refreshProfile: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const syncUser = useCallback(async (user: User | null) => {
    if (!user) {
      setFirebaseUser(null);
      setAppUser(null);
      setStudentProfile(null);
      clearDriveToken();
      setAuthReady(true);
      setIsLoading(false);
      return;
    }

    setFirebaseUser(user);
    try {
      const { user: u, student } = await ensureUserDocuments(user);
      setAppUser(u);
      setStudentProfile(student);
    } catch (err) {
      console.error('Gagal memuat profil pengguna:', err);
      setAppUser({
        id: user.uid,
        uid: user.uid,
        name: user.displayName || user.email?.split('@')[0] || 'Pengguna',
        email: user.email || '',
        role: 'siswa',
        photoURL: user.photoURL || undefined,
        classLevel: 'V',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setAuthReady(true);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      void syncUser(user);
    });
    return () => unsubscribe();
  }, [syncUser]);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) {
      await syncUser(auth.currentUser);
    }
  }, [syncUser]);

  const logout = useCallback(async () => {
    clearDriveToken();
    await logoutAccount();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        appUser,
        studentProfile,
        authReady,
        isLoading,
        refreshProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return ctx;
}
