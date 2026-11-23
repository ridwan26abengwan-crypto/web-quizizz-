import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { SAMPLE_ACHIEVEMENTS, SAMPLE_LEADERBOARD } from '../data/sampleData';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import {
  AchievementBadge,
  AppUser,
  ClassLevel,
  StudentProfile,
  TeacherProfile,
  UserRole,
} from '../types';
import { sanitizeDocumentId } from '../utils/validators';

export async function fetchLeaderboard(): Promise<StudentProfile[]> {
  try {
    const q = query(collection(db, 'students'), orderBy('xp', 'desc'));
    const snap = await getDocs(q);
    const liveStudents: StudentProfile[] = snap.docs.map((d) => {
      const s = d.data();
      const now = new Date().toISOString();
      return {
        id: d.id,
        uid: String(s.uid ?? d.id),
        name: String(s.name ?? 'Siswa'),
        classLevel: (s.classLevel as ClassLevel) ?? 'V',
        xp: Number(s.xp ?? 0),
        completedQuizzes: Number(s.completedQuizzes ?? 0),
        highestScore: Number(s.highestScore ?? 0),
        averageScore: Number(s.averageScore ?? 0),
        badges: Array.isArray(s.badges) ? s.badges.map(String) : [],
        isSample: false,
        createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : now,
        updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate().toISOString() : now,
      };
    });

    if (liveStudents.length > 0) {
      return liveStudents.sort((a, b) => b.xp - a.xp);
    }
    return SAMPLE_LEADERBOARD;
  } catch {
    return SAMPLE_LEADERBOARD;
  }
}

export async function fetchAchievementsCatalog(): Promise<AchievementBadge[]> {
  try {
    const snap = await getDocs(collection(db, 'achievements'));
    const items = snap.docs.map((d) => {
      const a = d.data();
      const now = new Date().toISOString();
      return {
        id: d.id,
        title: String(a.title ?? ''),
        description: String(a.description ?? ''),
        criteria: String(a.criteria ?? ''),
        minXp: Number(a.minXp ?? 0),
        minScore: Number(a.minScore ?? 0),
        iconName: String(a.iconName ?? 'Award'),
        isSample: Boolean(a.isSample ?? false),
        createdAt: a.createdAt?.toDate ? a.createdAt.toDate().toISOString() : now,
        updatedAt: a.updatedAt?.toDate ? a.updatedAt.toDate().toISOString() : now,
      };
    });
    return items.length > 0 ? items : SAMPLE_ACHIEVEMENTS;
  } catch {
    return SAMPLE_ACHIEVEMENTS;
  }
}

export async function fetchAllUsersForAdmin(): Promise<AppUser[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => {
      const u = d.data();
      const now = new Date().toISOString();
      return {
        id: d.id,
        uid: String(u.uid ?? d.id),
        name: String(u.name ?? ''),
        email: String(u.email ?? ''),
        role: (u.role as UserRole) ?? 'siswa',
        photoURL: u.photoURL ? String(u.photoURL) : undefined,
        classLevel: (u.classLevel as AppUser['classLevel']) ?? 'V',
        createdAt: u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : now,
        updatedAt: u.updatedAt?.toDate ? u.updatedAt.toDate().toISOString() : now,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'users');
  }
}

export async function updateUserRoleByAdmin(uid: string, role: UserRole): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid), {
      role,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function fetchTeachers(): Promise<TeacherProfile[]> {
  try {
    const snap = await getDocs(collection(db, 'teachers'));
    return snap.docs.map((d) => {
      const t = d.data();
      const now = new Date().toISOString();
      return {
        id: d.id,
        uid: String(t.uid ?? d.id),
        name: String(t.name ?? ''),
        subject: String(t.subject ?? 'Pendidikan Pancasila'),
        school: t.school ? String(t.school) : undefined,
        isActive: Boolean(t.isActive ?? true),
        createdAt: t.createdAt?.toDate ? t.createdAt.toDate().toISOString() : now,
        updatedAt: t.updatedAt?.toDate ? t.updatedAt.toDate().toISOString() : now,
      };
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, 'teachers');
  }
}

export async function saveTeacherProfile(input: {
  id?: string;
  uid: string;
  name: string;
  subject: string;
  school?: string;
  isActive: boolean;
}): Promise<void> {
  const teacherId = input.id ? sanitizeDocumentId(input.id) : sanitizeDocumentId(input.uid || input.name);
  const ref = doc(db, 'teachers', teacherId);
  try {
    if (input.id) {
      await updateDoc(ref, {
        name: input.name.trim().slice(0, 120),
        subject: input.subject.trim().slice(0, 100),
        school: (input.school ?? '').trim().slice(0, 160),
        isActive: input.isActive,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: teacherId,
        uid: input.uid.trim() || teacherId,
        name: input.name.trim().slice(0, 120),
        subject: input.subject.trim().slice(0, 100),
        school: (input.school ?? '').trim().slice(0, 160),
        isActive: input.isActive,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `teachers/${teacherId}`);
  }
}

export async function deleteTeacherProfile(teacherId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'teachers', teacherId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `teachers/${teacherId}`);
  }
}
