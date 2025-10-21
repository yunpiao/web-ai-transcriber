/**
 * 工具函数单元测试
 */

const { createHistoryRecordsWithDates } = require('../helpers/fixtures');

// 从history.js中提取的工具函数（为了测试，我们在这里重新定义）
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

function getDateLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return '今天';
  } else if (date.getTime() === yesterday.getTime()) {
    return '昨天';
  } else {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date >= weekAgo) {
      return '本周';
    } else {
      return '更早';
    }
  }
}

function groupRecordsByDate(records) {
  const groups = {
    '今天': [],
    '昨天': [],
    '本周': [],
    '更早': []
  };
  
  records.forEach(record => {
    const label = getDateLabel(record.visitTime);
    groups[label].push(record);
  });
  
  return groups;
}

function searchRecords(records, query) {
  if (!query.trim()) {
    return records;
  }
  
  const lowerQuery = query.toLowerCase();
  return records.filter(record => 
    record.title.toLowerCase().includes(lowerQuery) ||
    record.url.toLowerCase().includes(lowerQuery) ||
    record.domain.toLowerCase().includes(lowerQuery)
  );
}

describe('时间格式化测试', () => {
  test('应该正确格式化时间（HH:MM）', () => {
    const timestamp = new Date('2024-01-01 09:05:00').getTime();
    expect(formatTime(timestamp)).toBe('09:05');
  });

  test('应该正确处理单位数的小时和分钟', () => {
    const timestamp = new Date('2024-01-01 01:03:00').getTime();
    expect(formatTime(timestamp)).toBe('01:03');
  });

  test('应该正确格式化日期（YYYY-MM-DD）', () => {
    const timestamp = new Date('2024-01-05').getTime();
    expect(formatDate(timestamp)).toBe('2024-01-05');
  });

  test('应该正确处理单位数的月份和日期', () => {
    const timestamp = new Date('2024-03-07').getTime();
    expect(formatDate(timestamp)).toBe('2024-03-07');
  });
});

describe('日期标签测试', () => {
  test('应该识别今天的记录', () => {
    const now = Date.now();
    expect(getDateLabel(now)).toBe('今天');
  });

  test('应该识别昨天的记录', () => {
    const yesterday = Date.now() - 24 * 3600000;
    expect(getDateLabel(yesterday)).toBe('昨天');
  });

  test('应该识别本周的记录', () => {
    const threeDaysAgo = Date.now() - 3 * 24 * 3600000;
    expect(getDateLabel(threeDaysAgo)).toBe('本周');
  });

  test('应该识别更早的记录', () => {
    const tenDaysAgo = Date.now() - 10 * 24 * 3600000;
    expect(getDateLabel(tenDaysAgo)).toBe('更早');
  });
});

describe('日期分组测试', () => {
  test('应该正确分组历史记录', () => {
    const records = createHistoryRecordsWithDates();
    const groups = groupRecordsByDate(records);
    
    expect(groups['今天'].length).toBe(2);
    expect(groups['昨天'].length).toBe(1);
    expect(groups['本周'].length).toBe(1);
    expect(groups['更早'].length).toBe(1);
  });

  test('应该返回所有分组键', () => {
    const records = [];
    const groups = groupRecordsByDate(records);
    
    expect(Object.keys(groups)).toEqual(['今天', '昨天', '本周', '更早']);
    expect(groups['今天']).toEqual([]);
  });
});

describe('搜索功能测试', () => {
  const mockRecords = [
    { title: 'Google Search', url: 'https://google.com', domain: 'google.com' },
    { title: 'GitHub Repo', url: 'https://github.com/user/repo', domain: 'github.com' },
    { title: 'Stack Overflow', url: 'https://stackoverflow.com/questions', domain: 'stackoverflow.com' }
  ];

  test('应该能通过标题搜索', () => {
    const results = searchRecords(mockRecords, 'github');
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe('GitHub Repo');
  });

  test('应该能通过URL搜索', () => {
    const results = searchRecords(mockRecords, 'stackoverflow');
    expect(results).toHaveLength(1);
    expect(results[0].domain).toBe('stackoverflow.com');
  });

  test('应该能通过域名搜索', () => {
    const results = searchRecords(mockRecords, 'google.com');
    expect(results).toHaveLength(1);
  });

  test('搜索应该不区分大小写', () => {
    const results1 = searchRecords(mockRecords, 'GITHUB');
    const results2 = searchRecords(mockRecords, 'github');
    expect(results1).toEqual(results2);
  });

  test('空查询应该返回所有记录', () => {
    const results = searchRecords(mockRecords, '');
    expect(results).toHaveLength(3);
  });

  test('空格查询应该返回所有记录', () => {
    const results = searchRecords(mockRecords, '   ');
    expect(results).toHaveLength(3);
  });

  test('没有匹配时应该返回空数组', () => {
    const results = searchRecords(mockRecords, 'nonexistent');
    expect(results).toHaveLength(0);
  });
});

// 日历相关工具函数
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getRecordDates(records) {
  const dates = {};
  records.forEach(record => {
    const date = new Date(record.visitTime);
    const key = formatDateKey(date);
    dates[key] = (dates[key] || 0) + 1;
  });
  return dates;
}

function getHourCounts(records, selectedDate) {
  const counts = {};
  if (!selectedDate) return counts;
  
  records.forEach(record => {
    const recordDate = new Date(record.visitTime);
    if (isSameDay(recordDate, selectedDate)) {
      const hour = recordDate.getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    }
  });
  
  return counts;
}

function filterByDate(records, selectedDate) {
  if (!selectedDate) return records;
  
  return records.filter(record => {
    const recordDate = new Date(record.visitTime);
    return isSameDay(recordDate, selectedDate);
  });
}

function filterByHour(records, selectedDate, selectedHour) {
  if (!selectedDate || selectedHour === null) return records;
  
  return records.filter(record => {
    const recordDate = new Date(record.visitTime);
    return isSameDay(recordDate, selectedDate) && 
           recordDate.getHours() === selectedHour;
  });
}

describe('日历工具函数测试', () => {
  describe('formatDateKey', () => {
    test('应该正确格式化日期为键', () => {
      const date = new Date('2024-01-05T10:30:00');
      expect(formatDateKey(date)).toBe('2024-01-05');
    });

    test('应该正确处理单位数月份和日期', () => {
      const date = new Date('2024-03-07T15:20:00');
      expect(formatDateKey(date)).toBe('2024-03-07');
    });

    test('应该正确处理双位数月份和日期', () => {
      const date = new Date('2024-12-25T00:00:00');
      expect(formatDateKey(date)).toBe('2024-12-25');
    });
  });

  describe('isSameDay', () => {
    test('应该识别同一天的不同时间', () => {
      const date1 = new Date('2024-01-05T08:00:00');
      const date2 = new Date('2024-01-05T18:30:00');
      expect(isSameDay(date1, date2)).toBe(true);
    });

    test('应该识别不同的日期', () => {
      const date1 = new Date('2024-01-05T23:59:59');
      const date2 = new Date('2024-01-06T00:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('应该正确处理跨月的日期', () => {
      const date1 = new Date('2024-01-31T12:00:00');
      const date2 = new Date('2024-02-01T12:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('应该正确处理跨年的日期', () => {
      const date1 = new Date('2023-12-31T23:59:59');
      const date2 = new Date('2024-01-01T00:00:00');
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });
});

describe('记录统计函数测试', () => {
  describe('getRecordDates', () => {
    test('应该正确统计每天的记录数', () => {
      const records = [
        { visitTime: new Date('2024-01-05T08:00:00').getTime() },
        { visitTime: new Date('2024-01-05T14:00:00').getTime() },
        { visitTime: new Date('2024-01-06T10:00:00').getTime() },
      ];
      
      const dates = getRecordDates(records);
      expect(dates['2024-01-05']).toBe(2);
      expect(dates['2024-01-06']).toBe(1);
    });

    test('应该处理空记录数组', () => {
      const dates = getRecordDates([]);
      expect(Object.keys(dates).length).toBe(0);
    });

    test('应该正确处理多个日期的记录', () => {
      const records = [
        { visitTime: new Date('2024-01-01T10:00:00').getTime() },
        { visitTime: new Date('2024-01-02T10:00:00').getTime() },
        { visitTime: new Date('2024-01-03T10:00:00').getTime() },
      ];
      
      const dates = getRecordDates(records);
      expect(Object.keys(dates).length).toBe(3);
      expect(dates['2024-01-01']).toBe(1);
      expect(dates['2024-01-02']).toBe(1);
      expect(dates['2024-01-03']).toBe(1);
    });
  });

  describe('getHourCounts', () => {
    test('应该正确统计选中日期每小时的记录数', () => {
      const records = [
        { visitTime: new Date('2024-01-05T08:30:00').getTime() },
        { visitTime: new Date('2024-01-05T08:45:00').getTime() },
        { visitTime: new Date('2024-01-05T14:20:00').getTime() },
        { visitTime: new Date('2024-01-06T08:00:00').getTime() }, // 不同日期
      ];
      
      const selectedDate = new Date('2024-01-05');
      const counts = getHourCounts(records, selectedDate);
      
      expect(counts[8]).toBe(2);
      expect(counts[14]).toBe(1);
      expect(counts[6]).toBeUndefined();
    });

    test('未选择日期时应该返回空对象', () => {
      const records = [
        { visitTime: new Date('2024-01-05T08:00:00').getTime() },
      ];
      
      const counts = getHourCounts(records, null);
      expect(Object.keys(counts).length).toBe(0);
    });

    test('选中日期没有记录时应该返回空对象', () => {
      const records = [
        { visitTime: new Date('2024-01-05T08:00:00').getTime() },
      ];
      
      const selectedDate = new Date('2024-01-06');
      const counts = getHourCounts(records, selectedDate);
      expect(Object.keys(counts).length).toBe(0);
    });
  });
});

describe('筛选功能测试', () => {
  const mockRecordsWithTime = [
    { 
      title: '今天早上8点',
      url: 'https://example.com/morning',
      domain: 'example.com',
      visitTime: new Date('2024-01-05T08:30:00').getTime()
    },
    { 
      title: '今天下午2点',
      url: 'https://example.com/afternoon',
      domain: 'example.com',
      visitTime: new Date('2024-01-05T14:20:00').getTime()
    },
    { 
      title: '昨天早上8点',
      url: 'https://example.com/yesterday',
      domain: 'example.com',
      visitTime: new Date('2024-01-04T08:00:00').getTime()
    },
  ];

  describe('filterByDate', () => {
    test('应该筛选出选中日期的所有记录', () => {
      const selectedDate = new Date('2024-01-05');
      const results = filterByDate(mockRecordsWithTime, selectedDate);
      
      expect(results).toHaveLength(2);
      expect(results[0].title).toBe('今天早上8点');
      expect(results[1].title).toBe('今天下午2点');
    });

    test('未选择日期时应该返回所有记录', () => {
      const results = filterByDate(mockRecordsWithTime, null);
      expect(results).toHaveLength(3);
    });

    test('选中日期没有记录时应该返回空数组', () => {
      const selectedDate = new Date('2024-01-10');
      const results = filterByDate(mockRecordsWithTime, selectedDate);
      expect(results).toHaveLength(0);
    });
  });

  describe('filterByHour', () => {
    test('应该筛选出选中日期和小时的记录', () => {
      const selectedDate = new Date('2024-01-05');
      const selectedHour = 8;
      const results = filterByHour(mockRecordsWithTime, selectedDate, selectedHour);
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('今天早上8点');
    });

    test('未选择小时时应该返回所有记录', () => {
      const selectedDate = new Date('2024-01-05');
      const results = filterByHour(mockRecordsWithTime, selectedDate, null);
      expect(results).toHaveLength(3);
    });

    test('未选择日期时应该返回所有记录', () => {
      const results = filterByHour(mockRecordsWithTime, null, 8);
      expect(results).toHaveLength(3);
    });

    test('选中小时没有记录时应该返回空数组', () => {
      const selectedDate = new Date('2024-01-05');
      const selectedHour = 10;
      const results = filterByHour(mockRecordsWithTime, selectedDate, selectedHour);
      expect(results).toHaveLength(0);
    });
  });

  describe('组合筛选测试', () => {
    test('应该支持日期+小时+搜索的组合筛选', () => {
      const selectedDate = new Date('2024-01-05');
      const selectedHour = 8;
      
      // 先按日期和小时筛选
      let results = filterByHour(mockRecordsWithTime, selectedDate, selectedHour);
      // 再按搜索关键词筛选
      results = searchRecords(results, 'morning');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('今天早上8点');
    });

    test('应该支持日期+搜索的组合筛选', () => {
      const selectedDate = new Date('2024-01-05');
      
      let results = filterByDate(mockRecordsWithTime, selectedDate);
      results = searchRecords(results, 'afternoon');
      
      expect(results).toHaveLength(1);
      expect(results[0].title).toBe('今天下午2点');
    });

    test('组合筛选无匹配时应该返回空数组', () => {
      const selectedDate = new Date('2024-01-05');
      const selectedHour = 8;
      
      let results = filterByHour(mockRecordsWithTime, selectedDate, selectedHour);
      results = searchRecords(results, 'afternoon'); // 8点没有afternoon的记录
      
      expect(results).toHaveLength(0);
    });
  });
});

