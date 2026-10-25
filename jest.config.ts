import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'server',
      testEnvironment: 'node',
      roots: ['<rootDir>/src/server', '<rootDir>/test'],
      transform: { '^.+\\.ts$': ['ts-jest', { tsconfig: 'tsconfig.json' }] },
    },
    {
      displayName: 'web',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/src/web'],
      setupFilesAfterEnv: ['<rootDir>/test/setup-web.ts'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.web-test.json' }],
        // ESM-only packages (lowlight & co.) are compiled to CommonJS for Jest.
        '^.+\\.m?js$': ['ts-jest', { tsconfig: { allowJs: true, module: 'CommonJS' } }],
      },
      transformIgnorePatterns: ['/node_modules/(?!(lowlight|highlight\\.js|devlop|hast-util-[^/]+|unist-util-[^/]+|vfile[^/]*|comma-separated-tokens|space-separated-tokens|property-information|html-void-elements|zwitch|ccount|character-entities[^/]*|stringify-entities|estree-util-[^/]+|cn)/)'],
      moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/web/$1', '\\.css$': 'identity-obj-proxy' },
    },
  ],
};

export default config;
