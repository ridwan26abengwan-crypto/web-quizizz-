import React, { useState } from 'react';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { DigitalBook } from '../types';

interface BookCardProps {
  book: DigitalBook;
}

export function BookCard({ book }: BookCardProps) {
  const { showToast } = useToast();
  const [imageError, setImageError] = useState(false);

  const handleOpenBook = () => {
    showToast('info', 'Buku dibuka pada tab baru', book.title);
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      {/* Cover Buku */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gradient-to-br from-blue-50 via-sky-50 to-slate-100 p-3 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900">
        {book.thumbnail && !imageError ? (
          <img
            src={book.thumbnail}
            alt={`Sampul ${book.title}`}
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            className="mx-auto h-full w-auto max-w-full rounded-lg object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
              <BookOpen className="h-7 w-7" aria-hidden="true" />
            </div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {book.subject}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Kelas {book.classLevel} · SD/MI
            </p>
          </div>
        )}
      </div>

      {/* Konten Buku */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-white">
          {book.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-blue-700 dark:bg-blue-950/70 dark:text-sky-300">
            {book.subject.toUpperCase()}
          </span>
          <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold tracking-wide text-sky-700 dark:bg-sky-950/70 dark:text-sky-300">
            KELAS {book.classLevel}
          </span>
          {book.isSample ? (
            <span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              DATA CONTOH
            </span>
          ) : null}
        </div>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {book.description}
        </p>

        <dl className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-500 dark:text-slate-400">Kurikulum</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{book.curriculum}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-500 dark:text-slate-400">Semester</dt>
            <dd className="font-semibold text-slate-800 dark:text-slate-200">{book.semester}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="font-medium text-slate-500 dark:text-slate-400">Sumber</dt>
            <dd className="truncate font-semibold text-slate-800 dark:text-slate-200">{book.source}</dd>
          </div>
        </dl>

        {/* Tombol Baca Buku (Tab Baru dengan keamanan noopener noreferrer) */}
        <div className="mt-5 flex flex-col gap-2 pt-1">
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenBook}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <span>📖 Baca Buku</span>
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
          </a>
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleOpenBook}
            className="inline-flex min-h-[40px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            <span>Buka Buku di Tab Baru</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </article>
  );
}
