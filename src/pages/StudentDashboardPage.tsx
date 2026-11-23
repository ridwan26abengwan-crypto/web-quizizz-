import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  FolderKanban,
  Sparkles,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { updateOwnProfile } from '../services/authService';
import { fetchQuizResultsForStudent } from '../services/quizService';
import { fetchLeaderboard } from '../services/userService';
import { ClassLevel, QuizResultRecord, StudentProfile } from '../types';
import { mapFirebaseErrorToMessage } from '../utils/errorMessages';
import { formatReadableDuration } from '../utils/quizLogic';

export function StudentDashboardPage() {
  const { appUser, studentProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'ringkasan' | 'profil'>('ringkasan');
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<StudentProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [nameInput, setNameInput] = useState(appUser?.name ?? '');
  const [classInput, setClassInput] = useState<ClassLevel>(
    (studentProfile?.classLevel as ClassLevel) ?? 'V'
  );
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    setNameInput(appUser?.name ?? '');
    if (studentProfile?.classLevel) {
      setClassInput(studentProfile.classLevel);
    }
  }, [appUser?.name, studentProfile?.classLevel]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!appUser) return;
      setIsLoading(true);
      try {
        const [resList, lb] = await Promise.all([
          fetchQuizResultsForStudent(appUser.uid),
          fetchLeaderboard(),
        ]);
        if (active) {
          setResults(resList);
          setLeaderboard(lb);
        }
      } catch (err) {
        console.warn('Gagal memuat riwayat siswa:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [appUser]);

  const ranking = useMemo(() => {
    if (!appUser) return null;
    const idx = leaderboard.findIndex((s) => s.uid === appUser.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, appUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !nameInput.trim()) return;
    setIsSavingProfile(true);
    try {
      await updateOwnProfile(appUser.uid, {
        name: nameInput.trim(),
        classLevel: classInput,
      });
      await refreshProfile();
      showToast('success', 'Profil berhasil disimpan');
    } catch (err) {
      showToast('error', 'Gagal memperbarui profil', mapFirebaseErrorToMessage(err));
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header Selamat Datang */}
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center dark:border-slate-800">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
            Dashboard Siswa · Kelas {studentProfile?.classLevel ?? 'V'}
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
            Selamat datang, {appUser?.name ?? 'Siswa'}
          </h1>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('ringkasan')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'ringkasan'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Ringkasan Belajar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('profil')}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              activeTab === 'profil'
                ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Profil Saya
          </button>
        </div>
      </div>

      {/* Menu Navigasi Cepat Siswa */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Link
          to="/buku-digital"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <BookOpen className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
          <span>Buku Digital</span>
        </Link>
        <Link
          to="/quiz"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Sparkles className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
          <span>Quiz</span>
        </Link>
        <Link
          to="/prestasi"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <Trophy className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
          <span>Prestasi</span>
        </Link>
        <button
          type="button"
          onClick={() => setActiveTab('profil')}
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-left text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <UserCheck className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
          <span>Profil</span>
        </button>
        <Link
          to="/google-drive"
          className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-sm font-semibold text-slate-800 transition-colors hover:border-blue-300 hover:bg-blue-50/50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <FolderKanban className="h-4 w-4 text-blue-600 dark:text-sky-400" aria-hidden="true" />
          <span>Google Drive</span>
        </Link>
      </div>

      {activeTab === 'profil' ? (
        <form
          onSubmit={handleSaveProfile}
          className="mt-8 max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Pengaturan Profil Siswa
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="student-profile-name"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Nama Lengkap
              </label>
              <input
                id="student-profile-name"
                type="text"
                required
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div>
              <label
                htmlFor="student-profile-class"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Kelas SD/MI
              </label>
              <select
                id="student-profile-class"
                value={classInput}
                onChange={(e) => setClassInput(e.target.value as ClassLevel)}
                className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                {(['I', 'II', 'III', 'IV', 'V', 'VI'] as ClassLevel[]).map((lvl) => (
                  <option key={lvl} value={lvl}>
                    Kelas {lvl}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              disabled={isSavingProfile}
              className="min-h-[42px] rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      ) : (
        <>
          {/* 5 Statistik Siswa */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">XP</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-blue-600 dark:text-sky-400">
                {studentProfile?.xp ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Quiz Selesai</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {studentProfile?.completedQuizzes ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nilai Rata-rata</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {studentProfile?.averageScore ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Prestasi</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {studentProfile?.badges.length ?? 0}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Ranking</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {ranking ? `#${ranking}` : '—'}
              </p>
            </div>
          </div>

          {/* Riwayat Quiz Siswa */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Riwayat Pengerjaan Quiz Anda
              </h2>
              <Link
                to="/quiz"
                className="text-xs font-semibold text-blue-600 hover:underline dark:text-sky-400"
              >
                Kerjakan Quiz Baru
              </Link>
            </div>

            {isLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Memuat riwayat...</p>
            ) : results.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-700">
                <Award className="mx-auto h-8 w-8 text-slate-400" aria-hidden="true" />
                <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Belum ada quiz yang diselesaikan
                </p>
                <Link
                  to="/quiz"
                  className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  Mulai Quiz Pertama
                </Link>
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
                      <th className="py-3 pr-4">Judul Quiz</th>
                      <th className="px-3 py-3">Benar / Total</th>
                      <th className="px-3 py-3">Durasi</th>
                      <th className="px-3 py-3">XP</th>
                      <th className="py-3 pl-3 text-right">Skor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {results.map((r) => (
                      <tr key={r.id}>
                        <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                          {r.quizTitle}
                        </td>
                        <td className="tabular-nums px-3 py-3 text-slate-600 dark:text-slate-300">
                          {r.correctCount}/{r.totalQuestions}
                        </td>
                        <td className="tabular-nums px-3 py-3 text-slate-600 dark:text-slate-300">
                          {formatReadableDuration(r.durationSeconds)}
                        </td>
                        <td className="tabular-nums px-3 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                          +{r.xpEarned} XP
                        </td>
                        <td className="tabular-nums py-3 pl-3 text-right font-extrabold text-blue-600 dark:text-sky-400">
                          {r.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
