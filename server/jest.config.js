module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/*.test.js'],
    testTimeout: 10000,
    bail: false,
    verbose: true,
    collectCoverage: true,
    collectCoverageFrom: [
        'routes/**/*.js',
        'controllers/**/*.js',
        '!models/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**',
        '!routes/lot.js',
        '!routes/statistics.js',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    clearMocks: true,
    restoreMocks: true,
    resetModules: true,
}; 