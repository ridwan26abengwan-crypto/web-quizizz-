import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, BookOpen, Lock, Mail, User } from 'lucide-react';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { loginWithEmail, loginWithGoogle, registerWithEmail } from '../services/authService';
import { ClassLevel } from '../types';
import { mapFirebaseErrorToMessage } from '../utils/errorMessages';

export function LoginPage() {
  const { appUser, firebaseUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [classLevel, setClassLevel] = useState<ClassLevel>('V');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    if (firebaseUser && appUser) {
      if (appUser.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (appUser.role === 'guru') {
        navigate('/dashboard/guru', { replace: true });
      } else {
        navigate('/dashboard/siswa', { replace: true });
      }
    }
  }, [firebaseUser, appUser, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText(null);
    setIsSubmitting(true);
    try {
      if (tab === 'login') {
        await loginWithEmail(email, password);
        showToast('success', 'Berhasil masuk', 'Selamat datang kembali di WEB QUIZIZZ.');
      } else {
        if (!name.trim()) {
          setErrorText('Nama lengkap siswa wajib diisi.');
          setIsSubmitting(false);
          return;
        }
        await registerWithEmail({ name, email, password, classLevel });
        showToast(
          'success',
          'Akun berhasil dibuat',
          'Email verifikasi telah dikirim. Anda sudah masuk ke dashboard.'
        );
      }
    } catch (err) {
      const msg = mapFirebaseErrorToMessage(err);
      setErrorText(msg);
      showToast('error', 'Autentikasi gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorText(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
      showToast('success', 'Berhasil masuk dengan Google', 'Selamat belajar di WEB QUIZIZZ!');
    } catch (err) {
      const msg = mapFirebaseErrorToMessage(err);
      setErrorText(msg);
      showToast('error', 'Masuk dengan Google gagal', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <BookOpen className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
            Masuk ke WEB QUIZIZZ
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Akses dashboard siswa, guru, atau admin secara aman.
          </p>
        </div>

        {/* Segmented Control Masuk / Daftar */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorText(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === 'login'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setErrorText(null);
            }}
            className={`rounded-lg py-2 text-sm font-semibold transition-colors ${
              tab === 'register'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Daftar Siswa
          </button>
        </div>

        {errorText ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs leading-relaxed text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorText}</span>
          </div>
        ) : null}

        <form onSubmit={handleEmailAuth} className="mt-5 space-y-4">
          {tab === 'register' ? (
            <>
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Nama Lengkap
                </label>
                <div className="relative mt-1">
                  <User
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Aisyah Putri"
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-class"
                  className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                >
                  Kelas
                </label>
                <select
                  id="auth-class"
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value as ClassLevel)}
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {(['I', 'II', 'III', 'IV', 'V', 'VI'] as ClassLevel[]).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      Kelas {lvl} SD/MI
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : null}

          <div>
            <label
              htmlFor="auth-email"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Email
            </label>
            <div className="relative mt-1">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@sekolah.sch.id"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="auth-password"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Kata Sandi
            </label>
            <div className="relative mt-1">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-[44px] w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {isSubmitting
              ? 'Memproses...'
              : tab === 'login'
                ? 'Masuk dengan Email'
                : 'Daftar Akun Siswa'}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-medium text-slate-400">atau</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <GoogleSignInButton
          onClick={() => void handleGoogleLogin()}
          disabled={isSubmitting}
          label="Masuk dengan Google"
        />
      </div>
    </div>
  );
}
