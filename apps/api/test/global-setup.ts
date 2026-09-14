import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { loadTestEnvVars } from './env-test.util';

/**
 * Prépare la base de test AVANT toute suite e2e : migrations appliquées (sans
 * générer de nouvelles migrations, `migrate deploy` — jamais `migrate dev` ici)
 * puis RBAC re-seedé. Tourne une seule fois pour tout le run (globalSetup Jest).
 */
export default async function globalSetup(): Promise<void> {
  // process.env en dernier : une variable déjà fournie (par la CI, par ex.) l'emporte
  // toujours sur les valeurs de dev local figées dans .env.test (même règle que
  // applyTestEnvVars — voir env-test.util.ts).
  const env = { ...loadTestEnvVars(), ...process.env };
  const cwd = join(__dirname, '..');

  execSync('npx prisma migrate deploy', { cwd, env, stdio: 'inherit' });
  execSync('npx ts-node prisma/seed.ts', { cwd, env, stdio: 'inherit' });
}
