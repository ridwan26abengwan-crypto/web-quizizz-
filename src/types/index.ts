export type UserRole = 'siswa' | 'guru' | 'admin';

export type ClassLevel = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI';

export type BookSemester = 'Ganjil' | 'Genap' | 'Tahunan';

export type QuizDifficulty = 'Mudah' | 'Sedang' | 'Sulit';

export interface AppUser {
  id: string;
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  photoURL?: string;
  classLevel?: ClassLevel | 'Umum';
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  id: string;
  uid: string;
  name: string;
  classLevel: ClassLevel;
  xp: number;
  completedQuizzes: number;
  highestScore: number;
  averageScore: number;
  badges: string[];
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeacherProfile {
  id: string;
  uid: string;
  name: string;
  subject: string;
  school?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DigitalBook {
  id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  curriculum: string;
  semester: BookSemester;
  source: string;
  url: string;
  thumbnail?: string;
  description: string;
  isActive: boolean;
  isSample?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  classLevel: ClassLevel;
  durationMinutes: number;
  difficulty: QuizDifficulty;
  questionCount: number;
  participantCount: number;
  isActive: boolean;
  isSample?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublicQuestion {
  id: string;
  quizId: string;
  questionText: string;
  options: [string, string, string, string];
  points: number;
  order: number;
  sealedKey?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AnswerKeyRecord {
  id: string;
  questionId: string;
  quizId: string;
  correctAnswer: number;
  explanation?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizGradeBreakdown {
  questionId: string;
  selectedOption: number | null;
  correctAnswer: number;
  isCorrect: boolean;
  pointsEarned: number;
  explanation?: string;
}

export interface QuizGradingResponse {
  quizId: string;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  percentage: number;
  xpEarned: number;
  earnedBadges: string[];
  breakdown: QuizGradeBreakdown[];
}

export interface QuizResultRecord {
  id: string;
  quizId: string;
  quizTitle: string;
  quizOwnerUid?: string;
  studentUid: string;
  studentName: string;
  classLevel: ClassLevel;
  score: number;
  correctCount: number;
  wrongCount: number;
  totalQuestions: number;
  percentage: number;
  durationSeconds: number;
  xpEarned: number;
  earnedBadges: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AchievementBadge {
  id: string;
  title: string;
  description: string;
  criteria: string;
  minXp: number;
  minScore: number;
  iconName: string;
  isSample?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
}

export interface DriveUserInfo {
  name: string;
  email: string;
  picture?: string;
}

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}
