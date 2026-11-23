import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BarChart3,
  BookOpen,
  Edit3,
  ExternalLink,
  FolderKanban,
  LayoutDashboard,
  Plus,
  Settings,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { ScoreAnalyticsChart } from '../components/ScoreAnalyticsChart';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import {
  fetchDigitalBooks,
  removeDigitalBook,
  saveDigitalBook,
  toggleBookActive,
} from '../services/bookService';
import { fetchQuizResultsForTeacherOrAdmin, fetchQuizzes } from '../services/quizService';
import {
  deleteTeacherProfile,
  fetchAchievementsCatalog,
  fetchAllUsersForAdmin,
  fetchLeaderboard,
  fetchTeachers,
  saveTeacherProfile,
  updateUserRoleByAdmin,
} from '../services/userService';
import {
  AchievementBadge,
  AppUser,
  BookSemester,
  ClassLevel,
  DigitalBook,
  Quiz,
  QuizResultRecord,
  StudentProfile,
  TeacherProfile,
  UserRole,
} from '../types';
import { mapFirebaseErrorToMessage } from '../utils/errorMessages';
import { isValidExternalBookUrl } from '../utils/validators';

type AdminMenu =
  | 'dashboard'
  | 'users'
  | 'teachers'
  | 'students'
  | 'books'
  | 'quizzes'
  | 'questions'
  | 'achievements'
  | 'results'
  | 'drive'
  | 'settings';

export function AdminDashboardPage() {
  const { appUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [activeMenu, setActiveMenu] = useState<AdminMenu>('books');
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [achievements, setAchievements] = useState<AchievementBadge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Kelola Buku Digital
  const [editingBookId, setEditingBookId] = useState<string | undefined>(undefined);
  const [bookTitle, setBookTitle] = useState('');
  const [bookSubject, setBookSubject] = useState('Pendidikan Pancasila');
  const [bookClass, setBookClass] = useState<ClassLevel>('V');
  const [bookSemester, setBookSemester] = useState<BookSemester>('Tahunan');
  const [bookCurriculum, setBookCurriculum] = useState('Kurikulum Merdeka');
  const [bookSource, setBookSource] = useState('Kemendikbudristek / FlipHTML5');
  const [bookUrl, setBookUrl] = useState('');
  const [bookThumb, setBookThumb] = useState('');
  const [bookDesc, setBookDesc] = useState('');
  const [bookActive, setBookActive] = useState(true);
  const [isSavingBook, setIsSavingBook] = useState(false);

  // Form Guru
  const [teacherName, setTeacherName] = useState('');
  const [teacherSubject, setTeacherSubject] = useState('Pendidikan Pancasila');
  const [teacherSchool, setTeacherSchool] = useState('SDN 01 Nusantara');
  const [isSavingTeacher, setIsSavingTeacher] = useState(false);

  const [deleteBookTarget, setDeleteBookTarget] = useState<DigitalBook | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadAll = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      const [bkList, stList, qzList, achList] = await Promise.all([
        fetchDigitalBooks(true),
        fetchLeaderboard(),
        fetchQuizzes(true),
        fetchAchievementsCatalog(),
      ]);
      setBooks(bkList);
      setStudents(stList);
      setQuizzes(qzList);
      setAchievements(achList);

      const [uList, tList, resList] = await Promise.all([
        fetchAllUsersForAdmin().catch(() => []),
        fetchTeachers().catch(() => []),
        fetchQuizResultsForTeacherOrAdmin(appUser.uid, 'admin').catch(() => []),
      ]);
      setUsers(uList);
      setTeachers(tList);
      setResults(resList);
    } finally {
      setIsLoading(false);
    }
  }, [appUser]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const resetBookForm = () => {
    setEditingBookId(undefined);
    setBookTitle('');
    setBookSubject('Pendidikan Pancasila');
    setBookClass('V');
    setBookSemester('Tahunan');
    setBookCurriculum('Kurikulum Merdeka');
    setBookSource('Kemendikbudristek / FlipHTML5');
    setBookUrl('');
    setBookThumb('');
    setBookDesc('');
    setBookActive(true);
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    if (!isValidExternalBookUrl(bookUrl)) {
      showToast(
        'error',
        'URL Buku tidak valid',
        'Masukkan tautan https:// atau http:// yang valid (bukan URL palsu/lokal).'
      );
      return;
    }

    setIsSavingBook(true);
    try {
      await saveDigitalBook(
        {
          id: editingBookId,
          title: bookTitle,
          subject: bookSubject,
          classLevel: bookClass,
          semester: bookSemester,
          curriculum: bookCurriculum,
          source: bookSource,
          url: bookUrl,
          thumbnail: bookThumb || undefined,
          description: bookDesc,
          isActive: bookActive,
          isSample: false,
        },
        appUser.uid
      );
      showToast('success', 'Buku digital berhasil disimpan');
      resetBookForm();
      await loadAll();
    } catch (err) {
      showToast('error', 'Gagal menyimpan buku', mapFirebaseErrorToMessage(err));
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleEditBook = (b: DigitalBook) => {
    setEditingBookId(b.id);
    setBookTitle(b.title);
    setBookSubject(b.subject);
    setBookClass(b.classLevel);
    setBookSemester(b.semester);
    setBookCurriculum(b.curriculum);
    setBookSource(b.source);
    setBookUrl(b.url);
    setBookThumb(b.thumbnail ?? '');
    setBookDesc(b.description);
    setBookActive(b.isActive);
  };

  const handleToggleBook = async (b: DigitalBook) => {
    try {
      await toggleBookActive(b);
      showToast('success', `Status buku diperbarui: ${!b.isActive ? 'Aktif' : 'Nonaktif'}`);
      await loadAll();
    } catch (err) {
      showToast('error', 'Gagal mengubah status buku', mapFirebaseErrorToMessage(err));
    }
  };

  const handleConfirmDeleteBook = async () => {
    if (!deleteBookTarget) return;
    setIsDeleting(true);
    try {
      await removeDigitalBook(deleteBookTarget.id);
      showToast('success', 'Buku digital berhasil dihapus', deleteBookTarget.title);
      setDeleteBookTarget(null);
      await loadAll();
    } catch (err) {
      showToast('error', 'Gagal menghapus buku', mapFirebaseErrorToMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRoleChange = async (uid: string, role: UserRole) => {
    try {
      await updateUserRoleByAdmin(uid, role);
      showToast('success', 'Peran pengguna diperbarui', `Role diubah menjadi ${role}.`);
      await loadAll();
    } catch (err) {
      showToast('error', 'Gagal mengubah role', mapFirebaseErrorToMessage(err));
    }
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim()) return;
    setIsSavingTeacher(true);
    try {
      await saveTeacherProfile({
        uid: `teacher-${Date.now()}`,
        name: teacherName,
        subject: teacherSubject,
        school: teacherSchool,
        isActive: true,
      });
      setTeacherName('');
      showToast('success', 'Data guru berhasil disimpan');
      await loadAll();
    } catch (err) {
      showToast('error', 'Gagal menyimpan guru', mapFirebaseErrorToMessage(err));
    } finally {
      setIsSavingTeacher(false);
    }
  };

  const menuItems: { id: AdminMenu; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User', icon: Users },
    { id: 'teachers', label: 'Guru', icon: UserCheck },
    { id: 'students', label: 'Siswa', icon: Users },
    { id: 'books', label: 'Buku Digital', icon: BookOpen },
    { id: 'quizzes', label: 'Quiz', icon: Sparkles },
    { id: 'questions', label: 'Soal', icon: Sparkles },
    { id: 'achievements', label: 'Prestasi', icon: Award },
    { id: 'results', label: 'Hasil Quiz', icon: BarChart3 },
    { id: 'drive', label: 'Google Drive', icon: FolderKanban },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
          Panel Administrator Sistem
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
          Dashboard Admin
        </h1>
      </div>

      {/* Menu Admin */}
      <div className="mt-6 flex flex-wrap gap-2">
        {menuItems.map((m) => {
          const Icon = m.icon;
          const active = activeMenu === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMenu(m.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Memuat panel admin...
          </div>
        ) : activeMenu === 'dashboard' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total Pengguna</p>
                <p className="tabular-nums mt-1 text-2xl font-extrabold">{users.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total Buku Digital</p>
                <p className="tabular-nums mt-1 text-2xl font-extrabold text-blue-600 dark:text-sky-400">{books.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total Quiz</p>
                <p className="tabular-nums mt-1 text-2xl font-extrabold">{quizzes.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs text-slate-500">Total Hasil Quiz</p>
                <p className="tabular-nums mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{results.length}</p>
              </div>
            </div>

            <ScoreAnalyticsChart
              title="Statistik Nilai Siswa Tertinggi"
              datasetLabel="Nilai Tertinggi"
              labels={students.slice(0, 8).map((s) => s.name.split(' ')[0])}
              values={students.slice(0, 8).map((s) => s.highestScore)}
            />
          </div>
        ) : activeMenu === 'books' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Form Tambah / Edit Buku Digital */}
            <form
              onSubmit={handleSaveBook}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Plus className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>{editingBookId ? 'Edit Buku Digital' : 'Tambah Buku'}</span>
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="b-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Judul
                  </label>
                  <input
                    id="b-title"
                    type="text"
                    required
                    value={bookTitle}
                    onChange={(e) => setBookTitle(e.target.value)}
                    placeholder="Buku Siswa Pendidikan Pancasila – Kelas 4"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="b-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mata Pelajaran
                    </label>
                    <input
                      id="b-subject"
                      type="text"
                      required
                      value={bookSubject}
                      onChange={(e) => setBookSubject(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="b-class" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kelas
                    </label>
                    <select
                      id="b-class"
                      value={bookClass}
                      onChange={(e) => setBookClass(e.target.value as ClassLevel)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {(['I', 'II', 'III', 'IV', 'V', 'VI'] as ClassLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Kelas {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="b-sem" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Semester
                    </label>
                    <select
                      id="b-sem"
                      value={bookSemester}
                      onChange={(e) => setBookSemester(e.target.value as BookSemester)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Ganjil">Ganjil</option>
                      <option value="Genap">Genap</option>
                      <option value="Tahunan">Tahunan</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="b-curr" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kurikulum
                    </label>
                    <input
                      id="b-curr"
                      type="text"
                      required
                      value={bookCurriculum}
                      onChange={(e) => setBookCurriculum(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="b-source" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sumber Buku
                  </label>
                  <input
                    id="b-source"
                    type="text"
                    required
                    value={bookSource}
                    onChange={(e) => setBookSource(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="b-url" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    URL Buku (Tervalidasi https://)
                  </label>
                  <input
                    id="b-url"
                    type="url"
                    required
                    value={bookUrl}
                    onChange={(e) => setBookUrl(e.target.value)}
                    placeholder="https://online.fliphtml5.com/..."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="b-thumb" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    URL Thumbnail (Opsional)
                  </label>
                  <input
                    id="b-thumb"
                    type="text"
                    value={bookThumb}
                    onChange={(e) => setBookThumb(e.target.value)}
                    placeholder="/src/assets/images/..."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label htmlFor="b-desc" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Deskripsi
                  </label>
                  <textarea
                    id="b-desc"
                    rows={3}
                    required
                    value={bookDesc}
                    onChange={(e) => setBookDesc(e.target.value)}
                    placeholder="Ringkasan materi buku..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={bookActive}
                    onChange={(e) => setBookActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Status Buku Aktif</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingBook}
                    className="min-h-[42px] flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSavingBook ? 'Menyimpan...' : editingBookId ? 'Perbarui Buku' : 'Simpan Buku'}
                  </button>
                  {editingBookId ? (
                    <button
                      type="button"
                      onClick={resetBookForm}
                      className="rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      Batal
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            {/* Daftar Buku Admin */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Buku Digital ({books.length})
              </h2>
              <div className="mt-4 space-y-3">
                {books.map((b) => (
                  <div
                    key={b.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white">{b.title}</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Kelas {b.classLevel} · Semester {b.semester} · {b.curriculum} ·{' '}
                        <span className={b.isActive ? 'text-emerald-600 font-semibold' : 'text-rose-600 font-semibold'}>
                          {b.isActive ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-sky-950 dark:text-sky-300"
                      >
                        <span>Preview</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => void handleToggleBook(b)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                      >
                        {b.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditBook(b)}
                        aria-label={`Edit buku ${b.title}`}
                        className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      {b.id !== 'ppkn-kelas-5' ? (
                        <button
                          type="button"
                          onClick={() => setDeleteBookTarget(b)}
                          aria-label={`Hapus buku ${b.title}`}
                          className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeMenu === 'users' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Manajemen Pengguna & Peran (RBAC)
            </h2>
            <table className="mt-4 w-full min-w-[600px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-3">Nama</th>
                  <th className="py-3">Email</th>
                  <th className="py-3">Role Saat Ini</th>
                  <th className="py-3 text-right">Ubah Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.uid}>
                    <td className="py-3 font-semibold">{u.name}</td>
                    <td className="py-3 text-slate-500">{u.email}</td>
                    <td className="py-3 uppercase font-bold text-blue-600 dark:text-sky-400">{u.role}</td>
                    <td className="py-3 text-right">
                      <select
                        aria-label={`Ubah role untuk ${u.name}`}
                        value={u.role}
                        onChange={(e) => void handleRoleChange(u.uid, e.target.value as UserRole)}
                        className="h-9 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                      >
                        <option value="siswa">siswa</option>
                        <option value="guru">guru</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeMenu === 'teachers' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleSaveTeacher}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Tambah Data Guru</h2>
              <div className="mt-4 space-y-3">
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Nama Guru"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  required
                  value={teacherSubject}
                  onChange={(e) => setTeacherSubject(e.target.value)}
                  placeholder="Mata Pelajaran"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <input
                  type="text"
                  value={teacherSchool}
                  onChange={(e) => setTeacherSchool(e.target.value)}
                  placeholder="Sekolah"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={isSavingTeacher}
                  className="min-h-[42px] w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {isSavingTeacher ? 'Menyimpan...' : 'Simpan Data Guru'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Direktori Guru ({teachers.length})</h2>
              <div className="mt-4 space-y-3">
                {teachers.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <div>
                      <p className="font-bold">{t.name}</p>
                      <p className="text-xs text-slate-500">{t.subject} · {t.school || 'SD/MI'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void deleteTeacherProfile(t.id).then(loadAll)}
                      className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeMenu === 'students' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Siswa</h2>
            <table className="mt-4 w-full min-w-[540px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-3">Nama</th>
                  <th className="py-3">Kelas</th>
                  <th className="py-3">XP</th>
                  <th className="py-3 text-right">Quiz Selesai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 font-semibold">{s.name}</td>
                    <td className="py-3">Kelas {s.classLevel}</td>
                    <td className="tabular-nums py-3 font-semibold text-blue-600">{s.xp} XP</td>
                    <td className="tabular-nums py-3 text-right">{s.completedQuizzes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeMenu === 'quizzes' || activeMenu === 'questions' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Admin memiliki akses penuh untuk membuat, mengedit, dan mengelola quiz serta soal beserta kunci jawabannya di Panel Guru.
            </p>
            <Link
              to="/dashboard/guru"
              className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
            >
              Buka Pengelola Quiz & Soal
            </Link>
          </div>
        ) : activeMenu === 'achievements' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Daftar Lencana Prestasi ({achievements.length})</h2>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {achievements.map((a) => (
                <div key={a.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="font-bold">{a.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{a.criteria}</p>
                </div>
              ))}
            </div>
          </div>
        ) : activeMenu === 'results' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Semua Hasil Quiz</h2>
            <table className="mt-4 w-full min-w-[560px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-3">Siswa</th>
                  <th className="py-3">Quiz</th>
                  <th className="py-3 text-right">Skor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {results.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 font-semibold">{r.studentName}</td>
                    <td className="py-3">{r.quizTitle}</td>
                    <td className="tabular-nums py-3 text-right font-bold text-blue-600">{r.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeMenu === 'drive' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Akses ruang penyimpanan Google Drive untuk cadangan dokumen pembelajaran.
            </p>
            <Link to="/google-drive" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
              Buka Google Drive
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Pengaturan Aplikasi</h2>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold">Tema Tampilan</p>
                <p className="text-xs text-slate-500">Tema saat ini: {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}</p>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Ganti Tema
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteBookTarget)}
        title="Hapus Buku Digital?"
        description={`Buku "${deleteBookTarget?.title ?? ''}" akan dihapus dari katalog.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDeleteBook()}
        onCancel={() => setDeleteBookTarget(null)}
      />
    </div>
  );
}
