import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  GraduationCap,
  LogOut,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';

export function Navbar() {
  const { appUser, firebaseUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: 'Beranda' },
    { to: '/buku-digital', label: 'Buku Digital' },
    { to: '/quiz', label: 'Quiz Interaktif' },
    { to: '/prestasi', label: 'Prestasi' },
    { to: '/google-drive', label: 'Google Drive' },
    { to: '/tentang', label: 'Tentang' },
  ];

  const dashboardPath =
    appUser?.role === 'admin'
      ? '/dashboard/admin'
      : appUser?.role === 'guru'
        ? '/dashboard/guru'
        : '/dashboard/siswa';

  const panelLabel =
    appUser?.role === 'admin'
      ? 'Panel Admin'
      : appUser?.role === 'guru'
        ? 'Panel Guru'
        : 'Dashboard';

  const handleLogout = async () => {
    try {
      await logout();
      setMobileOpen(false);
      showToast('success', 'Berhasil keluar', 'Sampai jumpa pada sesi belajar berikutnya.');
      navigate('/');
    } catch {
      showToast('error', 'Gagal keluar', 'Silakan coba beberapa saat lagi.');
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-colors dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Zone 1: Brand Mark */}
        <Link
          to="/"
          onClick={() => setMobileOpen(false)}
          className="flex shrink-0 items-center gap-2.5 whitespace-nowrap text-lg font-extrabold tracking-tight text-blue-700 dark:text-sky-400"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>WEB QUIZIZZ</span>
        </Link>

        {/* Zone 2: Desktop Navigation Links */}
        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-5 lg:flex"
        >
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `relative whitespace-nowrap shrink-0 py-1 text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-blue-600 dark:text-sky-400 after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-blue-600 dark:after:bg-sky-400'
                    : 'text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-sky-400'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Zone 3: Actions & Mobile Toggle */}
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {firebaseUser ? (
            <div className="hidden items-center gap-2 sm:flex">
              <Link
                to={dashboardPath}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl border border-blue-200 bg-blue-50 px-3.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60"
              >
                {appUser?.role === 'admin' ? (
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                )}
                <span>{panelLabel}</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-10 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl px-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-rose-600 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-rose-400"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden h-10 items-center gap-1.5 whitespace-nowrap shrink-0 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 sm:inline-flex"
            >
              <UserCircle2 className="h-4 w-4" aria-hidden="true" />
              <span>Masuk</span>
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden dark:border-slate-800 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 pb-5 pt-3 lg:hidden dark:border-slate-800 dark:bg-slate-950">
          <nav aria-label="Navigasi seluler" className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-sky-950/70 dark:text-sky-300'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-900'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-800">
            {firebaseUser ? (
              <div className="flex flex-col gap-2">
                <Link
                  to={dashboardPath}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <GraduationCap className="h-4 w-4" aria-hidden="true" />
                  <span>{panelLabel}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 dark:border-slate-800 dark:text-rose-400 dark:hover:bg-rose-950/30"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>Keluar</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <UserCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Masuk ke Akun</span>
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
