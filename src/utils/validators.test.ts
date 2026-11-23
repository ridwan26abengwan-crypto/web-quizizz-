import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, isValidExternalBookUrl, sanitizeDocumentId } from './validators';
import { mapFirebaseErrorToMessage, mapGoogleDriveErrorToMessage } from './errorMessages';

test('isValidExternalBookUrl accepts valid FlipHTML5 URL and rejects fake/unsafe URLs', () => {
  assert.equal(isValidExternalBookUrl('https://online.fliphtml5.com/pjiut/yuzp/#p=2'), true);
  assert.equal(isValidExternalBookUrl('http://buku.kemdikbud.go.id/pancasila'), true);
  assert.equal(isValidExternalBookUrl('javascript:alert(1)'), false);
  assert.equal(isValidExternalBookUrl('https://example.com/fake'), false);
  assert.equal(isValidExternalBookUrl('not-a-url'), false);
});

test('sanitizeDocumentId creates Firestore-safe alphanumeric IDs', () => {
  assert.equal(sanitizeDocumentId('Buku Pancasila Kelas V!'), 'buku-pancasila-kelas-v');
  assert.match(sanitizeDocumentId('ppkn_kelas-5'), /^[a-zA-Z0-9_-]+$/);
});

test('formatBytes formats byte strings cleanly', () => {
  assert.equal(formatBytes('512'), '512 B');
  assert.equal(formatBytes('2048'), '2.0 KB');
  assert.equal(formatBytes(undefined), 'Dokumen Google');
});

test('mapFirebaseErrorToMessage returns exact unauthorized-domain message ONLY for that code', () => {
  const unauthMsg = mapFirebaseErrorToMessage({ code: 'auth/unauthorized-domain' });
  assert.equal(
    unauthMsg,
    'Domain aplikasi belum diizinkan oleh Firebase Authentication. Silakan tambahkan domain aplikasi pada Firebase Console → Authentication → Authorized domains.'
  );

  const popupMsg = mapFirebaseErrorToMessage({ code: 'auth/popup-closed-by-user' });
  assert.notEqual(popupMsg, unauthMsg);
  assert.ok(popupMsg.includes('ditutup'));

  const permMsg = mapFirebaseErrorToMessage({ code: 'permission-denied' });
  assert.ok(permMsg.includes('izin'));
});

test('mapGoogleDriveErrorToMessage maps token expiry and API disabled errors', () => {
  assert.ok(mapGoogleDriveErrorToMessage('token expired', 401).includes('berakhir'));
  assert.ok(mapGoogleDriveErrorToMessage('accessNotConfigured').includes('belum diaktifkan'));
});
