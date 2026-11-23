import { Link } from 'react-router-dom';
import { BookOpen, FolderKanban, ShieldCheck, Sparkles, Trophy } from 'lucide-react';

export function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
          Pembuat Apps by.Ridwan
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          Tentang WEB QUIZIZZ
        </h1>
        <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          Platform pembelajaran digital interaktif untuk membantu siswa belajar Pendidikan Pancasila melalui buku digital, quiz interaktif, prestasi, dan Google Drive.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50">
            <BookOpen className="h-6 w-6 text-blue-600 dark:text-sky-400" aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Katalog Buku Digital Resmi
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Menyediakan tautan langsung ke Buku Siswa Pendidikan Pancasila Kurikulum Merdeka tanpa menyalin konten buku.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50">
            <Sparkles className="h-6 w-6 text-blue-600 dark:text-sky-400" aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Quiz Interaktif Aman
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Kunci jawaban tidak dikirim ke browser siswa sebelum quiz selesai, memastikan kejujuran evaluasi belajar.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50">
            <Trophy className="h-6 w-6 text-blue-600 dark:text-sky-400" aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Sistem Prestasi & Leaderboard
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Menghitung XP, rata-rata skor, dan lencana penghargaan secara otomatis sebagai motivasi belajar siswa SD/MI.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-800/50">
            <FolderKanban className="h-6 w-6 text-blue-600 dark:text-sky-400" aria-hidden="true" />
            <h2 className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              Integrasi Google Drive
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
              Menggunakan Google Identity Services dengan scope minimal untuk menyimpan catatan materi dan cadangan rapor XP.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <span>Didukung Firebase Authentication & Cloud Firestore Security Rules</span>
          </div>
          <Link
            to="/buku-digital"
            className="inline-flex min-h-[42px] items-center rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Mulai Belajar Sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}
