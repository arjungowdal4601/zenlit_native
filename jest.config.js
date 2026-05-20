module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.tsx'],
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|expo(nent)?|@expo(nent)?/.*|expo-.*|@expo/.*|@expo-google-fonts/.*|react-native-.*|lucide-react-native)/)',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
