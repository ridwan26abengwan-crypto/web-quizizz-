import { useEffect, useMemo, useState } from 'react';
import { Award, BookOpenCheck, Crown, Medal, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchAchievementsCatalog, fetchLeaderboard } from '../services/userService';
import { AchievementBadge, StudentProfile } from '../types';

export function AchievementsPage() {
  const { studentProfile, appUser } = useAuth();
  const [leaderboard, setLeaderboard] = useState<StudentProfile[]>([]);
  const [badges, setBadges] = useState<AchievementBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emblemError, setEmblemError] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      const [lb, catalog] = await Promise.all([
        fetchLeaderboard(),
        fetchAchievementsCatalog(),
      ]);
      if (active) {
        setLeaderboard(lb);
        setBadges(catalog);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const userRank = useMemo(() => {
    if (!appUser) return null;
    const idx = leaderboard.findIndex((s) => s.uid === appUser.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, appUser]);

  const earnedSet = useMemo(
    () => new Set(studentProfile?.badges ?? []),
    [studentProfile?.badges]
  );

  const renderBadgeIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpenCheck':
        return <BookOpenCheck className="h-6 w-6" aria-hidden="true" />;
      case 'Crown':
        return <Crown className="h-6 w-6" aria-hidden="true" />;
      case 'ShieldCheck':
        return <ShieldCheck className="h-6 w-6" aria-hidden="true" />;
      case 'Trophy':
        return <Trophy className="h-6 w-6" aria-hidden="true" />;
      default:
        return <Award className="h-6 w-6" aria-hidden="true" />;
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Ringkasan Prestasi */}
      <div className="grid grid-cols-1 items-center gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="lg:col-span-8">
          <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
            Pencapaian & Leaderboard
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Prestasi
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Kumpulkan XP dengan menyelesaikan quiz Pendidikan Pancasila, raih lencana kehormatan, dan bersaing secara sehat di papan peringkat siswa.
          </p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total XP</p>
              <p className="tabular-nums mt-1 text-xl font-extrabold text-blue-600 dark:text-sky-400">
                {studentProfile?.xp ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Ranking</p>
              <p className="tabular-nums mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                {userRank ? `#${userRank}` : '—'}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Quiz Selesai</p>
              <p className="tabular-nums mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                {studentProfile?.completedQuizzes ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Nilai Tertinggi</p>
              <p className="tabular-nums mt-1 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {studentProfile?.highestScore ?? 0}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">Total Prestasi</p>
              <p className="tabular-nums mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                {studentProfile?.badges.length ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center lg:col-span-4">
          <div className="h-44 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800">
            {!emblemError ? (
              <img
                src="/src/assets/images/badge_pancasila_emblem_1795452029216.jpg"
                alt="Emblem prestasi siswa WEB QUIZIZZ"
                referrerPolicy="no-referrer"
                onError={() => setEmblemError(true)}
                className="h-full w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center rounded-xl bg-blue-600 text-white">
                <Trophy className="h-12 w-12" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daftar Lencana Badge */}
      <section className="mt-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Koleksi Lencana (Badge)
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {badges.map((badge) => {
            const unlocked = earnedSet.has(badge.title);
            return (
              <div
                key={badge.id}
                className={`flex flex-col rounded-2xl border p-5 transition-all ${
                  unlocked
                    ? 'border-blue-300 bg-blue-50/70 shadow-sm dark:border-sky-800 dark:bg-sky-950/50'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      unlocked
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {renderBadgeIcon(badge.iconName)}
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                      unlocked
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {unlocked ? 'Diraih' : 'Terkunci'}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                  {badge.title}
                </h3>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                  {badge.description}
                </p>
                <p className="mt-3 text-xs font-semibold text-blue-700 dark:text-sky-400">
                  Syarat: {badge.criteria}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mt-12">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Papan Peringkat Siswa (Leaderboard)
          </h2>
          {leaderboard.some((s) => s.isSample) ? (
            <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              DATA CONTOH
            </span>
          ) : null}
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-slate-500">Memuat leaderboard...</div>
          ) : (
            <table className="w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-800/70 dark:text-slate-400">
                  <th className="px-5 py-3.5">Peringkat</th>
                  <th className="px-5 py-3.5">Nama Siswa</th>
                  <th className="px-5 py-3.5">Kelas</th>
                  <th className="px-5 py-3.5">Quiz Selesai</th>
                  <th className="px-5 py-3.5">Nilai Tertinggi</th>
                  <th className="px-5 py-3.5">Total XP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {leaderboard.map((student, idx) => {
                  const isMe = appUser?.uid === student.uid;
                  return (
                    <tr
                      key={student.id}
                      className={
                        isMe
                          ? 'bg-blue-50/60 dark:bg-sky-950/30'
                          : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                      }
                    >
                      <td className="tabular-nums px-5 py-4 font-bold text-slate-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5">
                          {idx < 3 ? (
                            <Medal
                              className={`h-4 w-4 ${
                                idx === 0
                                  ? 'text-amber-500'
                                  : idx === 1
                                    ? 'text-slate-400'
                                    : 'text-amber-700'
                              }`}
                              aria-hidden="true"
                            />
                          ) : null}
                          #{idx + 1}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-white">
                        {student.name}
                        {isMe ? (
                          <span className="ml-2 text-xs font-semibold text-blue-600 dark:text-sky-400">
                            (Anda)
                          </span>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                        Kelas {student.classLevel}
                      </td>
                      <td className="tabular-nums px-5 py-4 text-slate-600 dark:text-slate-300">
                        {student.completedQuizzes}
                      </td>
                      <td className="tabular-nums px-5 py-4 font-semibold text-emerald-600 dark:text-emerald-400">
                        {student.highestScore}
                      </td>
                      <td className="tabular-nums px-5 py-4 font-extrabold text-blue-600 dark:text-sky-400">
                        {student.xp} XP
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
