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
import { SAMPLE_BOOKS } from '../data/sampleData';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { DigitalBook } from '../types';
import { isValidExternalBookUrl, sanitizeDocumentId } from '../utils/validators';

function mapDocToBook(id: string, data: Record<string, unknown>): DigitalBook {
  const now = new Date().toISOString();
  const createdAtRaw = data.createdAt as { toDate?: () => Date } | undefined;
  const updatedAtRaw = data.updatedAt as { toDate?: () => Date } | undefined;

  return {
    id,
    title: String(data.title ?? ''),
    subject: String(data.subject ?? 'Pendidikan Pancasila'),
    classLevel: (data.classLevel as DigitalBook['classLevel']) ?? 'V',
    curriculum: String(data.curriculum ?? 'Kurikulum Merdeka'),
    semester: (data.semester as DigitalBook['semester']) ?? 'Tahunan',
    source: String(data.source ?? 'Sumber Resmi'),
    url: String(data.url ?? ''),
    thumbnail: data.thumbnail ? String(data.thumbnail) : undefined,
    description: String(data.description ?? ''),
    isActive: Boolean(data.isActive ?? true),
    isSample: Boolean(data.isSample ?? false),
    createdBy: data.createdBy ? String(data.createdBy) : undefined,
    createdAt: createdAtRaw?.toDate ? createdAtRaw.toDate().toISOString() : now,
    updatedAt: updatedAtRaw?.toDate ? updatedAtRaw.toDate().toISOString() : now,
  };
}

export async function fetchDigitalBooks(includeInactive = false): Promise<DigitalBook[]> {
  try {
    const q = query(collection(db, 'books'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const firestoreBooks = snap.docs.map((d) => mapDocToBook(d.id, d.data()));

    // Pastikan buku utama Pendidikan Pancasila Kelas V (https://online.fliphtml5.com/pjiut/yuzp/#p=2) selalu tersedia
    const hasMainBook = firestoreBooks.some((b) => b.id === 'ppkn-kelas-5');
    const merged = hasMainBook ? firestoreBooks : [...SAMPLE_BOOKS, ...firestoreBooks];

    return includeInactive ? merged : merged.filter((b) => b.isActive);
  } catch (err) {
    // Jika offline atau rules menolak saat belum siap, pastikan buku contoh utama tetap tampil dengan aman
    console.warn('Menggunakan katalog buku bawaan saat Firestore tidak terjangkau:', err);
    return includeInactive ? SAMPLE_BOOKS : SAMPLE_BOOKS.filter((b) => b.isActive);
  }
}

export async function saveDigitalBook(
  input: Omit<DigitalBook, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
  actorUid: string
): Promise<DigitalBook> {
  if (!isValidExternalBookUrl(input.url)) {
    throw new Error('URL buku tidak valid. Gunakan tautan https:// atau http:// yang sah.');
  }

  const bookId = input.id ? sanitizeDocumentId(input.id) : sanitizeDocumentId(input.title);
  const bookRef = doc(db, 'books', bookId);
  const now = new Date().toISOString();

  const payload: Record<string, unknown> = {
    id: bookId,
    title: input.title.trim().slice(0, 200),
    subject: input.subject.trim().slice(0, 100),
    classLevel: input.classLevel,
    curriculum: input.curriculum.trim().slice(0, 100),
    semester: input.semester,
    source: input.source.trim().slice(0, 120),
    url: input.url.trim().slice(0, 500),
    thumbnail: (input.thumbnail ?? '').trim().slice(0, 500),
    description: input.description.trim().slice(0, 1000),
    isActive: Boolean(input.isActive),
    isSample: Boolean(input.isSample ?? false),
    createdBy: actorUid,
    updatedAt: serverTimestamp(),
  };

  try {
    if (input.id) {
      await updateDoc(bookRef, {
        title: payload.title,
        subject: payload.subject,
        classLevel: payload.classLevel,
        curriculum: payload.curriculum,
        semester: payload.semester,
        source: payload.source,
        url: payload.url,
        thumbnail: payload.thumbnail,
        description: payload.description,
        isActive: payload.isActive,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(bookRef, {
        ...payload,
        createdAt: serverTimestamp(),
      });
    }
  } catch (err) {
    handleFirestoreError(err, input.id ? OperationType.UPDATE : OperationType.CREATE, `books/${bookId}`);
  }

  return {
    id: bookId,
    title: String(payload.title),
    subject: String(payload.subject),
    classLevel: input.classLevel,
    curriculum: String(payload.curriculum),
    semester: input.semester,
    source: String(payload.source),
    url: String(payload.url),
    thumbnail: String(payload.thumbnail) || undefined,
    description: String(payload.description),
    isActive: Boolean(payload.isActive),
    isSample: Boolean(payload.isSample),
    createdBy: actorUid,
    createdAt: now,
    updatedAt: now,
  };
}

export async function toggleBookActive(book: DigitalBook): Promise<void> {
  const bookRef = doc(db, 'books', book.id);
  try {
    await updateDoc(bookRef, {
      isActive: !book.isActive,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `books/${book.id}`);
  }
}

export async function removeDigitalBook(bookId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'books', bookId));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `books/${bookId}`);
  }
}
