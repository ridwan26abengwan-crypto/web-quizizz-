export function mapFirebaseErrorToMessage(error: unknown): string {
  const rawCode =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { code?: string }).code ?? '')
      : '';
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const combined = `${rawCode} ${rawMessage}`.toLowerCase();

  // Penanganan khusus auth/unauthorized-domain (HANYA untuk error ini)
  if (rawCode === 'auth/unauthorized-domain' || combined.includes('auth/unauthorized-domain')) {
    return 'Domain aplikasi belum diizinkan oleh Firebase Authentication. Silakan tambahkan domain aplikasi pada Firebase Console → Authentication → Authorized domains.';
  }

  if (rawCode === 'auth/popup-closed-by-user' || combined.includes('popup-closed-by-user')) {
    return 'Jendela masuk Google ditutup sebelum proses selesai. Silakan coba kembali.';
  }

  if (rawCode === 'auth/popup-blocked' || combined.includes('popup-blocked')) {
    return 'Popup login diblokir oleh browser Anda. Izinkan popup untuk situs ini lalu coba kembali.';
  }

  if (rawCode === 'auth/network-request-failed' || combined.includes('network-request-failed')) {
    return 'Koneksi internet terganggu. Periksa jaringan Anda lalu coba kembali.';
  }

  if (rawCode === 'auth/operation-not-allowed' || combined.includes('operation-not-allowed')) {
    return 'Metode masuk Email & Kata Sandi belum diaktifkan. Aktifkan pada Firebase Console → Authentication → Sign-in method.';
  }

  if (
    rawCode === 'auth/invalid-credential' ||
    rawCode === 'auth/wrong-password' ||
    rawCode === 'auth/user-not-found'
  ) {
    return 'Email atau kata sandi yang Anda masukkan tidak sesuai.';
  }

  if (rawCode === 'auth/email-already-in-use') {
    return 'Email ini sudah terdaftar. Silakan masuk menggunakan akun yang sudah ada.';
  }

  if (rawCode === 'auth/weak-password') {
    return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
  }

  if (rawCode === 'auth/invalid-email') {
    return 'Format alamat email tidak valid.';
  }

  if (
    rawCode === 'permission-denied' ||
    combined.includes('permission-denied') ||
    combined.includes('missing or insufficient permissions')
  ) {
    return 'Akses ditolak. Akun Anda tidak memiliki izin untuk membaca atau mengubah data ini.';
  }

  return 'Terjadi kendala saat memproses permintaan. Silakan coba beberapa saat lagi.';
}

export function mapGoogleDriveErrorToMessage(error: unknown, statusCode?: number): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null
        ? JSON.stringify(error)
        : String(error ?? '');
  const lower = raw.toLowerCase();

  if (statusCode === 401 || lower.includes('invalid_token') || lower.includes('token expired') || lower.includes('unauthenticated')) {
    return 'Sesi Google Drive telah berakhir. Silakan klik "Sign in with Google" untuk masuk kembali.';
  }

  if (lower.includes('access_denied')) {
    return 'Izin akses ke Google Drive tidak disetujui. Aplikasi membutuhkan izin file agar dapat menampilkan catatan Anda.';
  }

  if (lower.includes('accessnotconfigured') || lower.includes('api has not been used') || lower.includes('service_disabled')) {
    return 'Google Drive API belum diaktifkan pada proyek Google Cloud. Aktifkan Google Drive API terlebih dahulu.';
  }

  if (lower.includes('invalid_client') || lower.includes('origin_mismatch') || lower.includes('redirect_uri_mismatch')) {
    return 'Konfigurasi Google Client ID tidak cocok atau origin domain belum terdaftar pada Google Cloud Console.';
  }

  if (statusCode === 403 || lower.includes('insufficient') || lower.includes('forbidden')) {
    return 'Izin akses Google Drive tidak mencukupi untuk melakukan operasi ini.';
  }

  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network')) {
    return 'Gagal terhubung ke server Google Drive. Periksa koneksi internet Anda.';
  }

  return 'Tidak dapat memuat data dari Google Drive saat ini. Silakan coba muat ulang.';
}
