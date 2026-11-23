import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  FilePlus2,
  FileText,
  FolderOpen,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import { ConfirmModal } from '../components/ConfirmModal';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  clearDriveToken,
  connectGoogleDrive,
  createDriveNoteFile,
  deleteDriveFile,
  getInMemoryDriveToken,
  listDriveFiles,
} from '../services/driveService';
import { DriveFileItem, DriveUserInfo } from '../types';
import { mapGoogleDriveErrorToMessage } from '../utils/errorMessages';
import { formatBytes } from '../utils/validators';

export function GoogleDrivePage() {
  const { appUser, studentProfile } = useAuth();
  const { showToast } = useToast();

  const [accessToken, setAccessToken] = useState<string | null>(() => getInMemoryDriveToken());
  const [profile, setProfile] = useState<DriveUserInfo | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Buat catatan belajar
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  // Konfirmasi hapus file
  const [deleteTarget, setDeleteTarget] = useState<DriveFileItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadFiles = useCallback(
    async (tokenToUse: string, query = '') => {
      setIsLoadingFiles(true);
      setErrorMessage(null);
      try {
        const list = await listDriveFiles(tokenToUse, query);
        setFiles(list);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : mapGoogleDriveErrorToMessage(err);
        setErrorMessage(msg);
        if (!getInMemoryDriveToken()) {
          setAccessToken(null);
        }
      } finally {
        setIsLoadingFiles(false);
      }
    },
    []
  );

  useEffect(() => {
    const existing = getInMemoryDriveToken();
    if (existing) {
      void loadFiles(existing);
    }
  }, [loadFiles]);

  const handleSignIn = async () => {
    setIsConnecting(true);
    setErrorMessage(null);
    try {
      const res = await connectGoogleDrive();
      setAccessToken(res.accessToken);
      setProfile(res.profile);
      showToast('success', 'Google Drive terhubung', `Masuk sebagai ${res.profile.email}`);
      await loadFiles(res.accessToken);
    } catch (err) {
      const msg = mapGoogleDriveErrorToMessage(err);
      setErrorMessage(msg);
      showToast('error', 'Koneksi Google Drive gagal', msg);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearDriveToken();
    setAccessToken(null);
    setProfile(null);
    setFiles([]);
    setErrorMessage(null);
    showToast('info', 'Koneksi Google Drive diputuskan');
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;
    if (!noteTitle.trim() || !noteContent.trim()) {
      showToast('warning', 'Lengkapi catatan', 'Judul dan isi catatan wajib diisi.');
      return;
    }

    setIsSavingNote(true);
    try {
      const created = await createDriveNoteFile(accessToken, {
        title: noteTitle.trim(),
        content: noteContent.trim(),
      });
      setFiles((prev) => [created, ...prev]);
      setNoteTitle('');
      setNoteContent('');
      showToast('success', 'Catatan disimpan ke Google Drive', created.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : mapGoogleDriveErrorToMessage(err);
      setErrorMessage(msg);
      showToast('error', 'Gagal menyimpan catatan', msg);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleBackupReport = async () => {
    if (!accessToken) return;
    setIsSavingNote(true);
    try {
      const reportLines = [
        'RAPOR BELAJAR WEB QUIZIZZ — PENDIDIKAN PANCASILA',
        `Tanggal Cadangan: ${new Date().toLocaleString('id-ID')}`,
        `Nama: ${appUser?.name || profile?.name || 'Siswa'}`,
        `Kelas: ${studentProfile?.classLevel || appUser?.classLevel || 'V'}`,
        `Total XP: ${studentProfile?.xp ?? 0}`,
        `Quiz Selesai: ${studentProfile?.completedQuizzes ?? 0}`,
        `Nilai Tertinggi: ${studentProfile?.highestScore ?? 0}`,
        `Rata-rata Nilai: ${studentProfile?.averageScore ?? 0}`,
        `Lencana Prestasi: ${(studentProfile?.badges ?? []).join(', ') || 'Belum ada'}`,
      ].join('\n');

      const created = await createDriveNoteFile(accessToken, {
        title: `Rapor-WEB-QUIZIZZ-${new Date().toISOString().slice(0, 10)}.txt`,
        content: reportLines,
      });
      setFiles((prev) => [created, ...prev]);
      showToast('success', 'Rapor XP berhasil dicadangkan ke Google Drive', created.name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : mapGoogleDriveErrorToMessage(err);
      setErrorMessage(msg);
      showToast('error', 'Gagal mencadangkan rapor', msg);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(accessToken, deleteTarget.id);
      setFiles((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      showToast('success', 'File dihapus dari Google Drive', deleteTarget.name);
      setDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : mapGoogleDriveErrorToMessage(err);
      setErrorMessage(msg);
      showToast('error', 'Gagal menghapus file', msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="border-b border-slate-200 pb-6 dark:border-slate-800">
        <p className="text-sm font-semibold text-blue-600 dark:text-sky-400">
          Google Drive
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Ruang Penyimpanan & Catatan Google Drive
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          Simpan ringkasan bab Pendidikan Pancasila, cadangan rapor prestasi & XP, serta kelola dokumen belajar langsung dari Google Drive.
        </p>
      </div>

      {errorMessage ? (
        <div
          role="alert"
          className="mt-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-200"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <p>{errorMessage}</p>
        </div>
      ) : null}

      {!accessToken ? (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-sky-950/70 dark:text-sky-400">
            <FolderOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            Hubungkan Akun Google Anda
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Aplikasi hanya meminta izin minimal (akses khusus file belajar yang dibuat atau dibuka lewat WEB QUIZIZZ) demi menjaga privasi akun Anda.
          </p>
          <div className="mx-auto mt-6 max-w-xs">
            <GoogleSignInButton
              onClick={() => void handleSignIn()}
              disabled={isConnecting}
              label={isConnecting ? 'Menghubungkan...' : 'Sign in with Google'}
            />
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Profil Akun Google */}
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-4">
              {profile?.picture ? (
                <img
                  src={profile.picture}
                  alt={`Foto profil ${profile.name}`}
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                  {(profile?.name || 'G').charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {profile?.name || 'Pengguna Google'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {profile?.email || 'Terhubung ke Google Drive'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={isSavingNote}
                onClick={() => void handleBackupReport()}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <UploadCloud className="h-4 w-4" aria-hidden="true" />
                <span>Cadangkan Rapor XP</span>
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span>Putuskan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Form Simpan Catatan Baru */}
            <form
              onSubmit={handleCreateNote}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <FilePlus2 className="h-5 w-5 text-blue-600 dark:text-sky-400" aria-hidden="true" />
                <span>Simpan Catatan Bab</span>
              </h2>
              <div className="mt-4 space-y-3">
                <div>
                  <label
                    htmlFor="drive-note-title"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Judul Catatan
                  </label>
                  <input
                    id="drive-note-title"
                    type="text"
                    required
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Contoh: Ringkasan Bab 1 Pancasila"
                    className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label
                    htmlFor="drive-note-content"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Isi Ringkasan
                  </label>
                  <textarea
                    id="drive-note-content"
                    rows={5}
                    required
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Tulis poin penting materi Pendidikan Pancasila..."
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSavingNote}
                  className="min-h-[42px] w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSavingNote ? 'Menyimpan...' : 'Simpan ke Google Drive'}
                </button>
              </div>
            </form>

            {/* Daftar File Google Drive */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Daftar File Google Drive
                </h2>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-56">
                    <label htmlFor="drive-search" className="sr-only">
                      Cari file Google Drive
                    </label>
                    <Search
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                      aria-hidden="true"
                    />
                    <input
                      id="drive-search"
                      type="search"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        void loadFiles(accessToken, e.target.value);
                      }}
                      placeholder="Cari nama file..."
                      className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-xs text-slate-900 focus:border-blue-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadFiles(accessToken, searchQuery)}
                    disabled={isLoadingFiles}
                    aria-label="Muat ulang daftar file Google Drive"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${isLoadingFiles ? 'animate-spin' : ''}`}
                      aria-hidden="true"
                    />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {isLoadingFiles ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Memuat daftar file dari Google Drive...
                </div>
              ) : files.length === 0 ? (
                <div className="mt-4 rounded-xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-700">
                  <FileText className="mx-auto h-9 w-9 text-slate-400" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                    Belum ada file catatan yang tersimpan
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Buat catatan bab baru atau cadangkan rapor XP Anda untuk menyimpannya di Google Drive.
                  </p>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[560px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
                        <th className="py-3 pr-3 font-semibold">Nama File</th>
                        <th className="px-3 py-3 font-semibold">Tipe</th>
                        <th className="px-3 py-3 font-semibold">Tanggal</th>
                        <th className="px-3 py-3 font-semibold">Ukuran</th>
                        <th className="py-3 pl-3 text-right font-semibold">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {files.map((file) => (
                        <tr key={file.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 pr-3 font-semibold text-slate-900 dark:text-white">
                            {file.name}
                          </td>
                          <td className="px-3 py-3 text-slate-500 dark:text-slate-400">
                            {file.mimeType.split('.').pop()}
                          </td>
                          <td className="tabular-nums px-3 py-3 text-slate-500 dark:text-slate-400">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString('id-ID')
                              : '—'}
                          </td>
                          <td className="tabular-nums px-3 py-3 text-slate-500 dark:text-slate-400">
                            {formatBytes(file.size)}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            <div className="inline-flex items-center gap-2">
                              {file.webViewLink ? (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1.5 font-semibold text-blue-700 hover:bg-blue-100 dark:bg-sky-950 dark:text-sky-300"
                                >
                                  <span>Buka</span>
                                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                </a>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(file)}
                                aria-label={`Hapus file ${file.name}`}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-semibold text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Hapus File dari Google Drive?"
        description={`File "${deleteTarget?.name ?? ''}" akan dihapus dari Google Drive Anda. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Ya, Hapus File"
        cancelLabel="Batal"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
