// user-frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (if you have them in tsconfig.json)
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    // Add other aliases as needed
  },
  // If using TypeScript, you might need 'ts-jest' or 'babel-jest' with '@babel/preset-typescript'
  // For simplicity, we assume basic Jest setup works with Next.js's built-in Babel/SWC
};

// createJestConfig is a wrapper that lets Next.js manage the Jest configuration
module.exports = createJestConfig(customJestConfig);