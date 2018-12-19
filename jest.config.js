module.exports = {
  roots: ['<rootDir>/src'],
  testEnvironment: 'node',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '((\\.|/)(test|spec))\\.(js|ts)$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node', 'bin'],
  moduleNameMapper: {
    '~/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    "ts-jest": {
      tsConfig: "tsconfig.json"
    }
  }
};
