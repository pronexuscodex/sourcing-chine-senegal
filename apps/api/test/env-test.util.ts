import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Parseur minimal — évite une dépendance dotenv pour un besoin aussi simple. */
export function loadTestEnvVars(): Record<string, string> {
  const envPath = join(__dirname, '..', '.env.test');
  const content = readFileSync(envPath, 'utf8');
  const vars: Record<string, string> = {};

  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    vars[key] = value;
  }
  return vars;
}

/**
 * N'écrase jamais une variable déjà présente dans process.env (même convention
 * que dotenv) — permet à la CI de fournir ses propres DATABASE_URL/REDIS_URL
 * (ports de services différents des ports de dev locale figés dans .env.test)
 * sans toucher à ce fichier.
 */
export function applyTestEnvVars(): void {
  for (const [key, value] of Object.entries(loadTestEnvVars())) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
