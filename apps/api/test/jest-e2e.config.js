/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  rootDir: '..',
  roots: ['<rootDir>/test/e2e'],
  testRegex: '.*\\.e2e-spec\\.ts$',
  setupFiles: ['<rootDir>/test/setup-env.ts'],
  globalSetup: '<rootDir>/test/global-setup.ts',
  testTimeout: 30000,
  // @nestjs/bullmq et @nestjs/bull-shared sont publiés en ESM pur (pas de build CJS) —
  // Node moderne les `require()` nativement (d'où le fonctionnement en dev/prod), mais
  // le loader de modules de Jest ne le fait pas : il faut les transformer explicitement
  // plutôt que les ignorer comme le reste de node_modules.
  transformIgnorePatterns: ['node_modules/(?!(@nestjs/bullmq|@nestjs/bull-shared)/)'],
  transform: {
    '^.+\\.(t|j)s$': ['ts-jest', { tsconfig: 'test/tsconfig.json' }],
  },
};
