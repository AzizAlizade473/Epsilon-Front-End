module.exports = {
  coverageReporters: ['text-summary', 'json-summary', 'lcov'],
  coverageThreshold: {
    './src/services/': {
      statements: 65,
      branches: 50,
      functions: 60,
      lines: 65,
    },
    './src/lib/': { statements: 70, branches: 65, functions: 70, lines: 75 },
    './src/features/scan/machine.ts': {
      statements: 85,
      branches: 75,
      functions: 80,
      lines: 85,
    },
    './src/features/scan/hooks/useScanMachine.ts': {
      statements: 85,
      branches: 75,
      functions: 80,
      lines: 85,
    },
    './src/features/auth/store.ts': {
      statements: 80,
      branches: 70,
      functions: 80,
      lines: 80,
    },
  },
  projects: [
    {
      displayName: 'tooling',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/__tests__/**/*.test.cjs'],
    },
    {
      displayName: 'app',
      collectCoverageFrom: [
        'src/lib/**/*.{ts,tsx}',
        'src/services/**/*.{ts,tsx}',
        'src/features/scan/machine.ts',
        'src/features/scan/hooks/useScanMachine.ts',
        'src/features/auth/store.ts',
      ],
      preset: 'jest-expo',
      transform: {
        '\\.[jt]sx?$': [
          'babel-jest',
          {
            presets: ['expo/internal/babel-preset'],
            plugins: [require.resolve('./scripts/jest-dynamic-import.cjs')],
            caller: { name: 'metro', bundler: 'jest', platform: 'ios' },
          },
        ],
      },
      resolver: 'react-native-reanimated/jest/resolver.js',
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
