/**
 * Stockage objet derrière une interface swappable (ARCHITECTURE.md §23) — un
 * prestataire (R2/S3) se branche sans toucher au reste du module documents.
 */
export interface StorageProvider {
  readonly name: string;
  upload(key: string, buffer: Buffer, mimeType: string): Promise<void>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
