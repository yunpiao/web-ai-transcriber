module.exports = {
  // E2E测试使用node环境而不是jsdom
  testEnvironment: 'node',
  
  // 只匹配E2E测试文件
  testMatch: [
    '**/tests/e2e/**/*.test.js'
  ],
  
  // 测试超时（E2E测试需要更长时间）
  testTimeout: 60000,
  
  // 详细输出
  verbose: true,
  
  // 不收集覆盖率（E2E测试主要验证集成）
  collectCoverage: false
};


