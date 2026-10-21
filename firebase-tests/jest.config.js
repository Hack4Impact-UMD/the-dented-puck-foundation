/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.test.ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  // Emulator round trips (auth sign-in, firestore writes) can exceed Jest's 5s default.
  testTimeout: 30000,
};
