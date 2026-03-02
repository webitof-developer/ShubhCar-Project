const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Path to your Next.js app to load next.config.js and .env files
  dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
  // Test setup file runs after Jest is initialized
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Use jsdom environment to simulate a browser
  testEnvironment: 'jest-environment-jsdom',

  // Module name mappings for path aliases (@/*) and static assets
  moduleNameMapper: {
    // Handle @/ path aliases (matching jsconfig.json paths)
    '^@/(.*)$': '<rootDir>/src/$1',

    // Remap react-bootstrap ESM subpath to CJS to avoid Jest ESM issues
    // (TextFormInput imports Feedback from 'react-bootstrap/esm/Feedback')
    '^react-bootstrap/esm/(.*)$': '<rootDir>/node_modules/react-bootstrap/cjs/$1',

    // Handle CSS Modules — identity-obj-proxy returns the class name as a string
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle plain CSS/SASS/SCSS imports (no module)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // Handle static image/file imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i':
      '<rootDir>/__mocks__/fileMock.js',
  },

  // Patterns to collect coverage from
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.stories.{js,jsx}',
    '!src/**/_*.{js,jsx}',
    '!**/node_modules/**',
  ],

  // Tell Jest which directories to look for tests in
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx}',
  ],

  // Ignore Playwright E2E tests (in /tests/ or /e2e/ folder)
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/tests/',
    '<rootDir>/e2e/',
  ],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Some packages ship as ESM; tell Jest to transform them via babel-jest
  // Pattern: ignore everything in node_modules EXCEPT these ESM packages
  transformIgnorePatterns: [
    '/node_modules/(?!(react-bootstrap)/)',
  ],
};

// createJestConfig returns an async function that merges Next.js config
module.exports = createJestConfig(customJestConfig);
