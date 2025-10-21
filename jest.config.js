module.exports = {
  // 测试环境
  testEnvironment: 'jsdom',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  
  // 跳过E2E测试（需要真实浏览器环境）
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/'
  ],
  
  // 覆盖率收集
  collectCoverageFrom: [
    'smart-search-extension/**/*.js',
    '!smart-search-extension/content.js', // 跳过现有的content.js
    '!smart-search-extension/options.js',
    '!**/node_modules/**',
    '!**/tests/**'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60
    }
  },
  
  // 设置文件（在测试前运行）
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/smart-search-extension/$1'
  },
  
  // 测试超时
  testTimeout: 30000,
  
  // 详细输出
  verbose: true
};

