import { QuizGradeBreakdown } from '../types';

export interface GradeableQuestionInput {
  id: string;
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export function evaluateQuizAnswers(
  questions: GradeableQuestionInput[],
  submittedAnswers: Record<string, number | null>,
  currentTotalXp = 0
): {
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  earnedBadges: string[];
  breakdown: QuizGradeBreakdown[];
} {
  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return {
      score: 0,
      correctCount: 0,
      wrongCount: 0,
      totalQuestions: 0,
      percentage: 0,
      xpEarned: 0,
      earnedBadges: [],
      breakdown: [],
    };
  }

  let earnedPoints = 0;
  let maxPoints = 0;
  let correctCount = 0;
  let wrongCount = 0;

  const breakdown: QuizGradeBreakdown[] = questions.map((q) => {
    const selected = submittedAnswers[q.id] ?? null;
    const isCorrect = selected !== null && selected === q.correctAnswer;
    const pts = Math.max(1, Number(q.points) || 20);
    maxPoints += pts;

    if (isCorrect) {
      earnedPoints += pts;
      correctCount += 1;
    } else {
      wrongCount += 1;
    }

    return {
      questionId: q.id,
      selectedOption: selected,
      correctAnswer: q.correctAnswer,
      isCorrect,
      pointsEarned: isCorrect ? pts : 0,
      explanation: q.explanation,
    };
  });

  const percentage = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  const score = percentage;

  // XP: 25 XP partisipasi + poin per jawaban benar + bonus 30 XP jika nilai >= 80
  const participationXp = 25;
  const accuracyXp = correctCount * 15;
  const masteryBonus = score === 100 ? 50 : score >= 80 ? 30 : 0;
  const xpEarned = participationXp + accuracyXp + masteryBonus;

  const projectedXp = currentTotalXp + xpEarned;
  const earnedBadges = computeEligibleBadges({
    totalXp: projectedXp,
    latestScore: score,
    completedQuizzesIncrement: 1,
  });

  return {
    score,
    correctCount,
    wrongCount,
    totalQuestions,
    percentage,
    xpEarned,
    earnedBadges,
    breakdown,
  };
}

export function computeEligibleBadges(params: {
  totalXp: number;
  latestScore: number;
  completedQuizzesIncrement?: number;
  existingBadges?: string[];
}): string[] {
  const badgeSet = new Set<string>(params.existingBadges ?? []);

  if (params.totalXp >= 20 || (params.completedQuizzesIncrement ?? 0) >= 1) {
    badgeSet.add('Pemula');
  }
  if (params.totalXp >= 250) {
    badgeSet.add('Rajin Belajar');
  }
  if (params.latestScore === 100) {
    badgeSet.add('Quiz Master');
  }
  if (params.totalXp >= 500 && params.latestScore >= 80) {
    badgeSet.add('Pancasila Hebat');
  }
  if (params.totalXp >= 1000 && params.latestScore >= 85) {
    badgeSet.add('Juara Kelas');
  }

  return Array.from(badgeSet);
}

export function formatDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatReadableDuration(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  if (mins === 0) return `${secs} detik`;
  if (secs === 0) return `${mins} menit`;
  return `${mins} menit ${secs} detik`;
}
