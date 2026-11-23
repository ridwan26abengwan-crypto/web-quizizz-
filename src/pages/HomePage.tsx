import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Award,
  BookOpen,
  ExternalLink,
  FolderKanban,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { useState } from 'react';
import { SAMPLE_BOOKS } from '../data/sampleData';

const features = [
  {
    title: 'Buku Digital',
    description:
      'Akses buku siswa Pendidikan Pancasila Kurikulum Merdeka langsung dari katalog terstruktur untuk kelas I hingga VI.',
    to: '/buku-digital',
    icon: BookOpen,
    cta: 'Jelajahi Buku',
  },
  {
    title: 'Quiz Interaktif',
    description:
      'Latih pemahaman dengan soal pilihan ganda berbatas waktu, progress bar real-time, dan penilaian otomatis.',
    to: '/quiz',
    icon: Sparkles,
    cta: 'Mainkan Quiz',
  },
  {
    title: 'Prestasi Siswa',
    description:
      'Kumpulkan XP dari setiap quiz yang diselesaikan, buka lencana prestasi, dan pantau peringkat leaderboard kelas.',
    to: '/prestasi',
    icon: Trophy,
    cta: 'Lihat Prestasi',
  },
  {
    title: 'Google Drive',
    description:
      'Simpan ringkasan bab Pendidikan Pancasila dan cadangan rapor XP langsung ke ruang penyimpanan Google Drive Anda.',
    to: '/google-drive',
    icon: FolderKanban,
    cta: 'Buka Google Drive',
  },
];

export function HomePage() {
  const [heroImgError, setHeroImgError] = useState(false);
  const [bookImgError, setBookImgError] = useState(false);
  const mainBook = SAMPLE_BOOKS[0];

  return (
    <div>
      {/* Hero Section */}
      <section className="border-b border-slate-200/80 bg-gradient-to-b from-blue-50/70 via-white to-white dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 py-12 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col justify-center lg:col-span-6"
          >
            <p className="text-sm font-semibold tracking-wide text-blue-600 dark:text-sky-400">
              WEB QUIZIZZ · Pembuat Apps by.Ridwan
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
              Belajar Lebih Seru, Bermain Lebih Cerdas!
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Platform pembelajaran digital interaktif untuk membantu siswa belajar
              Pendidikan Pancasila dengan cara yang menyenangkan.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to="/buku-digital"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <span>Mulai Belajar</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                to="/quiz"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-6 py-3 text-sm font-semibold text-blue-700 transition-all hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-sky-300 dark:hover:bg-slate-800"
              >
                <span>Mainkan Quiz</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-slate-500 sm:gap-x-5 dark:text-slate-400">
              <span className="whitespace-nowrap">Jenjang SD/MI</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Kurikulum Merdeka</span>
              <span className="hidden sm:inline" aria-hidden="true">·</span>
              <span className="whitespace-nowrap">Pendidikan Pancasila</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="lg:col-span-6"
          >
            <div className="h-full min-h-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-blue-50 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              {!heroImgError ? (
                <img
                  src="/src/assets/images/hero_pancasila_learning_1795452030411.jpg"
                  alt="Ilustrasi siswa SD belajar Pendidikan Pancasila secara interaktif dengan tablet dan buku digital"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-sky-500 p-8 text-center text-white">
                  <BookOpen className="mb-3 h-12 w-12" aria-hidden="true" />
                  <p className="text-lg font-bold">WEB QUIZIZZ Pendidikan Pancasila</p>
                  <p className="mt-1 text-sm text-blue-100">
                    Buku Digital · Quiz Interaktif · Prestasi Siswa
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4 Fitur Utama */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Semua Kebutuhan Belajar dalam Satu Platform
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Dirancang khusus untuk siswa dan guru SD/MI agar materi Pendidikan Pancasila lebih mudah dipahami dan diuji secara interaktif.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.35, delay: idx * 0.06 }}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-sky-950/70 dark:text-sky-400">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
                  {feat.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {feat.description}
                </p>
                <Link
                  to={feat.to}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  <span>{feat.cta}</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Buku Utama Pendidikan Pancasila Kelas V */}
      <section className="border-t border-slate-200/80 bg-white py-14 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="lg:col-span-4">
              <div className="mx-auto aspect-[3/4] max-w-[260px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
                {!bookImgError ? (
                  <img
                    src={mainBook.thumbnail}
                    alt={mainBook.title}
                    referrerPolicy="no-referrer"
                    onError={() => setBookImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center bg-blue-600 p-6 text-center text-white">
                    <BookOpen className="mb-3 h-10 w-10" aria-hidden="true" />
                    <p className="font-bold">{mainBook.title}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800 dark:bg-blue-950 dark:text-sky-300">
                  PENDIDIKAN PANCASILA
                </span>
                <span className="rounded-md bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                  KELAS V
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Kurikulum Merdeka · SD/MI
                </span>
              </div>

              <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl dark:text-white">
                {mainBook.title}
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                {mainBook.description}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a
                  href={mainBook.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <span>📖 Baca Buku</span>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </a>
                <Link
                  to="/buku-digital"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  <Award className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                  <span>Lihat Semua Buku Digital</span>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
