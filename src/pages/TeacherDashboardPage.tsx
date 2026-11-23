import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Edit3,
  FolderKanban,
  HelpCircle,
  Plus,
  Sparkles,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { ScoreAnalyticsChart } from '../components/ScoreAnalyticsChart';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { fetchDigitalBooks } from '../services/bookService';
import {
  fetchAnswerKeyForTeacher,
  fetchPublicQuestions,
  fetchQuizResultsForTeacherOrAdmin,
  fetchQuizzes,
  removeQuestion,
  removeQuiz,
  saveQuestionWithAnswerKey,
  saveQuiz,
} from '../services/quizService';
import { fetchLeaderboard } from '../services/userService';
import {
  ClassLevel,
  DigitalBook,
  PublicQuestion,
  Quiz,
  QuizDifficulty,
  QuizResultRecord,
  StudentProfile,
} from '../types';
import { mapFirebaseErrorToMessage } from '../utils/errorMessages';

type TeacherMenu =
  | 'siswa'
  | 'buku'
  | 'quiz'
  | 'soal'
  | 'hasil'
  | 'prestasi'
  | 'drive'
  | 'laporan';

export function TeacherDashboardPage() {
  const { appUser } = useAuth();
  const { showToast } = useToast();

  const [activeMenu, setActiveMenu] = useState<TeacherMenu>('quiz');
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [results, setResults] = useState<QuizResultRecord[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('');
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form Quiz
  const [editingQuizId, setEditingQuizId] = useState<string | undefined>(undefined);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizSubject, setQuizSubject] = useState('Pendidikan Pancasila');
  const [quizClass, setQuizClass] = useState<ClassLevel>('V');
  const [quizDuration, setQuizDuration] = useState(10);
  const [quizDifficulty, setQuizDifficulty] = useState<QuizDifficulty>('Mudah');
  const [quizActive, setQuizActive] = useState(true);
  const [isSavingQuiz, setIsSavingQuiz] = useState(false);

  // Form Soal
  const [editingQuestionId, setEditingQuestionId] = useState<string | undefined>(undefined);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [points, setPoints] = useState(20);
  const [explanation, setExplanation] = useState('');
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);

  // Konfirmasi hapus
  const [deleteQuizTarget, setDeleteQuizTarget] = useState<Quiz | null>(null);
  const [deleteQuestionTarget, setDeleteQuestionTarget] = useState<PublicQuestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    if (!appUser) return;
    setIsLoading(true);
    try {
      const [stList, bkList, qzList, resList] = await Promise.all([
        fetchLeaderboard(),
        fetchDigitalBooks(false),
        fetchQuizzes(true),
        fetchQuizResultsForTeacherOrAdmin(appUser.uid, appUser.role === 'admin' ? 'admin' : 'guru'),
      ]);
      setStudents(stList);
      setBooks(bkList);
      setQuizzes(qzList);
      setResults(resList);
      if (qzList.length > 0 && !selectedQuizId) {
        setSelectedQuizId(qzList[0].id);
      }
    } catch (err) {
      showToast('error', 'Gagal memuat data guru', mapFirebaseErrorToMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [appUser, selectedQuizId, showToast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedQuizId) return;
    const loadQuestions = async () => {
      const qs = await fetchPublicQuestions(selectedQuizId);
      setQuestions(qs);
    };
    void loadQuestions();
  }, [selectedQuizId]);

  const totalSubmissions = results.length;
  const averageScore = useMemo(() => {
    if (results.length === 0) return 0;
    const sum = results.reduce((acc, r) => acc + r.score, 0);
    return Math.round(sum / results.length);
  }, [results]);

  const handleSaveQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !quizTitle.trim()) return;
    setIsSavingQuiz(true);
    try {
      const existing = quizzes.find((q) => q.id === editingQuizId);
      await saveQuiz(
        {
          id: editingQuizId,
          title: quizTitle,
          subject: quizSubject,
          classLevel: quizClass,
          durationMinutes: quizDuration,
          difficulty: quizDifficulty,
          questionCount: existing?.questionCount ?? 0,
          isActive: quizActive,
        },
        appUser.uid
      );
      showToast('success', 'Data quiz berhasil disimpan');
      setEditingQuizId(undefined);
      setQuizTitle('');
      await loadData();
    } catch (err) {
      showToast('error', 'Gagal menyimpan quiz', mapFirebaseErrorToMessage(err));
    } finally {
      setIsSavingQuiz(false);
    }
  };

  const handleEditQuiz = (quiz: Quiz) => {
    setEditingQuizId(quiz.id);
    setQuizTitle(quiz.title);
    setQuizSubject(quiz.subject);
    setQuizClass(quiz.classLevel);
    setQuizDuration(quiz.durationMinutes);
    setQuizDifficulty(quiz.difficulty);
    setQuizActive(quiz.isActive);
    setActiveMenu('quiz');
  };

  const handleEditQuestion = async (q: PublicQuestion) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.questionText);
    setOptA(q.options[0]);
    setOptB(q.options[1]);
    setOptC(q.options[2]);
    setOptD(q.options[3]);
    setPoints(q.points);
    try {
      const key = await fetchAnswerKeyForTeacher(q.id);
      if (key) {
        setCorrectAnswer(key.correctAnswer);
        setExplanation(key.explanation ?? '');
      }
    } catch {
      setCorrectAnswer(0);
      setExplanation('');
    }
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !selectedQuizId) return;
    if (!questionText.trim() || !optA.trim() || !optB.trim() || !optC.trim() || !optD.trim()) {
      showToast('warning', 'Lengkapi soal', 'Pertanyaan dan keempat pilihan A-D wajib diisi.');
      return;
    }

    setIsSavingQuestion(true);
    try {
      await saveQuestionWithAnswerKey(
        {
          id: editingQuestionId,
          quizId: selectedQuizId,
          questionText,
          options: [optA, optB, optC, optD],
          points,
          order: editingQuestionId
            ? questions.find((x) => x.id === editingQuestionId)?.order ?? 1
            : questions.length + 1,
          correctAnswer,
          explanation,
        },
        appUser.uid
      );
      showToast('success', 'Soal & kunci jawaban berhasil disimpan aman');
      setEditingQuestionId(undefined);
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setExplanation('');
      const updated = await fetchPublicQuestions(selectedQuizId);
      setQuestions(updated);
      await loadData();
    } catch (err) {
      showToast('error', 'Gagal menyimpan soal', mapFirebaseErrorToMessage(err));
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const handleConfirmDeleteQuiz = async () => {
    if (!deleteQuizTarget) return;
    setIsDeleting(true);
    try {
      await removeQuiz(deleteQuizTarget.id);
      showToast('success', 'Quiz berhasil dihapus', deleteQuizTarget.title);
      setDeleteQuizTarget(null);
      await loadData();
    } catch (err) {
      showToast('error', 'Gagal menghapus quiz', mapFirebaseErrorToMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deleteQuestionTarget) return;
    setIsDeleting(true);
    try {
      await removeQuestion(deleteQuestionTarget.id, deleteQuestionTarget.quizId);
      showToast('success', 'Soal berhasil dihapus');
      setDeleteQuestionTarget(null);
      const updated = await fetchPublicQuestions(selectedQuizId);
      setQuestions(updated);
      await loadData();
    } catch (err) {
      showToast('error', 'Gagal menghapus soal', mapFirebaseErrorToMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

  const menuButtons: { id: TeacherMenu; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'siswa', label: 'Data Siswa', icon: Users },
    { id: 'buku', label: 'Buku Digital', icon: BookOpen },
    { id: 'quiz', label: 'Quiz', icon: Sparkles },
    { id: 'soal', label: 'Soal', icon: HelpCircle },
    { id: 'hasil', label: 'Hasil Quiz', icon: BarChart3 },
    { id: 'prestasi', label: 'Prestasi', icon: Trophy },
    { id: 'drive', label: 'Google Drive', icon: FolderKanban },
    { id: 'laporan', label: 'Laporan', icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
          Panel Guru Pendidikan Pancasila
        </p>
        <h1 className="mt-1 text-3xl font-extrabold text-slate-900 dark:text-white">
          Dashboard Guru
        </h1>
      </div>

      {/* 4 Statistik Guru */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Siswa</p>
          <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {students.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Quiz</p>
          <p className="tabular-nums mt-1 text-2xl font-extrabold text-blue-600 dark:text-sky-400">
            {quizzes.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Pengerjaan</p>
          <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
            {totalSubmissions}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Rata-rata Nilai</p>
          <p className="tabular-nums mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {averageScore}
          </p>
        </div>
      </div>

      {/* Menu Navigasi Guru */}
      <div className="mt-6 flex flex-wrap gap-2">
        {menuButtons.map((btn) => {
          const Icon = btn.icon;
          const active = activeMenu === btn.id;
          return (
            <button
              key={btn.id}
              type="button"
              onClick={() => setActiveMenu(btn.id)}
              className={`inline-flex min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-colors ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* Konten Tab Guru */}
      <div className="mt-8">
        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">
            Memuat data dashboard guru...
          </div>
        ) : activeMenu === 'quiz' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleSaveQuiz}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Plus className="h-4 w-4 text-blue-600" aria-hidden="true" />
                <span>{editingQuizId ? 'Edit Quiz' : 'Buat Quiz Baru'}</span>
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="t-quiz-title" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Judul Quiz
                  </label>
                  <input
                    id="t-quiz-title"
                    type="text"
                    required
                    value={quizTitle}
                    onChange={(e) => setQuizTitle(e.target.value)}
                    placeholder="Contoh: Latihan Sila Ke-3 Kelas V"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="t-quiz-class" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kelas
                    </label>
                    <select
                      id="t-quiz-class"
                      value={quizClass}
                      onChange={(e) => setQuizClass(e.target.value as ClassLevel)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {(['I', 'II', 'III', 'IV', 'V', 'VI'] as ClassLevel[]).map((lvl) => (
                        <option key={lvl} value={lvl}>
                          Kelas {lvl}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="t-quiz-dur" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Durasi (Menit)
                    </label>
                    <input
                      id="t-quiz-dur"
                      type="number"
                      min={1}
                      max={180}
                      value={quizDuration}
                      onChange={(e) => setQuizDuration(Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="t-quiz-diff" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Kesulitan
                    </label>
                    <select
                      id="t-quiz-diff"
                      value={quizDifficulty}
                      onChange={(e) => setQuizDifficulty(e.target.value as QuizDifficulty)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value="Mudah">Mudah</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Sulit">Sulit</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="t-quiz-subject" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Mapel
                    </label>
                    <input
                      id="t-quiz-subject"
                      type="text"
                      value={quizSubject}
                      onChange={(e) => setQuizSubject(e.target.value)}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={quizActive}
                    onChange={(e) => setQuizActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Aktifkan Quiz untuk Siswa</span>
                </label>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSavingQuiz}
                    className="min-h-[42px] flex-1 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                  >
                    {isSavingQuiz ? 'Menyimpan...' : editingQuizId ? 'Perbarui Quiz' : 'Simpan Quiz'}
                  </button>
                  {editingQuizId ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingQuizId(undefined);
                        setQuizTitle('');
                      }}
                      className="rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                    >
                      Batal
                    </button>
                  ) : null}
                </div>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Quiz Tersedia
              </h2>
              <div className="mt-4 space-y-3">
                {quizzes.map((q) => (
                  <div
                    key={q.id}
                    className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center dark:border-slate-800"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {q.title}
                        </span>
                        {q.isSample ? (
                          <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                            DATA CONTOH
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Kelas {q.classLevel} · {q.questionCount} Soal · {q.durationMinutes} Menit · {q.difficulty}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedQuizId(q.id);
                          setActiveMenu('soal');
                        }}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 dark:bg-sky-950 dark:text-sky-300"
                      >
                        Kelola Soal
                      </button>
                      {!q.isSample ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditQuiz(q)}
                            aria-label={`Edit quiz ${q.title}`}
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
                          >
                            <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteQuizTarget(q)}
                            aria-label={`Hapus quiz ${q.title}`}
                            className="rounded-lg border border-rose-200 p-2 text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeMenu === 'soal' ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <form
              onSubmit={handleSaveQuestion}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingQuestionId ? 'Edit Soal Quiz' : 'Tambah Soal Baru'}
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="t-q-quiz" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pilih Quiz
                  </label>
                  <select
                    id="t-q-quiz"
                    value={selectedQuizId}
                    onChange={(e) => setSelectedQuizId(e.target.value)}
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {quizzes.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.title} (Kelas {q.classLevel})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="t-q-text" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pertanyaan
                  </label>
                  <textarea
                    id="t-q-text"
                    rows={3}
                    required
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Tulis pertanyaan Pendidikan Pancasila..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    type="text"
                    required
                    value={optA}
                    onChange={(e) => setOptA(e.target.value)}
                    placeholder="Pilihan A"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    value={optB}
                    onChange={(e) => setOptB(e.target.value)}
                    placeholder="Pilihan B"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    value={optC}
                    onChange={(e) => setOptC(e.target.value)}
                    placeholder="Pilihan C"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <input
                    type="text"
                    required
                    value={optD}
                    onChange={(e) => setOptD(e.target.value)}
                    placeholder="Pilihan D"
                    className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="t-q-ans" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Jawaban Benar
                    </label>
                    <select
                      id="t-q-ans"
                      value={correctAnswer}
                      onChange={(e) => setCorrectAnswer(Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      <option value={0}>Pilihan A</option>
                      <option value={1}>Pilihan B</option>
                      <option value={2}>Pilihan C</option>
                      <option value={3}>Pilihan D</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="t-q-pts" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Skor / Poin
                    </label>
                    <input
                      id="t-q-pts"
                      type="number"
                      min={1}
                      max={100}
                      value={points}
                      onChange={(e) => setPoints(Number(e.target.value))}
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="t-q-exp" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Pembahasan (Ditampilkan Setelah Quiz Selesai)
                  </label>
                  <input
                    id="t-q-exp"
                    type="text"
                    value={explanation}
                    onChange={(e) => setExplanation(e.target.value)}
                    placeholder="Penjelasan singkat jawaban..."
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingQuestion}
                  className="min-h-[42px] w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingQuestion ? 'Menyimpan...' : 'Simpan Soal & Kunci Terproteksi'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Daftar Soal ({questions.length})
              </h2>
              <div className="mt-4 space-y-3">
                {questions.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {item.questionText}
                      </p>
                      <span className="tabular-nums shrink-0 text-xs font-bold text-blue-600 dark:text-sky-400">
                        {item.points} Poin
                      </span>
                    </div>
                    <ul className="mt-2 grid grid-cols-1 gap-1 text-xs text-slate-600 sm:grid-cols-2 dark:text-slate-400">
                      {item.options.map((opt, oIdx) => (
                        <li key={oIdx}>
                          {['A', 'B', 'C', 'D'][oIdx]}. {opt}
                        </li>
                      ))}
                    </ul>
                    {item.createdBy !== 'system' ? (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => void handleEditQuestion(item)}
                          className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteQuestionTarget(item)}
                          className="rounded-lg border border-rose-200 px-3 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
                        >
                          Hapus
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : activeMenu === 'siswa' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Data Siswa</h2>
            <table className="mt-4 w-full min-w-[540px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                  <th className="py-3">Nama Siswa</th>
                  <th className="py-3">Kelas</th>
                  <th className="py-3">XP</th>
                  <th className="py-3">Quiz Selesai</th>
                  <th className="py-3 text-right">Rata-rata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr key={s.id}>
                    <td className="py-3 font-semibold text-slate-900 dark:text-white">{s.name}</td>
                    <td className="py-3">Kelas {s.classLevel}</td>
                    <td className="tabular-nums py-3 font-semibold text-blue-600 dark:text-sky-400">{s.xp} XP</td>
                    <td className="tabular-nums py-3">{s.completedQuizzes}</td>
                    <td className="tabular-nums py-3 text-right font-bold">{s.averageScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : activeMenu === 'hasil' ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Hasil Quiz Siswa</h2>
            {results.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Belum ada hasil pengerjaan quiz siswa pada quiz Anda.</p>
            ) : (
              <table className="mt-4 w-full min-w-[580px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
                    <th className="py-3">Nama Siswa</th>
                    <th className="py-3">Quiz</th>
                    <th className="py-3">Benar</th>
                    <th className="py-3 text-right">Skor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {results.map((r) => (
                    <tr key={r.id}>
                      <td className="py-3 font-semibold">{r.studentName}</td>
                      <td className="py-3">{r.quizTitle}</td>
                      <td className="tabular-nums py-3">{r.correctCount}/{r.totalQuestions}</td>
                      <td className="tabular-nums py-3 text-right font-bold text-blue-600 dark:text-sky-400">{r.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : activeMenu === 'laporan' ? (
          <ScoreAnalyticsChart
            title="Grafik Rata-rata Nilai Siswa"
            datasetLabel="Rata-rata Nilai"
            labels={students.slice(0, 8).map((s) => s.name.split(' ')[0])}
            values={students.slice(0, 8).map((s) => s.averageScore)}
          />
        ) : activeMenu === 'buku' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Katalog Buku Digital</h2>
              <Link to="/buku-digital" className="text-xs font-semibold text-blue-600 hover:underline">
                Buka Halaman Buku Digital
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {books.map((b) => (
                <li key={b.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">{b.title}</p>
                    <p className="text-xs text-slate-500">Kelas {b.classLevel} · {b.curriculum}</p>
                  </div>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    📖 Baca Buku
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : activeMenu === 'prestasi' ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Pantau lencana prestasi dan papan peringkat seluruh siswa pada halaman Prestasi.
            </p>
            <Link to="/prestasi" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
              Buka Halaman Prestasi
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Kelola ringkasan bahan ajar dan laporan kelas langsung di Google Drive Anda.
            </p>
            <Link to="/google-drive" className="mt-4 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white">
              Buka Ruang Google Drive
            </Link>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleteQuizTarget)}
        title="Hapus Quiz?"
        description={`Quiz "${deleteQuizTarget?.title ?? ''}" akan dihapus permanen.`}
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDeleteQuiz()}
        onCancel={() => setDeleteQuizTarget(null)}
      />

      <ConfirmModal
        open={Boolean(deleteQuestionTarget)}
        title="Hapus Soal?"
        description="Soal dan kunci jawabannya akan dihapus dari quiz ini."
        confirmLabel="Ya, Hapus"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDeleteQuestion()}
        onCancel={() => setDeleteQuestionTarget(null)}
      />
    </div>
  );
}
