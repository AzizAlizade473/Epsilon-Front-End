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
      setupFilesAfterEnv: ['<rootDir>/scripts/jest-app-setup.ts'],
      testMatch: [
        '<rootDir>/__tests__/**/*.test.ts',
        '<rootDir>/__tests__/**/*.test.tsx',
      ],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        // Lucide's react-native export is ESM; Jest runs its packaged CJS twin.
        '^lucide-react-native/icons/(.*)$':
          '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
      },
    },
  ],
};
