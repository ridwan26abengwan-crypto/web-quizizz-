import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { ToastMessage, ToastType } from '../types';

interface ToastContextValue {
  showToast: (type: ToastType, title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (type: ToastType, title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { id, type, title, description }]);
      window.setTimeout(() => {
        dismiss(id);
      }, 4500);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4 sm:px-0"
      >
        {toasts.map((t) => {
          const styles: Record<ToastType, string> = {
            success:
              'border-emerald-200 bg-white text-slate-900 dark:border-emerald-900/60 dark:bg-slate-900 dark:text-slate-100',
            error:
              'border-rose-200 bg-white text-slate-900 dark:border-rose-900/60 dark:bg-slate-900 dark:text-slate-100',
            warning:
              'border-amber-200 bg-white text-slate-900 dark:border-amber-900/60 dark:bg-slate-900 dark:text-slate-100',
            info:
              'border-sky-200 bg-white text-slate-900 dark:border-sky-900/60 dark:bg-slate-900 dark:text-slate-100',
          };

          const Icon =
            t.type === 'success'
              ? CheckCircle2
              : t.type === 'error'
                ? AlertCircle
                : t.type === 'warning'
                  ? TriangleAlert
                  : Info;

          const iconColor =
            t.type === 'success'
              ? 'text-emerald-600 dark:text-emerald-400'
              : t.type === 'error'
                ? 'text-rose-600 dark:text-rose-400'
                : t.type === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-sky-600 dark:text-sky-400';

          return (
            <div
              key={t.id}
              role="status"
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-lg transition-all duration-200 ${styles[t.type]}`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColor}`} aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.description ? (
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
                    {t.description}
                  </p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast harus digunakan di dalam ToastProvider.');
  }
  return ctx;
}
