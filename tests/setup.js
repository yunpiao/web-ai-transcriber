// 全局测试设置文件
// 在所有测试运行前执行

// 设置测试超时
jest.setTimeout(30000);

// Polyfill for structuredClone (needed for fake-indexeddb)
if (typeof global.structuredClone === 'undefined') {
  global.structuredClone = (val) => {
    return JSON.parse(JSON.stringify(val));
  };
}

// 全局变量
global.console = {
  ...console,
  // 在测试中禁用某些console输出，保持测试输出清洁
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  // 保留warn和error以便调试
  warn: console.warn,
  error: console.error,
};

