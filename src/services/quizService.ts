import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { SAMPLE_QUESTIONS, SAMPLE_QUIZZES } from '../data/sampleData';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  AnswerKeyRecord,
  ClassLevel,
  PublicQuestion,
  Quiz,
  QuizGradingResponse,
  QuizResultRecord,
} from '../types';
import { computeEligibleBadges } from '../utils/quizLogic';
import { sanitizeDocumentId } from '../utils/validators';

function mapQuiz(id: string, data: Record<string, unknown>): Quiz {
  const now = new Date().toISOString();
  const c = data.createdAt as { toDate?: () => Date } | undefined;
  const u = data.updatedAt as { toDate?: () => Date } | undefined;
  return {
    id,
    title: String(data.title ?? ''),
    subject: String(data.subject ?? 'Pendidikan Pancasila'),
    classLevel: (data.classLevel as ClassLevel) ?? 'V',
    durationMinutes: Number(data.durationMinutes ?? 10),
    difficulty: (data.difficulty as Quiz['difficulty']) ?? 'Mudah',
    questionCount: Number(data.questionCount ?? 0),
    participantCount: Number(data.participantCount ?? 0),
    isActive: Boolean(data.isActive ?? true),
    isSample: Boolean(data.isSample ?? false),
    createdBy: String(data.createdBy ?? 'system'),
    createdAt: c?.toDate ? c.toDate().toISOString() : now,
    updatedAt: u?.toDate ? u.toDate().toISOString() : now,
  };
}

function mapQuestion(id: string, data: Record<string, unknown>): PublicQuestion {
  const now = new Date().toISOString();
  const c = data.createdAt as { toDate?: () => Date } | undefined;
  const u = data.updatedAt as { toDate?: () => Date } | undefined;
  const rawOptions = Array.isArray(data.options) ? data.options.map(String) : ['', '', '', ''];
  return {
    id,
    quizId: String(data.quizId ?? ''),
    questionText: String(data.questionText ?? ''),
    options: [
      rawOptions[0] ?? '',
      rawOptions[1] ?? '',
      rawOptions[2] ?? '',
      rawOptions[3] ?? '',
    ],
    points: Number(data.points ?? 20),
    order: Number(data.order ?? 1),
    sealedKey: data.sealedKey ? String(data.sealedKey) : undefined,
    createdBy: String(data.createdBy ?? 'system'),
    createdAt: c?.toDate ? c.toDate().toISOString() : now,
    updatedAt: u?.toDate ? u.toDate().toISOString() : now,
  };
}

export async function fetchQuizzes(includeInactive = false): Promise<Quiz[]> {
  try {
    const q = query(collection(db, 'quizzes'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const dbQuizzes = snap.docs.map((d) => mapQuiz(d.id, d.data()));
    const merged = dbQuizzes.length > 0 ? [...dbQuizzes, ...SAMPLE_QUIZZES.filter((s) => !dbQuizzes.some((d) => d.id === s.id))] : SAMPLE_QUIZZES;
    return includeInactive ? merged : merged.filter((item) => item.isActive);
  } catch (err) {
    console.warn('Memuat daftar quiz contoh karena Firestore tidak tersedia:', err);
    return includeInactive ? SAMPLE_QUIZZES : SAMPLE_QUIZZES.filter((item) => item.isActive);
  }
}

export async function fetchPublicQuestions(quizId: string): Promise<PublicQuestion[]> {
  try {
    const q = query(collection(db, 'questions'), where('quizId', '==', quizId));
    const snap = await getDocs(q);
    const dbQuestions = snap.docs
      .map((d) => mapQuestion(d.id, d.data()))
      .sort((a, b) => a.order - b.order);
    if (dbQuestions.length > 0) {
      return dbQuestions;
    }
    return SAMPLE_QUESTIONS.filter((item) => item.quizId === quizId).sort((a, b) => a.order - b.order);
  } catch {
    return SAMPLE_QUESTIONS.filter((item) => item.quizId === quizId).sort((a, b) => a.order - b.order);
  }
}

export async function fetchAnswerKeyForTeacher(questionId: string): Promise<AnswerKeyRecord | null> {
  try {
    const keyRef = doc(db, 'questions', questionId, 'answer_key', 'key');
    const snap = await getDoc(keyRef);
    if (!snap.exists()) return null;
    const d = snap.data();
    const now = new Date().toISOString();
    return {
      id: String(d.id ?? 'key'),
      questionId: String(d.questionId ?? questionId),
      quizId: String(d.quizId ?? ''),
      correctAnswer: Number(d.correctAnswer ?? 0),
      explanation: d.explanation ? String(d.explanation) : '',
      createdBy: String(d.createdBy ?? ''),
      createdAt: d.createdAt?.toDate ? d.createdAt.toDate().toISOString() : now,
      updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : now,
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `questions/${questionId}/answer_key/key`);
  }
}

export async function saveQuiz(
  input: {
    id?: string;
    title: string;
    subject: string;
    classLevel: ClassLevel;
    durationMinutes: number;
    difficulty: Quiz['difficulty'];
    questionCount: number;
    isActive: boolean;
  },
  actorUid: string
): Promise<Quiz> {
  const quizId = input.id ? sanitizeDocumentId(input.id) : sanitizeDocumentId(`${input.title}-${Date.now()}`);
  const quizRef = doc(db, 'quizzes', quizId);
  const now = new Date().toISOString();

  try {
    if (input.id) {
      await updateDoc(quizRef, {
        title: input.title.trim().slice(0, 200),
        subject: input.subject.trim().slice(0, 100),
        classLevel: input.classLevel,
        durationMinutes: Math.max(1, Math.min(180, input.durationMinutes)),
        difficulty: input.difficulty,
        questionCount: Math.max(0, input.questionCount),
        isActive: input.isActive,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(quizRef, {
        id: quizId,
        title: input.title.trim().slice(0, 200),
        subject: input.subject.trim().slice(0, 100),
        classLevel: input.classLevel,
        durationMinutes: Math.max(1, Math.min(180, input.durationMinutes)),
        difficulty: input.difficulty,
        questionCount: Math.max(0, input.questionCount),
        participantCount: 0,
        isActive: input.isActive,
        isSample: false,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, input.id ? OperationType.UPDATE : OperationType.CREATE, `quizzes/${quizId}`);
  }

  return {
    id: quizId,
    title: input.title.trim(),
    subject: input.subject.trim(),
    classLevel: input.classLevel,
    durationMinutes: input.durationMinutes,
    difficulty: input.difficulty,
    questionCount: input.questionCount,
    participantCount: 0,
    isActive: input.isActive,
    isSample: false,
    createdBy: actorUid,
    createdAt: now,
    updatedAt: now,
  };
}

export async function removeQuiz(quizId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'quizzes', quizId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `quizzes/${quizId}`);
  }
}

export async function saveQuestionWithAnswerKey(
  input: {
    id?: string;
    quizId: string;
    questionText: string;
    options: [string, string, string, string];
    points: number;
    order: number;
    correctAnswer: number;
    explanation?: string;
  },
  actorUid: string
): Promise<PublicQuestion> {
  const questionId = input.id ? sanitizeDocumentId(input.id) : sanitizeDocumentId(`q-${input.quizId}-${Date.now()}`);

  // Segel kunci jawaban melalui server agar correctAnswer tidak terekspos pada dokumen publik
  const sealRes = await fetch('/api/quiz/seal-answer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      questionId,
      correctAnswer: input.correctAnswer,
      points: input.points,
      explanation: input.explanation ?? '',
    }),
  });
  if (!sealRes.ok) {
    throw new Error('Gagal mengenkripsi kunci jawaban di server.');
  }
  const { sealedKey } = (await sealRes.json()) as { sealedKey: string };

  const qRef = doc(db, 'questions', questionId);
  const keyRef = doc(db, 'questions', questionId, 'answer_key', 'key');
  const now = new Date().toISOString();

  try {
    if (input.id) {
      await updateDoc(qRef, {
        questionText: input.questionText.trim().slice(0, 1000),
        options: input.options.map((o) => o.trim().slice(0, 300)),
        points: Math.max(1, Math.min(100, input.points)),
        order: Math.max(0, input.order),
        sealedKey,
        updatedAt: serverTimestamp(),
      });
      await setDoc(
        keyRef,
        {
          id: 'key',
          questionId,
          quizId: input.quizId,
          correctAnswer: input.correctAnswer,
          explanation: (input.explanation ?? '').trim().slice(0, 1000),
          createdBy: actorUid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      await setDoc(qRef, {
        id: questionId,
        quizId: input.quizId,
        questionText: input.questionText.trim().slice(0, 1000),
        options: input.options.map((o) => o.trim().slice(0, 300)),
        points: Math.max(1, Math.min(100, input.points)),
        order: Math.max(0, input.order),
        sealedKey,
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(keyRef, {
        id: 'key',
        questionId,
        quizId: input.quizId,
        correctAnswer: input.correctAnswer,
        explanation: (input.explanation ?? '').trim().slice(0, 1000),
        createdBy: actorUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Perbarui questionCount di dokumen quiz terkait
      const quizRef = doc(db, 'quizzes', input.quizId);
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        const currentCount = Number(quizSnap.data().questionCount ?? 0);
        await updateDoc(quizRef, {
          questionCount: currentCount + 1,
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `questions/${questionId}`);
  }

  return {
    id: questionId,
    quizId: input.quizId,
    questionText: input.questionText.trim(),
    options: input.options,
    points: input.points,
    order: input.order,
    sealedKey,
    createdBy: actorUid,
    createdAt: now,
    updatedAt: now,
  };
}

export async function removeQuestion(questionId: string, quizId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'questions', questionId, 'answer_key', 'key'));
    await deleteDoc(doc(db, 'questions', questionId));
    const quizRef = doc(db, 'quizzes', quizId);
    const quizSnap = await getDoc(quizRef);
    if (quizSnap.exists()) {
      const currentCount = Number(quizSnap.data().questionCount ?? 0);
      await updateDoc(quizRef, {
        questionCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `questions/${questionId}`);
  }
}

export async function submitAndGradeQuiz(params: {
  quiz: Quiz;
  questions: PublicQuestion[];
  answers: Record<string, number | null>;
  durationSeconds: number;
  studentUid?: string;
  studentName?: string;
  studentClassLevel?: ClassLevel;
  currentTotalXp?: number;
}): Promise<QuizGradingResponse> {
  const response = await fetch('/api/quiz/grade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quizId: params.quiz.id,
      questions: params.questions.map((q) => ({ id: q.id, sealedKey: q.sealedKey })),
      answers: params.answers,
      currentTotalXp: params.currentTotalXp ?? 0,
    }),
  });

  if (!response.ok) {
    const errBody = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(errBody.error || 'Gagal menilai hasil quiz di server.');
  }

  const graded = (await response.json()) as QuizGradingResponse;

  // Jika pengguna login, simpan hasil quiz ke Firestore dan perbarui XP siswa
  if (params.studentUid) {
    const resultId = sanitizeDocumentId(`res-${params.quiz.id}-${params.studentUid}-${Date.now()}`);
    const resultRef = doc(db, 'quiz_results', resultId);
    try {
      await setDoc(resultRef, {
        id: resultId,
        quizId: params.quiz.id,
        quizTitle: params.quiz.title.slice(0, 200),
        quizOwnerUid: params.quiz.createdBy,
        studentUid: params.studentUid,
        studentName: (params.studentName || 'Siswa').slice(0, 120),
        classLevel: params.studentClassLevel ?? params.quiz.classLevel,
        score: graded.score,
        correctCount: graded.correctCount,
        wrongCount: graded.wrongCount,
        totalQuestions: graded.totalQuestions,
        percentage: graded.percentage,
        durationSeconds: Math.max(0, Math.round(params.durationSeconds)),
        xpEarned: graded.xpEarned,
        earnedBadges: graded.earnedBadges,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      const studentRef = doc(db, 'students', params.studentUid);
      const studentSnap = await getDoc(studentRef);
      if (studentSnap.exists()) {
        const s = studentSnap.data();
        const prevCompleted = Number(s.completedQuizzes ?? 0);
        const prevXp = Number(s.xp ?? 0);
        const prevHighest = Number(s.highestScore ?? 0);
        const prevAverage = Number(s.averageScore ?? 0);
        const prevBadges = Array.isArray(s.badges) ? s.badges.map(String) : [];

        const newCompleted = prevCompleted + 1;
        const newXp = prevXp + graded.xpEarned;
        const newHighest = Math.max(prevHighest, graded.score);
        const newAverage = Math.round((prevAverage * prevCompleted + graded.score) / newCompleted);
        const updatedBadges = computeEligibleBadges({
          totalXp: newXp,
          latestScore: graded.score,
          completedQuizzesIncrement: newCompleted,
          existingBadges: prevBadges,
        });

        await updateDoc(studentRef, {
          xp: newXp,
          completedQuizzes: newCompleted,
          highestScore: newHighest,
          averageScore: newAverage,
          badges: updatedBadges,
          updatedAt: serverTimestamp(),
        });
      }

      // Tambah participantCount pada dokumen quiz di Firestore jika bukan data contoh lokal saja
      const quizRef = doc(db, 'quizzes', params.quiz.id);
      const quizSnap = await getDoc(quizRef);
      if (quizSnap.exists()) {
        await updateDoc(quizRef, {
          participantCount: Number(quizSnap.data().participantCount ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `quiz_results/${resultId}`);
    }
  }

  return graded;
}

export async function fetchQuizResultsForStudent(studentUid: string): Promise<QuizResultRecord[]> {
  try {
    const q = query(collection(db, 'quiz_results'), where('studentUid', '==', studentUid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapQuizResult(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'quiz_results');
  }
}

export async function fetchQuizResultsForTeacherOrAdmin(
  uid: string,
  role: 'guru' | 'admin'
): Promise<QuizResultRecord[]> {
  try {
    const q =
      role === 'admin'
        ? query(collection(db, 'quiz_results'))
        : query(collection(db, 'quiz_results'), where('quizOwnerUid', '==', uid));
    const snap = await getDocs(q);
    return snap.docs
      .map((d) => mapQuizResult(d.id, d.data()))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'quiz_results');
  }
}

function mapQuizResult(id: string, data: Record<string, unknown>): QuizResultRecord {
  const now = new Date().toISOString();
  const c = data.createdAt as { toDate?: () => Date } | undefined;
  const u = data.updatedAt as { toDate?: () => Date } | undefined;
  return {
    id,
    quizId: String(data.quizId ?? ''),
    quizTitle: String(data.quizTitle ?? ''),
    quizOwnerUid: data.quizOwnerUid ? String(data.quizOwnerUid) : undefined,
    studentUid: String(data.studentUid ?? ''),
    studentName: String(data.studentName ?? ''),
    classLevel: (data.classLevel as ClassLevel) ?? 'V',
    score: Number(data.score ?? 0),
    correctCount: Number(data.correctCount ?? 0),
    wrongCount: Number(data.wrongCount ?? 0),
    totalQuestions: Number(data.totalQuestions ?? 0),
    percentage: Number(data.percentage ?? 0),
    durationSeconds: Number(data.durationSeconds ?? 0),
    xpEarned: Number(data.xpEarned ?? 0),
    earnedBadges: Array.isArray(data.earnedBadges) ? data.earnedBadges.map(String) : [],
    createdAt: c?.toDate ? c.toDate().toISOString() : now,
    updatedAt: u?.toDate ? u.toDate().toISOString() : now,
  };
}
