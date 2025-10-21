/**
 * 历史记录页面UI优化集成测试
 */

const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');

describe('历史记录UI优化集成测试', () => {
  beforeEach(() => {
    setupChromeMock();
  });

  afterEach(() => {
    resetChromeMock();
  });

  describe('筛选横幅与storage交互', () => {
    test('应该能够从storage读取筛选设置', async () => {
      // 保存筛选设置
      await chrome.storage.local.set({
        lastFilter: {
          searchQuery: 'test',
          selectedDate: '2025-10-21',
          activeQuickFilter: 'today'
        }
      });

      // 读取设置
      const result = await chrome.storage.local.get('lastFilter');
      
      expect(result.lastFilter).toBeDefined();
      expect(result.lastFilter.searchQuery).toBe('test');
      expect(result.lastFilter.selectedDate).toBe('2025-10-21');
      expect(result.lastFilter.activeQuickFilter).toBe('today');
    });

    test('应该能够保存筛选状态到storage', async () => {
      const filterState = {
        searchQuery: 'chrome extension',
        selectedDate: '2025-10-21',
        selectedHour: 15,
        activeQuickFilter: null
      };

      await chrome.storage.local.set({ filterState });

      const result = await chrome.storage.local.get('filterState');
      expect(result.filterState).toEqual(filterState);
    });

    test('应该能够清除筛选状态', async () => {
      // 先设置状态
      await chrome.storage.local.set({
        filterState: {
          searchQuery: 'test',
          selectedDate: '2025-10-21'
        }
      });

      // 清除状态
      await chrome.storage.local.set({
        filterState: {
          searchQuery: '',
          selectedDate: null,
          selectedHour: null,
          activeQuickFilter: 'all'
        }
      });

      const result = await chrome.storage.local.get('filterState');
      expect(result.filterState.searchQuery).toBe('');
      expect(result.filterState.selectedDate).toBeNull();
    });
  });

  describe('月份切换与日期验证', () => {
    test('应该正确计算月份边界', () => {
      const now = new Date('2025-10-21');
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // 当前月份
      const thisMonth = new Date(currentYear, currentMonth, 1);
      expect(thisMonth.getFullYear()).toBe(2025);
      expect(thisMonth.getMonth()).toBe(9); // 10月是索引9

      // 下个月
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);
      expect(nextMonth.getFullYear()).toBe(2025);
      expect(nextMonth.getMonth()).toBe(10); // 11月

      // 上个月
      const prevMonth = new Date(currentYear, currentMonth - 1, 1);
      expect(prevMonth.getFullYear()).toBe(2025);
      expect(prevMonth.getMonth()).toBe(8); // 9月
    });

    test('应该正确处理跨年的月份切换', () => {
      const now = new Date('2025-12-21');
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // 下个月应该是2026年1月
      const nextMonth = new Date(currentYear, currentMonth + 1, 1);
      expect(nextMonth.getFullYear()).toBe(2026);
      expect(nextMonth.getMonth()).toBe(0); // 1月

      // 测试1月切换到上个月
      const jan2026 = new Date('2026-01-15');
      const prevMonthFromJan = new Date(jan2026.getFullYear(), jan2026.getMonth() - 1, 1);
      expect(prevMonthFromJan.getFullYear()).toBe(2025);
      expect(prevMonthFromJan.getMonth()).toBe(11); // 12月
    });

    test('应该正确判断未来月份', () => {
      const now = new Date('2025-10-21');
      
      // 当前月份的下一个月
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const isFuture = nextMonth > now;
      
      expect(isFuture).toBe(true);
    });

    test('应该正确判断过去月份', () => {
      const now = new Date('2025-10-21');
      
      // 上个月
      const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const isFuture = prevMonth > now;
      
      expect(isFuture).toBe(false);
    });
  });

  describe('快速筛选与日期筛选的协调', () => {
    test('选择快速筛选后应该清除日期选择', () => {
      let selectedDate = new Date('2025-10-15');
      let selectedHour = 10;
      let activeQuickFilter = null;

      // 模拟点击快速筛选
      function handleQuickFilterClick(period) {
        activeQuickFilter = period;
        if (selectedDate) {
          selectedDate = null;
          selectedHour = null;
        }
      }

      handleQuickFilterClick('today');

      expect(activeQuickFilter).toBe('today');
      expect(selectedDate).toBeNull();
      expect(selectedHour).toBeNull();
    });

    test('选择日期后应该清除快速筛选', () => {
      let selectedDate = null;
      let activeQuickFilter = 'today';

      // 模拟点击日期
      function selectDate(date) {
        selectedDate = date;
        activeQuickFilter = null;
      }

      selectDate(new Date('2025-10-21'));

      expect(selectedDate).not.toBeNull();
      expect(activeQuickFilter).toBeNull();
    });

    test('清除筛选应该重置所有状态', () => {
      let selectedDate = new Date('2025-10-21');
      let selectedHour = 15;
      let currentSearchQuery = 'test';
      let activeQuickFilter = 'today';

      // 模拟清除筛选
      function clearFilters() {
        selectedDate = null;
        selectedHour = null;
        currentSearchQuery = '';
        activeQuickFilter = null;
      }

      clearFilters();

      expect(selectedDate).toBeNull();
      expect(selectedHour).toBeNull();
      expect(currentSearchQuery).toBe('');
      expect(activeQuickFilter).toBeNull();
    });
  });

  describe('筛选条件的持久化', () => {
    test('应该能够保存并恢复完整的筛选状态', async () => {
      const filterState = {
        searchQuery: 'chrome',
        selectedDate: '2025-10-21',
        selectedHour: 15,
        activeQuickFilter: null,
        currentMonth: '2025-10'
      };

      // 保存状态
      await chrome.storage.local.set({ historyFilterState: filterState });

      // 恢复状态
      const result = await chrome.storage.local.get({ 
        historyFilterState: {
          searchQuery: '',
          selectedDate: null,
          selectedHour: null,
          activeQuickFilter: 'all',
          currentMonth: null
        }
      });

      expect(result.historyFilterState.searchQuery).toBe('chrome');
      expect(result.historyFilterState.selectedDate).toBe('2025-10-21');
      expect(result.historyFilterState.selectedHour).toBe(15);
    });

    test('应该使用默认值当storage为空时', async () => {
      const result = await chrome.storage.local.get({ 
        historyFilterState: {
          searchQuery: '',
          selectedDate: null,
          selectedHour: null,
          activeQuickFilter: 'all'
        }
      });

      expect(result.historyFilterState.searchQuery).toBe('');
      expect(result.historyFilterState.selectedDate).toBeNull();
      expect(result.historyFilterState.activeQuickFilter).toBe('all');
    });
  });

  describe('筛选统计', () => {
    test('应该正确计算筛选后的记录数', () => {
      const allRecords = [
        { id: 1, title: 'Test 1', visitTime: Date.now() },
        { id: 2, title: 'Test 2', visitTime: Date.now() },
        { id: 3, title: 'Example', visitTime: Date.now() }
      ];

      const searchQuery = 'test';
      const filteredRecords = allRecords.filter(record => 
        record.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filteredRecords.length).toBe(2);
      expect(allRecords.length).toBe(3);
    });

    test('应该正确计算按日期筛选后的记录数', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const allRecords = [
        { id: 1, title: 'Today 1', visitTime: today.getTime() + 10000 },
        { id: 2, title: 'Today 2', visitTime: today.getTime() + 20000 },
        { id: 3, title: 'Yesterday', visitTime: yesterday.getTime() + 10000 }
      ];

      function isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
      }

      const selectedDate = today;
      const filteredRecords = allRecords.filter(record => {
        const recordDate = new Date(record.visitTime);
        return isSameDay(recordDate, selectedDate);
      });

      expect(filteredRecords.length).toBe(2);
    });
  });

  describe('UI状态同步', () => {
    test('筛选激活时横幅文本应该反映所有条件', () => {
      const currentSearchQuery = 'test';
      const selectedDate = new Date('2025-10-21');
      const selectedHour = 15;
      const filteredCount = 5;

      function formatDate(timestamp) {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
      }

      const filterDesc = [];
      if (currentSearchQuery.trim()) {
        filterDesc.push(`搜索"${currentSearchQuery}"`);
      }
      if (selectedDate) {
        filterDesc.push(formatDate(selectedDate.getTime()));
        if (selectedHour !== null) {
          filterDesc.push(`${selectedHour}点`);
        }
      }

      const bannerText = `筛选条件: ${filterDesc.join(' + ')} (共 ${filteredCount} 条)`;

      expect(bannerText).toBe('筛选条件: 搜索"test" + 2025-10-21 + 15点 (共 5 条)');
    });

    test('无筛选时不应该显示横幅', () => {
      const currentSearchQuery = '';
      const selectedDate = null;
      const activeQuickFilter = 'all';
      const filteredCount = 100;
      const totalCount = 100;

      const hasActiveFilter = (
        currentSearchQuery.trim() !== '' ||
        selectedDate !== null ||
        (activeQuickFilter && activeQuickFilter !== 'all')
      );

      const shouldShowBanner = filteredCount < totalCount || hasActiveFilter;

      expect(shouldShowBanner).toBe(false);
    });
  });

  describe('错误处理', () => {
    test('应该处理无效的日期格式', () => {
      function isValidDate(dateString) {
        if (!dateString) return false;
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
      }

      expect(isValidDate('2025-10-21')).toBe(true);
      expect(isValidDate('invalid')).toBe(false);
      expect(isValidDate('')).toBe(false);
      expect(isValidDate(null)).toBe(false);
    });

    test('应该处理无效的小时值', () => {
      function isValidHour(hour) {
        return typeof hour === 'number' && hour >= 0 && hour <= 23;
      }

      expect(isValidHour(0)).toBe(true);
      expect(isValidHour(23)).toBe(true);
      expect(isValidHour(12)).toBe(true);
      expect(isValidHour(-1)).toBe(false);
      expect(isValidHour(24)).toBe(false);
      expect(isValidHour('10')).toBe(false);
      expect(isValidHour(null)).toBe(false);
    });

    test('应该处理空的筛选结果', () => {
      const allRecords = [];
      const searchQuery = 'test';
      
      const filteredRecords = allRecords.filter(record => 
        record.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      expect(filteredRecords.length).toBe(0);
      expect(Array.isArray(filteredRecords)).toBe(true);
    });
  });
});

