// 测试数据生成器

/**
 * 生成模拟的历史记录
 */
function createMockHistoryRecord(overrides = {}) {
  const defaults = {
    id: Date.now(),
    url: 'https://example.com/test-page',
    title: 'Test Page Title',
    favicon: 'https://example.com/favicon.ico',
    content: 'This is test page content. It contains some sample text for testing purposes.',
    visitTime: Date.now(),
    domain: 'example.com'
  };
  
  return { ...defaults, ...overrides };
}

/**
 * 生成多条历史记录
 */
function createMockHistoryRecords(count = 5) {
  const records = [];
  const now = Date.now();
  
  for (let i = 0; i < count; i++) {
    records.push(createMockHistoryRecord({
      id: now - i * 1000,
      url: `https://example${i}.com/page-${i}`,
      title: `Test Page ${i}`,
      domain: `example${i}.com`,
      visitTime: now - i * 3600000 // 每小时一个
    }));
  }
  
  return records;
}

/**
 * 生成不同日期的记录
 */
function createHistoryRecordsWithDates() {
  const now = Date.now();
  const oneDay = 24 * 3600000;
  
  return [
    // 今天
    createMockHistoryRecord({
      id: now,
      title: 'Today Page 1',
      visitTime: now
    }),
    createMockHistoryRecord({
      id: now - 1000,
      title: 'Today Page 2',
      visitTime: now - 1000
    }),
    
    // 昨天
    createMockHistoryRecord({
      id: now - oneDay,
      title: 'Yesterday Page',
      visitTime: now - oneDay
    }),
    
    // 本周
    createMockHistoryRecord({
      id: now - 3 * oneDay,
      title: 'This Week Page',
      visitTime: now - 3 * oneDay
    }),
    
    // 更早
    createMockHistoryRecord({
      id: now - 10 * oneDay,
      title: 'Older Page',
      visitTime: now - 10 * oneDay
    })
  ];
}

/**
 * 生成配置数据
 */
function createMockSettings(overrides = {}) {
  const defaults = {
    favoriteEngine: 'qwen',
    promptTemplate: 'Default prompt template',
    enabledeepThinking: false,
    useCurrentTab: false,
    enablePageTracking: true
  };
  
  return { ...defaults, ...overrides };
}

/**
 * 生成测试用的HTML页面内容
 */
function createTestPageHTML(title = 'Test Page', content = 'Test content') {
  return `
<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <link rel="icon" href="https://example.com/favicon.ico">
</head>
<body>
  <article>
    <h1>${title}</h1>
    <p>${content}</p>
  </article>
</body>
</html>
  `.trim();
}

module.exports = {
  createMockHistoryRecord,
  createMockHistoryRecords,
  createHistoryRecordsWithDates,
  createMockSettings,
  createTestPageHTML
};

