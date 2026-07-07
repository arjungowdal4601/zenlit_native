const transpiledPackages = [
  '(jest-)?react-native',
  '@react-native(?:\\+[^/]+)?',
  '@react-native-community(?:\\+[^/]+)?',
  '@react-navigation(?:\\+[^/]+)?',
  'expo(nent)?',
  '@expo(nent)?(?:\\+[^/]+)?',
  'expo-[^/]+',
  '@expo-google-fonts(?:\\+[^/]+)?',
  'react-native-[^/]+',
  'standard-navigation',
  'lucide-react-native',
].join('|');

module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/test/setup/jest.setup.tsx'],
  testMatch: ['<rootDir>/test/**/*.test.ts', '<rootDir>/test/**/*.test.tsx'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    `node_modules/(?!\\.pnpm/(?:${transpiledPackages})@|(?:${transpiledPackages})/)`,
  ],
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};
