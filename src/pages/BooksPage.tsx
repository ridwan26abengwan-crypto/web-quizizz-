import { useEffect, useMemo, useState } from 'react';
import { BookOpen, Search } from 'lucide-react';
import { BookCard } from '../components/BookCard';
import { SkeletonCard } from '../components/SkeletonCard';
import { fetchDigitalBooks } from '../services/bookService';
import { DigitalBook } from '../types';

const CLASS_OPTIONS = ['Semua', 'I', 'II', 'III', 'IV', 'V', 'VI'] as const;
const SEMESTER_OPTIONS = ['Semua', 'Ganjil', 'Genap', 'Tahunan'] as const;

export function BooksPage() {
  const [books, setBooks] = useState<DigitalBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState<string>('Semua');
  const [semesterFilter, setSemesterFilter] = useState<string>('Semua');
  const [subjectFilter, setSubjectFilter] = useState<string>('Semua');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      const data = await fetchDigitalBooks(false);
      if (active) {
        setBooks(data);
        setIsLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const subjectOptions = useMemo(() => {
    const subjects = new Set<string>(['Pendidikan Pancasila']);
    books.forEach((b) => subjects.add(b.subject));
    return ['Semua', ...Array.from(subjects)];
  }, [books]);

  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.subject.toLowerCase().includes(q) ||
        book.curriculum.toLowerCase().includes(q) ||
        book.description.toLowerCase().includes(q);
      const matchesClass = classFilter === 'Semua' || book.classLevel === classFilter;
      const matchesSemester = semesterFilter === 'Semua' || book.semester === semesterFilter;
      const matchesSubject = subjectFilter === 'Semua' || book.subject === subjectFilter;
      return matchesSearch && matchesClass && matchesSemester && matchesSubject;
    });
  }, [books, searchQuery, classFilter, semesterFilter, subjectFilter]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end dark:border-slate-800">
        <div>
          <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
            Pendidikan Pancasila · Jenjang SD/MI
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Buku Digital
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Baca buku siswa resmi langsung melalui tautan sumber terpercaya. Setiap buku dibuka aman pada tab baru browser Anda.
          </p>
        </div>
        <p className="tabular-nums text-sm font-medium text-slate-500 dark:text-slate-400">
          Menampilkan {filteredBooks.length} buku aktif
        </p>
      </div>

      {/* Filter & Pencarian */}
      <div className="mt-6 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative">
          <label htmlFor="book-search" className="sr-only">
            Cari buku Pendidikan Pancasila
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="book-search"
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari buku Pendidikan Pancasila..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label htmlFor="filter-class" className="sr-only">
            Filter Kelas
          </label>
          <select
            id="filter-class"
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {CLASS_OPTIONS.map((cls) => (
              <option key={cls} value={cls}>
                {cls === 'Semua' ? 'Semua Kelas' : `Kelas ${cls}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-semester" className="sr-only">
            Filter Semester
          </label>
          <select
            id="filter-semester"
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {SEMESTER_OPTIONS.map((sem) => (
              <option key={sem} value={sem}>
                {sem === 'Semua' ? 'Semua Semester' : `Semester ${sem}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="filter-subject" className="sr-only">
            Filter Mata Pelajaran
          </label>
          <select
            id="filter-subject"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          >
            {subjectOptions.map((subj) => (
              <option key={subj} value={subj}>
                {subj === 'Semua' ? 'Semua Mata Pelajaran' : subj}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daftar Buku */}
      {isLoading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <BookOpen className="mx-auto h-10 w-10 text-slate-400" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            Buku belum ditemukan
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Coba ubah kata kunci pencarian atau pilih filter kelas lainnya.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setClassFilter('Semua');
              setSemesterFilter('Semua');
              setSubjectFilter('Semua');
            }}
            className="mt-5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Reset Filter
          </button>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      )}
    </div>
  );
}
