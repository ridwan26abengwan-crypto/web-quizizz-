import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { SkeletonCard } from '../components/SkeletonCard';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  fetchPublicQuestions,
  fetchQuizzes,
  submitAndGradeQuiz,
} from '../services/quizService';
import { PublicQuestion, Quiz, QuizGradingResponse } from '../types';
import { formatDuration, formatReadableDuration } from '../utils/quizLogic';

type QuizMode = 'catalog' | 'playing' | 'result';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

export function QuizPage() {
  const { appUser, studentProfile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('Semua');
  const [difficultyFilter, setDifficultyFilter] = useState('Semua');
  const [subjectFilter, setSubjectFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState<'Semua' | 'Aktif'>('Aktif');

  const [mode, setMode] = useState<QuizMode>('catalog');
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizGradingResponse | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      const data = await fetchQuizzes(true);
      if (active) {
        setQuizzes(data);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  // Timer saat quiz berlangsung
  useEffect(() => {
    if (mode !== 'playing' || isSubmitting) return;
    const timer = window.setInterval(() => {
      setElapsedSeconds((e) => e + 1);
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          void handleConfirmSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, isSubmitting]);

  const subjectOptions = useMemo(() => {
    const s = new Set<string>(['Pendidikan Pancasila']);
    quizzes.forEach((q) => s.add(q.subject));
    return ['Semua', ...Array.from(s)];
  }, [quizzes]);

  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const mClass = classFilter === 'Semua' || q.classLevel === classFilter;
      const mDiff = difficultyFilter === 'Semua' || q.difficulty === difficultyFilter;
      const mSubj = subjectFilter === 'Semua' || q.subject === subjectFilter;
      const mStatus = statusFilter === 'Semua' || q.isActive;
      return mClass && mDiff && mSubj && mStatus;
    });
  }, [quizzes, classFilter, difficultyFilter, subjectFilter, statusFilter]);

  const handleStartQuiz = async (quiz: Quiz) => {
    try {
      const loadedQuestions = await fetchPublicQuestions(quiz.id);
      if (loadedQuestions.length === 0) {
        showToast('warning', 'Soal belum tersedia', 'Guru belum menambahkan soal untuk quiz ini.');
        return;
      }
      setActiveQuiz(quiz);
      setQuestions(loadedQuestions);
      setCurrentIndex(0);
      setAnswers({});
      setElapsedSeconds(0);
      setSecondsLeft(quiz.durationMinutes * 60);
      setResult(null);
      setShowBreakdown(false);
      setMode('playing');
    } catch {
      showToast('error', 'Gagal memulai quiz', 'Tidak dapat memuat daftar soal saat ini.');
    }
  };

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx,
    }));
  };

  const handleConfirmSubmit = async (autoTimeout = false) => {
    if (!activeQuiz || isSubmitting) return;
    setConfirmOpen(false);
    setIsSubmitting(true);

    try {
      const graded = await submitAndGradeQuiz({
        quiz: activeQuiz,
        questions,
        answers,
        durationSeconds: elapsedSeconds,
        studentUid: appUser?.uid,
        studentName: appUser?.name,
        studentClassLevel:
          appUser?.classLevel && appUser.classLevel !== 'Umum'
            ? appUser.classLevel
            : activeQuiz.classLevel,
        currentTotalXp: studentProfile?.xp ?? 0,
      });

      setResult(graded);
      setMode('result');
      if (appUser) {
        await refreshProfile();
      }
      showToast(
        'success',
        autoTimeout ? 'Waktu habis! Quiz selesai' : 'Quiz berhasil diselesaikan',
        `Skor Anda ${graded.score}% (+${graded.xpEarned} XP).`
      );
    } catch (err) {
      showToast(
        'error',
        'Gagal mengirim jawaban',
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menilai quiz.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- TAMPILAN SAAT QUIZ BERLANGSUNG ---
  if (mode === 'playing' && activeQuiz && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const answeredCount = questions.filter((q) => answers[q.id] !== undefined && answers[q.id] !== null).length;
    const progressPct = Math.round(((currentIndex + 1) / questions.length) * 100);

    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {/* Header Bar Quiz */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-sky-400">
                {activeQuiz.subject} · Kelas {activeQuiz.classLevel}
              </p>
              <h1 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                {activeQuiz.title}
              </h1>
            </div>
            <div
              className={`tabular-nums inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-bold ${
                secondsLeft <= 60
                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                  : 'bg-blue-50 text-blue-700 dark:bg-sky-950/60 dark:text-sky-300'
              }`}
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>{formatDuration(secondsLeft)}</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
              <span className="tabular-nums">
                Soal {currentIndex + 1} dari {questions.length}
              </span>
              <span className="tabular-nums">
                Terjawab: {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all duration-300 dark:bg-sky-400"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Navigasi Nomor Soal */}
          <div className="mt-4 flex flex-wrap gap-2">
            {questions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined && answers[q.id] !== null;
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Buka soal nomor ${idx + 1}`}
                  className={`tabular-nums h-9 w-9 rounded-lg text-xs font-bold transition-colors ${
                    isCurrent
                      ? 'bg-blue-600 text-white'
                      : isAnswered
                        ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Kartu Soal Tunggal */}
        <motion.div
          key={currentQ.id}
          initial={{ opacity: 0.85, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.16 }}
          className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Nomor {currentIndex + 1}</span>
            <span className="tabular-nums">{currentQ.points} Poin</span>
          </div>

          <h2 className="mt-3 text-lg font-bold leading-relaxed text-slate-900 sm:text-xl dark:text-white">
            {currentQ.questionText}
          </h2>

          <div className="mt-6 space-y-3" role="radiogroup" aria-label="Pilihan jawaban">
            {currentQ.options.map((opt, optIdx) => {
              const selected = answers[currentQ.id] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => handleSelectOption(currentQ.id, optIdx)}
                  className={`flex min-h-[54px] w-full items-center gap-3.5 rounded-xl border p-4 text-left transition-all ${
                    selected
                      ? 'border-blue-600 bg-blue-50/80 text-blue-950 ring-2 ring-blue-600/20 dark:border-sky-400 dark:bg-sky-950/60 dark:text-white'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                      selected
                        ? 'bg-blue-600 text-white dark:bg-sky-400 dark:text-slate-950'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {OPTION_LETTERS[optIdx]}
                  </span>
                  <span className="text-sm font-medium leading-snug sm:text-base">{opt}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 dark:border-slate-800">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-2">
              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                <span>Selesai</span>
              </button>
            </div>
          </div>
        </motion.div>

        <ConfirmModal
          open={confirmOpen}
          title="Selesaikan Quiz Sekarang?"
          description={`Anda telah menjawab ${answeredCount} dari ${questions.length} soal. Pastikan semua jawaban sudah diperiksa sebelum dikirim.`}
          confirmLabel="Ya, Kirim Jawaban"
          cancelLabel="Periksa Lagi"
          isLoading={isSubmitting}
          onConfirm={() => void handleConfirmSubmit(false)}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    );
  }

  // --- TAMPILAN HASIL QUIZ ---
  if (mode === 'result' && activeQuiz && result) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <motion.div
          initial={{ opacity: 0.92, scale: 0.98, y: 6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.16 }}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-sky-950/70 dark:text-sky-400">
              <Award className="h-8 w-8" aria-hidden="true" />
            </div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-sky-400">
              Hasil Quiz Interaktif
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white">
              {activeQuiz.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {result.score >= 80
                ? 'Luar biasa! Pemahaman Pendidikan Pancasila Anda sangat baik.'
                : result.score >= 60
                  ? 'Bagus! Terus berlatih agar nilaimu semakin meningkat.'
                  : 'Semangat belajar! Coba baca kembali buku digital lalu ulangi quiz ini.'}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Skor Akhir</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-blue-600 dark:text-sky-400">
                {result.score}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Persentase</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-slate-900 dark:text-white">
                {result.percentage}%
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">XP Diperoleh</p>
              <p className="tabular-nums mt-1 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                +{result.xpEarned} XP
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Jawaban Benar</p>
              <p className="tabular-nums mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {result.correctCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Jawaban Salah</p>
              <p className="tabular-nums mt-1 text-xl font-bold text-rose-600 dark:text-rose-400">
                {result.wrongCount}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center dark:border-slate-800 dark:bg-slate-800/60">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Waktu Pengerjaan</p>
              <p className="tabular-nums mt-1 text-base font-bold text-slate-900 dark:text-white">
                {formatReadableDuration(elapsedSeconds)}
              </p>
            </div>
          </div>

          {result.earnedBadges.length > 0 ? (
            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 dark:border-sky-900 dark:bg-sky-950/50">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700 dark:text-sky-300">
                Lencana Prestasi Memenuhi Syarat
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.earnedBadges.map((b) => (
                  <span
                    key={b}
                    className="rounded-md bg-white px-3 py-1 text-xs font-semibold text-blue-800 shadow-xs dark:bg-slate-900 dark:text-sky-300"
                  >
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => void handleStartQuiz(activeQuiz)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Ulangi Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('catalog')}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <span>Kembali ke Quiz</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBreakdown((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-5 py-2.5 text-sm font-semibold text-blue-700 hover:bg-blue-100 dark:border-sky-900 dark:bg-sky-950/70 dark:text-sky-300"
            >
              <span>{showBreakdown ? 'Sembunyikan Pembahasan' : 'Lihat Hasil'}</span>
            </button>
            {appUser ? (
              <button
                type="button"
                onClick={() => navigate('/prestasi')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-blue-600 hover:underline dark:text-sky-400"
              >
                <span>Buka Halaman Prestasi</span>
              </button>
            ) : null}
          </div>

          {showBreakdown ? (
            <div className="mt-8 space-y-4 border-t border-slate-200 pt-6 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Pembahasan Jawaban
              </h2>
              {questions.map((q, idx) => {
                const item = result.breakdown.find((b) => b.questionId === q.id);
                const isCorrect = item?.isCorrect ?? false;
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {idx + 1}. {q.questionText}
                      </p>
                      {isCorrect ? (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          Benar
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <XCircle className="h-4 w-4" aria-hidden="true" />
                          Salah
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                      Jawaban Anda:{' '}
                      <strong>
                        {item?.selectedOption !== null && item?.selectedOption !== undefined
                          ? `${OPTION_LETTERS[item.selectedOption]}. ${q.options[item.selectedOption]}`
                          : 'Tidak dijawab'}
                      </strong>
                    </p>
                    <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                      Jawaban Benar:{' '}
                      <strong>
                        {item
                          ? `${OPTION_LETTERS[item.correctAnswer]}. ${q.options[item.correctAnswer]}`
                          : '-'}
                      </strong>
                    </p>
                    {item?.explanation ? (
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {item.explanation}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
        </motion.div>
      </div>
    );
  }

  // --- TAMPILAN KATALOG QUIZ ---
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end dark:border-slate-800">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
            Evaluasi Pembelajaran Interaktif
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Quiz Interaktif
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Pilih quiz Pendidikan Pancasila di bawah ini. Jawaban dinilai secara aman di server setelah seluruh soal diselesaikan.
          </p>
        </div>
        <p className="tabular-nums text-sm font-medium text-slate-500 dark:text-slate-400">
          {filteredQuizzes.length} quiz tersedia
        </p>
      </div>

      {/* Filter Quiz */}
      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div>
          <label htmlFor="quiz-class" className="sr-only">
            Filter Kelas Quiz
          </label>
          <select
            id="quiz-class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {['Semua', 'I', 'II', 'III', 'IV', 'V', 'VI'].map((c) => (
              <option key={c} value={c}>
                {c === 'Semua' ? 'Semua Kelas' : `Kelas ${c}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quiz-subject" className="sr-only">
            Filter Mata Pelajaran Quiz
          </label>
          <select
            id="quiz-subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {subjectOptions.map((s) => (
              <option key={s} value={s}>
                {s === 'Semua' ? 'Semua Mata Pelajaran' : s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quiz-difficulty" className="sr-only">
            Filter Tingkat Kesulitan
          </label>
          <select
            id="quiz-difficulty"
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {['Semua', 'Mudah', 'Sedang', 'Sulit'].map((d) => (
              <option key={d} value={d}>
                {d === 'Semua' ? 'Semua Kesulitan' : `Tingkat ${d}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quiz-status" className="sr-only">
            Filter Status Quiz
          </label>
          <select
            id="quiz-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'Semua' | 'Aktif')}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            <option value="Aktif">Status: Aktif</option>
            <option value="Semua">Semua Status</option>
          </select>
        </div>
      </div>

      {/* Daftar Quiz */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <Sparkles className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Quiz tidak ditemukan
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Ubah filter kelas atau tingkat kesulitan untuk melihat quiz lainnya.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredQuizzes.map((quiz) => (
            <article
              key={quiz.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
                  {quiz.subject}
                </span>
                <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
                  Kelas {quiz.classLevel}
                </span>
                {quiz.isSample ? (
                  <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    DATA CONTOH
                  </span>
                ) : null}
              </div>

              <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900 dark:text-white">
                {quiz.title}
              </h2>

              <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 text-xs dark:border-slate-800">
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Jumlah Soal</dt>
                  <dd className="tabular-nums mt-0.5 font-bold text-slate-900 dark:text-white">
                    {quiz.questionCount} Soal
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Durasi</dt>
                  <dd className="tabular-nums mt-0.5 font-bold text-slate-900 dark:text-white">
                    {quiz.durationMinutes} Menit
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Kesulitan</dt>
                  <dd className="mt-0.5 font-bold text-slate-900 dark:text-white">
                    {quiz.difficulty}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500 dark:text-slate-400">Peserta</dt>
                  <dd className="tabular-nums mt-0.5 inline-flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                    <Users className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" />
                    {quiz.participantCount}
                  </dd>
                </div>
              </dl>

              <button
                type="button"
                disabled={!quiz.isActive}
                onClick={() => void handleStartQuiz(quiz)}
                className="mt-6 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-800"
              >
                <Play className="h-4 w-4" aria-hidden="true" />
                <span>{quiz.isActive ? 'Mulai Quiz' : 'Quiz Nonaktif'}</span>
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
