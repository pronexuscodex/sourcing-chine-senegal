import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Simule un lien signé à expiration pour le stockage local de dev — même contrat
 * qu'une URL présignée S3/R2 (ARCHITECTURE.md §23) : la possession du token valide
 * EST l'autorisation, pas de vérification JWT supplémentaire sur cette route.
 */
export function signDownloadToken(secret: string, key: string, expiresAt: number): string {
  return createHmac('sha256', secret).update(`${key}:${expiresAt}`).digest('hex');
}

export function verifyDownloadToken(secret: string, key: string, expiresAt: number, token: string): boolean {
  if (Date.now() > expiresAt) return false;

  const expected = signDownloadToken(secret, key, expiresAt);
  const expectedBuf = Buffer.from(expected, 'hex');
  const tokenBuf = Buffer.from(token, 'hex');
  if (expectedBuf.length !== tokenBuf.length) return false;

  return timingSafeEqual(expectedBuf, tokenBuf);
}
