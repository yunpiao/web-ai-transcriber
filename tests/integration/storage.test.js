/**
 * 存储功能集成测试
 */

const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');
const { createMockSettings } = require('../helpers/fixtures');

describe('存储功能集成测试', () => {
  beforeEach(() => {
    setupChromeMock();
  });

  afterEach(() => {
    resetChromeMock();
  });

  describe('chrome.storage.sync 测试', () => {
    test('应该能够保存配置', async () => {
      const settings = createMockSettings();
      
      await chrome.storage.sync.set(settings);
      
      const result = await chrome.storage.sync.get(Object.keys(settings));
      expect(result).toMatchObject(settings);
    });

    test('应该能够读取配置', async () => {
      const settings = {
        enablePageTracking: true,
        favoriteEngine: 'deepseek'
      };
      
      await chrome.storage.sync.set(settings);
      
      const result = await chrome.storage.sync.get(['enablePageTracking', 'favoriteEngine']);
      expect(result.enablePageTracking).toBe(true);
      expect(result.favoriteEngine).toBe('deepseek');
    });

    test('应该使用默认值（当配置不存在时）', async () => {
      const defaults = {
        enablePageTracking: false,
        favoriteEngine: 'qwen'
      };
      
      const result = await chrome.storage.sync.get(defaults);
      expect(result).toMatchObject(defaults);
    });

    test('应该能够删除配置', async () => {
      await chrome.storage.sync.set({ testKey: 'testValue' });
      await chrome.storage.sync.remove('testKey');
      
      const result = await chrome.storage.sync.get('testKey');
      expect(result.testKey).toBeUndefined();
    });

    test('应该能够清空所有配置', async () => {
      await chrome.storage.sync.set({
        key1: 'value1',
        key2: 'value2'
      });
      
      await chrome.storage.sync.clear();
      
      const result = await chrome.storage.sync.get(['key1', 'key2']);
      expect(result.key1).toBeUndefined();
      expect(result.key2).toBeUndefined();
    });
  });

  describe('chrome.storage.local 测试', () => {
    test('应该能够保存临时数据', async () => {
      const tempData = { tempSearchText: 'Test page content' };
      
      await chrome.storage.local.set(tempData);
      
      const result = await chrome.storage.local.get('tempSearchText');
      expect(result.tempSearchText).toBe('Test page content');
    });

    test('应该能够删除临时数据', async () => {
      await chrome.storage.local.set({ tempSearchText: 'Test' });
      await chrome.storage.local.remove('tempSearchText');
      
      const result = await chrome.storage.local.get('tempSearchText');
      expect(result.tempSearchText).toBeUndefined();
    });
  });

  describe('sync vs local 隔离测试', () => {
    test('sync和local存储应该相互独立', async () => {
      await chrome.storage.sync.set({ sharedKey: 'sync value' });
      await chrome.storage.local.set({ sharedKey: 'local value' });
      
      const syncResult = await chrome.storage.sync.get('sharedKey');
      const localResult = await chrome.storage.local.get('sharedKey');
      
      expect(syncResult.sharedKey).toBe('sync value');
      expect(localResult.sharedKey).toBe('local value');
    });
  });
});

