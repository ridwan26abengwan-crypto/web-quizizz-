import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <div>
          <p className="text-base font-bold text-slate-900 dark:text-white">
            WEB QUIZIZZ
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Pembuat Apps by.Ridwan · Pembelajaran Digital Pendidikan Pancasila SD/MI
          </p>
        </div>

        <nav aria-label="Tautan footer" className="flex flex-wrap items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
          <Link to="/buku-digital" className="hover:text-blue-600 dark:hover:text-sky-400">
            Buku Digital
          </Link>
          <Link to="/quiz" className="hover:text-blue-600 dark:hover:text-sky-400">
            Quiz Interaktif
          </Link>
          <Link to="/prestasi" className="hover:text-blue-600 dark:hover:text-sky-400">
            Prestasi
          </Link>
          <Link to="/google-drive" className="hover:text-blue-600 dark:hover:text-sky-400">
            Google Drive
          </Link>
          <Link to="/tentang" className="hover:text-blue-600 dark:hover:text-sky-400">
            Tentang
          </Link>
        </nav>
      </div>
    </footer>
  );
}
