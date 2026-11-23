import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="mx-auto flex min-h-[65vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
      <p className="tabular-nums text-6xl font-extrabold text-blue-600 dark:text-sky-400">
        404
      </p>
      <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
      >
        <Home className="h-4 w-4" aria-hidden="true" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  );
}
