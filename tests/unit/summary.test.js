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

  function formatDuration(seconds) {
    if (!seconds || seconds < 0) {
      return '0秒';
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      if (minutes > 0) {
        return `${hours}小时${minutes}分`;
      }
      return `${hours}小时`;
    } else if (minutes > 0) {
      if (secs > 0) {
        return `${minutes}分${secs}秒`;
      }
      return `${minutes}分`;
    } else {
      return `${secs}秒`;
    }
  }

  // 模拟总结文本生成函数（新版本：使用完整内容，支持筛选条件）
  function generateSummaryText(records, filterDescription = '全部') {
    let summaryText = `请帮我总结以下浏览记录（筛选条件：${filterDescription}），共 ${records.length} 个网页。以下是详细的浏览记录：\n\n`;
    
    const sortedRecords = [...records].sort((a, b) => a.visitTime - b.visitTime);
    
    sortedRecords.forEach((record, index) => {
      summaryText += `${index + 1}. [${formatDate(record.visitTime)} ${formatTime(record.visitTime)}] ${record.title}\n`;
      summaryText += `   网址: ${record.url}\n`;
      summaryText += `   域名: ${record.domain}\n`;
      
      // 添加停留时长信息
      if (record.duration) {
        summaryText += `   停留时长: ${formatDuration(record.duration)}\n`;
      }
      
      // 使用完整内容，不截断
      if (record.content && record.content.trim()) {
        summaryText += `   页面内容: ${record.content}\n`;
      }
      summaryText += '\n';
    });
    
    summaryText += '\n请根据以上浏览记录，总结浏览主题和关注重点，并给出以下内容：\n';
    summaryText += '1. 主要浏览的网站和类型\n';
    summaryText += '2. 关注的主要话题或领域\n';
    summaryText += '3. 浏览时间分布特点\n';
    summaryText += '4. 建议和洞察（如果有的话）';
    
    return summaryText;
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

  test('应该能够格式化停留时长', () => {
    expect(formatDuration(30)).toBe('30秒');
    expect(formatDuration(90)).toBe('1分30秒');
    expect(formatDuration(3600)).toBe('1小时');
    expect(formatDuration(3660)).toBe('1小时1分');
    expect(formatDuration(7200)).toBe('2小时');
  });

  test('应该能够生成总结文本（单条记录）', () => {
    const today = new Date();
    today.setHours(14, 30, 0, 0);
    
    const records = [{
      visitTime: today.getTime(),
      title: '测试网页',
      url: 'https://example.com',
      domain: 'example.com',
      content: '这是一段测试内容',
      duration: 120
    }];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('共 1 个网页');
    expect(summary).toContain('测试网页');
    expect(summary).toContain('https://example.com');
    expect(summary).toContain('example.com');
    expect(summary).toContain('页面内容: 这是一段测试内容');
    expect(summary).toContain('停留时长: 2分');
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
        content: '内容1',
        duration: 60
      },
      {
        visitTime: today.getTime() + 3600000, // +1小时
        title: '网页2',
        url: 'https://example2.com',
        domain: 'example2.com',
        content: '内容2',
        duration: 120
      }
    ];
    
    const summary = generateSummaryText(records);
    
    expect(summary).toContain('共 2 个网页');
    expect(summary).toContain('网页1');
    expect(summary).toContain('网页2');
    expect(summary).toContain('14:00] 网页1');
    expect(summary).toContain('15:00] 网页2');
  });

  test('应该能够处理长内容（不截断）', () => {
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
    
    // 新版本不截断内容
    expect(summary).toContain('页面内容: ' + 'a'.repeat(200));
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
    expect(summary).not.toContain('页面内容');
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
    
    expect(summary).toContain('共 0 个网页');
  });

  test('应该能够生成带筛选条件的总结', () => {
    const today = new Date();
    const records = [{
      visitTime: today.getTime(),
      title: '测试网页',
      url: 'https://example.com',
      domain: 'example.com'
    }];
    
    const summary = generateSummaryText(records, '今天');
    
    expect(summary).toContain('筛选条件：今天');
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


