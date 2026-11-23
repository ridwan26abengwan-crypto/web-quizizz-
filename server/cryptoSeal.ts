import crypto from 'node:crypto';

const EPHEMERAL_FALLBACK_KEY = crypto.randomBytes(32);

function getCipherKey(): Buffer {
  const envKey = process.env.QUIZ_ENCRYPTION_KEY;
  if (envKey && envKey.trim().length > 0) {
    return crypto.createHash('sha256').update(envKey.trim()).digest();
  }
  return EPHEMERAL_FALLBACK_KEY;
}

export interface SealedAnswerPayload {
  questionId: string;
  correctAnswer: number;
  points: number;
  explanation?: string;
}

export function sealAnswerPayload(payload: SealedAnswerPayload): string {
  const key = getCipherKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${authTag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

export function unsealAnswerPayload(token: string): SealedAnswerPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [ivB64, tagB64, dataB64] = parts;
    const key = getCipherKey();
    const iv = Buffer.from(ivB64, 'base64url');
    const authTag = Buffer.from(tagB64, 'base64url');
    const encrypted = Buffer.from(dataB64, 'base64url');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    const parsed = JSON.parse(decrypted.toString('utf8')) as SealedAnswerPayload;
    if (
      typeof parsed.questionId !== 'string' ||
      typeof parsed.correctAnswer !== 'number' ||
      parsed.correctAnswer < 0 ||
      parsed.correctAnswer > 3
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
