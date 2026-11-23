import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { AppUser, ClassLevel, StudentProfile } from '../types';

const BOOTSTRAPPED_ADMIN_EMAIL = 'rdwanwannn@gmail.com';

export async function ensureUserDocuments(
  firebaseUser: User,
  overrides?: { name?: string; classLevel?: ClassLevel }
): Promise<{ user: AppUser; student: StudentProfile | null }> {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const nowIso = new Date().toISOString();

  let existingUser: AppUser | null = null;
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      existingUser = {
        id: String(data.id ?? firebaseUser.uid),
        uid: String(data.uid ?? firebaseUser.uid),
        name: String(data.name ?? firebaseUser.displayName ?? 'Pengguna'),
        email: String(data.email ?? firebaseUser.email ?? ''),
        role: (data.role as AppUser['role']) ?? 'siswa',
        photoURL: data.photoURL ? String(data.photoURL) : firebaseUser.photoURL ?? undefined,
        classLevel: (data.classLevel as AppUser['classLevel']) ?? 'V',
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : nowIso,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : nowIso,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
  }

  if (!existingUser) {
    const isAdminEmail =
      firebaseUser.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL && firebaseUser.emailVerified;
    const assignedRole: AppUser['role'] = isAdminEmail ? 'admin' : 'siswa';
    const displayName =
      overrides?.name?.trim() ||
      firebaseUser.displayName?.trim() ||
      firebaseUser.email?.split('@')[0] ||
      'Siswa Pancasila';
    const classLevel = overrides?.classLevel ?? 'V';

    const payload: Record<string, unknown> = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: displayName.slice(0, 120),
      email: (firebaseUser.email ?? '').slice(0, 160),
      role: assignedRole,
      classLevel,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    if (firebaseUser.photoURL) {
      payload.photoURL = firebaseUser.photoURL.slice(0, 500);
    }

    try {
      await setDoc(userRef, payload);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${firebaseUser.uid}`);
    }

    existingUser = {
      id: firebaseUser.uid,
      uid: firebaseUser.uid,
      name: displayName,
      email: firebaseUser.email ?? '',
      role: assignedRole,
      photoURL: firebaseUser.photoURL ?? undefined,
      classLevel,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
  }

  // Pastikan profil siswa di /students/{uid} tersedia jika berperan sebagai siswa
  const studentRef = doc(db, 'students', firebaseUser.uid);
  let studentProfile: StudentProfile | null = null;
  try {
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      const s = studentSnap.data();
      studentProfile = {
        id: String(s.id ?? firebaseUser.uid),
        uid: String(s.uid ?? firebaseUser.uid),
        name: String(s.name ?? existingUser.name),
        classLevel: (s.classLevel as ClassLevel) ?? 'V',
        xp: Number(s.xp ?? 0),
        completedQuizzes: Number(s.completedQuizzes ?? 0),
        highestScore: Number(s.highestScore ?? 0),
        averageScore: Number(s.averageScore ?? 0),
        badges: Array.isArray(s.badges) ? s.badges.map(String) : [],
        createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : nowIso,
        updatedAt: s.updatedAt?.toDate ? s.updatedAt.toDate().toISOString() : nowIso,
      };
    } else if (existingUser.role === 'siswa') {
      const targetClass: ClassLevel =
        existingUser.classLevel && existingUser.classLevel !== 'Umum'
          ? existingUser.classLevel
          : 'V';
      await setDoc(studentRef, {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: existingUser.name.slice(0, 120),
        classLevel: targetClass,
        xp: 0,
        completedQuizzes: 0,
        highestScore: 0,
        averageScore: 0,
        badges: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      studentProfile = {
        id: firebaseUser.uid,
        uid: firebaseUser.uid,
        name: existingUser.name,
        classLevel: targetClass,
        xp: 0,
        completedQuizzes: 0,
        highestScore: 0,
        averageScore: 0,
        badges: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `students/${firebaseUser.uid}`);
  }

  return { user: existingUser, student: studentProfile };
}

export async function loginWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function registerWithEmail(params: {
  name: string;
  email: string;
  password: string;
  classLevel: ClassLevel;
}): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    auth,
    params.email.trim(),
    params.password
  );
  await updateProfile(credential.user, { displayName: params.name.trim() });
  try {
    await sendEmailVerification(credential.user);
  } catch {
    // Email verifikasi opsional jika kuota email terbatas
  }
  await ensureUserDocuments(credential.user, {
    name: params.name.trim(),
    classLevel: params.classLevel,
  });
  return credential.user;
}

export async function loginWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  await ensureUserDocuments(result.user);
  return result.user;
}

export async function updateOwnProfile(
  uid: string,
  updates: { name: string; classLevel: ClassLevel }
): Promise<void> {
  const userRef = doc(db, 'users', uid);
  const studentRef = doc(db, 'students', uid);
  try {
    await updateDoc(userRef, {
      name: updates.name.trim().slice(0, 120),
      classLevel: updates.classLevel,
      updatedAt: serverTimestamp(),
    });
    const studentSnap = await getDoc(studentRef);
    if (studentSnap.exists()) {
      await updateDoc(studentRef, {
        name: updates.name.trim().slice(0, 120),
        classLevel: updates.classLevel,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
  }
}

export async function logoutAccount(): Promise<void> {
  await signOut(auth);
}
