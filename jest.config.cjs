module.exports = {
  projects: [
    {
      displayName: 'tooling',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.cjs'],
    },
    {
      displayName: 'app',
      preset: 'jest-expo',
      testMatch: [
        '<rootDir>/__tests__/**/*.test.ts',
        '<rootDir>/__tests__/**/*.test.tsx',
      ],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
    },
  ],
};
