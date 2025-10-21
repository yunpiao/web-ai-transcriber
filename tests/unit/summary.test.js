/**
 * 浏览记录总结功能单元测试
 */

describe('浏览记录总结功能单元测试', () => {
  // 模拟格式化函数
  function formatTime(timestamp) {
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  function formatDate(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 模拟总结文本生成函数
  function generateSummaryText(todayRecords) {
    let summaryText = `请帮我总结一下今天（${formatDate(Date.now())}）的浏览记录，共浏览了 ${todayRecords.length} 个网页。以下是详细的浏览记录：\n\n`;
    
    const sortedRecords = [...todayRecords].sort((a, b) => a.visitTime - b.visitTime);
    
    sortedRecords.forEach((record, index) => {
      summaryText += `${index + 1}. [${formatTime(record.visitTime)}] ${record.title}\n`;
      summaryText += `   网址: ${record.url}\n`;
      summaryText += `   域名: ${record.domain}\n`;
      if (record.content && record.content.trim()) {
        const contentPreview = record.content.length > 150 
          ? record.content.substring(0, 150) + '...' 
          : record.content;
        summaryText += `   内容摘要: ${contentPreview}\n`;
      }
      summaryText += '\n';
    });
    
    summaryText += '\n请根据以上浏览记录，总结今天的浏览主题和关注重点，并给出以下内容：\n';
    summaryText += '1. 主要浏览的网站和类型\n';
    summaryText += '2. 关注的主要话题或领域\n';
    summaryText += '3. 浏览时间分布特点\n';
    summaryText += '4. 建议和洞察（如果有的话）';
    
    return summaryText;
  }

  // 筛选今天的记录
  function filterTodayRecords(allRecords) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return allRecords.filter(record => {
      const recordDate = new Date(record.visitTime);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  }

  test('应该能够格式化时间', () => {
    const timestamp = new Date('2024-01-15 14:30:00').getTime();
    const result = formatTime(timestamp);
    expect(result).toBe('14:30');
  });

  test('应该能够格式化日期', () => {
    const timestamp = new Date('2024-01-15').getTime();
    const result = formatDate(timestamp);
    expect(result).toBe('2024-01-15');
  });

  test('应该能够筛选今天的记录', () => {
    const today = new Date();
    today.setHours(10, 0, 0, 0);
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(10, 0, 0, 0);
    
    const allRecords = [
      { id: 1, visitTime: today.getTime(), title: 'Today 1' },
      { id: 2, visitTime: yesterday.getTime(), title: 'Yesterday' },
      { id: 3, visitTime: today.getTime(), title: 'Today 2' }
    ];
    
    const todayRecords = filterTodayRecords(allRecords);
    expect(todayRecords).toHaveLength(2);
    expect(todayRecords[0].title).toBe('Today 1');
    expect(todayRecords[1].title).toBe('Today 2');
  });

  test('应该能够生成总结文本（单条记录）', () => {
    const today = new Date();
    today.setHours(14, 30, 0, 0);
    
    const records = [{
      visitTime: today.getTime(),
      title: '测试网页',
      url: 'https://example.com',
      domain: 'example.com',
      content: '这是一段测试内容'
    }];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('共浏览了 1 个网页');
    expect(summary).toContain('测试网页');
    expect(summary).toContain('https://example.com');
    expect(summary).toContain('example.com');
    expect(summary).toContain('这是一段测试内容');
    expect(summary).toContain('主要浏览的网站和类型');
  });

  test('应该能够生成总结文本（多条记录）', () => {
    const today = new Date();
    today.setHours(14, 0, 0, 0);
    
    const records = [
      {
        visitTime: today.getTime(),
        title: '网页1',
        url: 'https://example1.com',
        domain: 'example1.com',
        content: '内容1'
      },
      {
        visitTime: today.getTime() + 3600000, // +1小时
        title: '网页2',
        url: 'https://example2.com',
        domain: 'example2.com',
        content: '内容2'
      }
    ];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('共浏览了 2 个网页');
    expect(summary).toContain('网页1');
    expect(summary).toContain('网页2');
    expect(summary).toContain('1. [14:00] 网页1');
    expect(summary).toContain('2. [15:00] 网页2');
  });

  test('应该能够处理长内容（自动截断）', () => {
    const today = new Date();
    const longContent = 'a'.repeat(200);
    
    const records = [{
      visitTime: today.getTime(),
      title: '长内容网页',
      url: 'https://example.com',
      domain: 'example.com',
      content: longContent
    }];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('内容摘要: ' + 'a'.repeat(150) + '...');
    expect(summary).not.toContain('a'.repeat(200));
  });

  test('应该能够处理无内容的记录', () => {
    const today = new Date();
    
    const records = [{
      visitTime: today.getTime(),
      title: '无内容网页',
      url: 'https://example.com',
      domain: 'example.com',
      content: ''
    }];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('无内容网页');
    expect(summary).not.toContain('内容摘要');
  });

  test('应该能够按时间顺序排序记录', () => {
    const today = new Date();
    
    const records = [
      {
        visitTime: today.getTime() + 7200000, // 最晚
        title: '第三个',
        url: 'https://example3.com',
        domain: 'example3.com'
      },
      {
        visitTime: today.getTime(), // 最早
        title: '第一个',
        url: 'https://example1.com',
        domain: 'example1.com'
      },
      {
        visitTime: today.getTime() + 3600000, // 中间
        title: '第二个',
        url: 'https://example2.com',
        domain: 'example2.com'
      }
    ];
    
    const summary = generateSummaryText(records);
    
    // 检查顺序
    const firstIndex = summary.indexOf('第一个');
    const secondIndex = summary.indexOf('第二个');
    const thirdIndex = summary.indexOf('第三个');
    
    expect(firstIndex).toBeLessThan(secondIndex);
    expect(secondIndex).toBeLessThan(thirdIndex);
  });

  test('应该能够处理空记录列表', () => {
    const records = [];
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('共浏览了 0 个网页');
  });

  test('应该包含总结指引', () => {
    const today = new Date();
    const records = [{
      visitTime: today.getTime(),
      title: '测试',
      url: 'https://example.com',
      domain: 'example.com'
    }];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('主要浏览的网站和类型');
    expect(summary).toContain('关注的主要话题或领域');
    expect(summary).toContain('浏览时间分布特点');
    expect(summary).toContain('建议和洞察');
  });
});


