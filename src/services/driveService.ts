import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth, GOOGLE_CLIENT_ID } from '../firebase/config';
import { DriveFileItem, DriveUserInfo } from '../types';
import { mapGoogleDriveErrorToMessage } from '../utils/errorMessages';

// Scope seminimal mungkin sesuai prinsip Least Privilege: hanya file yang dibuat/dibuka melalui aplikasi
export const GOOGLE_DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

// Token hanya disimpan di memori JavaScript (TIDAK PERNAH di localStorage atau sessionStorage)
let inMemoryDriveToken: string | null = null;
let inMemoryTokenExpiresAt = 0;

interface TokenClientResponse {
  access_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (resp: TokenClientResponse) => void;
            error_callback?: (err: { type?: string; message?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
          revoke?: (token: string, done?: () => void) => void;
        };
      };
    };
  }
}

export function getInMemoryDriveToken(): string | null {
  if (!inMemoryDriveToken) return null;
  if (inMemoryTokenExpiresAt > 0 && Date.now() >= inMemoryTokenExpiresAt) {
    inMemoryDriveToken = null;
    inMemoryTokenExpiresAt = 0;
    return null;
  }
  return inMemoryDriveToken;
}

export function clearDriveToken(): void {
  const prev = inMemoryDriveToken;
  inMemoryDriveToken = null;
  inMemoryTokenExpiresAt = 0;
  if (prev && window.google?.accounts?.oauth2?.revoke) {
    try {
      window.google.accounts.oauth2.revoke(prev);
    } catch {
      // Abaikan jika skrip GIS belum termuat
    }
  }
}

export async function connectGoogleDrive(): Promise<{
  accessToken: string;
  profile: DriveUserInfo;
}> {
  if (!GOOGLE_CLIENT_ID) {
    throw new Error(
      'Konfigurasi VITE_GOOGLE_CLIENT_ID belum tersedia. Tambahkan Client ID Google OAuth pada environment aplikasi.'
    );
  }

  let token: string | null = null;

  // 1. Utamakan Google Identity Services (GIS) Token Client
  if (window.google?.accounts?.oauth2?.initTokenClient) {
    token = await new Promise<string>((resolve, reject) => {
      try {
        const client = window.google!.accounts!.oauth2!.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: `${GOOGLE_DRIVE_SCOPE} openid email profile`,
          callback: (resp) => {
            if (resp.error) {
              reject(new Error(resp.error_description || resp.error));
              return;
            }
            if (!resp.access_token) {
              reject(new Error('access_denied'));
              return;
            }
            inMemoryDriveToken = resp.access_token;
            inMemoryTokenExpiresAt = Date.now() + (Number(resp.expires_in ?? 3500) - 60) * 1000;
            resolve(resp.access_token);
          },
          error_callback: (err) => {
            reject(new Error(err?.type || err?.message || 'access_denied'));
          },
        });
        client.requestAccessToken({ prompt: 'consent' });
      } catch (err) {
        reject(err);
      }
    });
  } else {
    // 2. Fallback resmi menggunakan Firebase GoogleAuthProvider dengan scope drive.file
    const provider = new GoogleAuthProvider();
    provider.addScope(GOOGLE_DRIVE_SCOPE);
    provider.setCustomParameters({ prompt: 'consent select_account' });
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Tidak berhasil memperoleh token akses Google Drive.');
    }
    token = credential.accessToken;
    inMemoryDriveToken = token;
    inMemoryTokenExpiresAt = Date.now() + 3300 * 1000;
  }

  const profile = await fetchGoogleUserProfile(token);
  return { accessToken: token, profile };
}

export async function fetchGoogleUserProfile(accessToken: string): Promise<DriveUserInfo> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const currentUser = auth.currentUser;
    if (currentUser) {
      return {
        name: currentUser.displayName || 'Pengguna Google',
        email: currentUser.email || '',
        picture: currentUser.photoURL || undefined,
      };
    }
    throw new Error(mapGoogleDriveErrorToMessage(await res.text(), res.status));
  }
  const data = (await res.json()) as { name?: string; email?: string; picture?: string };
  return {
    name: data.name || 'Pengguna Google',
    email: data.email || '',
    picture: data.picture,
  };
}

export async function listDriveFiles(accessToken: string, searchQuery = ''): Promise<DriveFileItem[]> {
  const params = new URLSearchParams({
    fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink)',
    orderBy: 'modifiedTime desc',
    pageSize: '30',
  });

  const qParts = ['trashed = false'];
  if (searchQuery.trim()) {
    const escaped = searchQuery.trim().replace(/'/g, "\\'");
    qParts.push(`name contains '${escaped}'`);
  }
  params.set('q', qParts.join(' and '));

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) {
      clearDriveToken();
    }
    throw new Error(mapGoogleDriveErrorToMessage(text, res.status));
  }

  const data = (await res.json()) as { files?: DriveFileItem[] };
  return data.files ?? [];
}

export async function createDriveNoteFile(
  accessToken: string,
  params: { title: string; content: string }
): Promise<DriveFileItem> {
  const metadata = {
    name: params.title.trim().endsWith('.txt') ? params.title.trim() : `${params.title.trim()}.txt`,
    mimeType: 'text/plain',
    description: 'Catatan pembelajaran Pendidikan Pancasila dari WEB QUIZIZZ',
  };

  const boundary = 'web_quizizz_drive_boundary';
  const body =
    `--${boundary}\r\n` +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    'Content-Type: text/plain; charset=UTF-8\r\n\r\n' +
    `${params.content}\r\n` +
    `--${boundary}--`;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,size,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) clearDriveToken();
    throw new Error(mapGoogleDriveErrorToMessage(text, res.status));
  }

  return (await res.json()) as DriveFileItem;
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401) clearDriveToken();
    throw new Error(mapGoogleDriveErrorToMessage(text, res.status));
  }
}
