module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleFileExtensions: ['ts', 'js'],
    collectCoverageFrom: [
        'utils/**/*.ts',
        'services/**/*.ts',
        'controllers/**/*.ts',
    ],
    globals: {
        'ts-jest': {
            diagnostics: false,
        },
    },
};