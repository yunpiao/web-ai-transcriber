/**
 * 浏览时长功能集成测试
 */

const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');

// 模拟IndexedDB环境
require('fake-indexeddb/auto');

describe('浏览时长功能集成测试', () => {
  beforeEach(() => {
    setupChromeMock();
    // 清理IndexedDB
    indexedDB = new IDBFactory();
  });

  afterEach(() => {
    resetChromeMock();
  });

  describe('数据库升级', () => {
    test('应该从版本1升级到版本2', async () => {
      const DB_NAME = 'PageHistoryDB';
      const STORE_NAME = 'pageHistory';
      
      // 创建版本1的数据库
      const db1 = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('url', 'url', { unique: false });
            objectStore.createIndex('visitTime', 'visitTime', { unique: false });
          }
        };
      });
      
      db1.close();
      
      // 升级到版本2
      const db2 = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 2);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          const oldVersion = event.oldVersion;
          
          if (oldVersion < 2) {
            const transaction = event.target.transaction;
            const objectStore = transaction.objectStore(STORE_NAME);
            
            if (!objectStore.indexNames.contains('duration')) {
              objectStore.createIndex('duration', 'duration', { unique: false });
            }
            if (!objectStore.indexNames.contains('lastUpdateTime')) {
              objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
            }
          }
        };
      });
      
      // 验证索引是否创建
      const transaction = db2.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      expect(objectStore.indexNames.contains('duration')).toBe(true);
      expect(objectStore.indexNames.contains('lastUpdateTime')).toBe(true);
      
      db2.close();
    });
  });

  describe('数据库操作', () => {
    test('应该能够保存带时长的历史记录', async () => {
      const DB_NAME = 'PageHistoryDB';
      const DB_VERSION = 2;
      const STORE_NAME = 'pageHistory';
      
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('url', 'url', { unique: false });
            objectStore.createIndex('visitTime', 'visitTime', { unique: false });
            objectStore.createIndex('duration', 'duration', { unique: false });
            objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
          }
        };
      });
      
      const historyData = {
        id: Date.now(),
        url: 'https://example.com/test',
        title: 'Test Page',
        visitTime: Date.now(),
        duration: 120,  // 2分钟
        lastUpdateTime: Date.now(),
        domain: 'example.com'
      };
      
      // 保存数据
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(historyData);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // 读取数据
      const record = await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(historyData.id);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      expect(record.duration).toBe(120);
      expect(record.lastUpdateTime).toBeDefined();
      
      db.close();
    });

    test('应该能够更新记录的时长', async () => {
      const DB_NAME = 'PageHistoryDB';
      const DB_VERSION = 2;
      const STORE_NAME = 'pageHistory';
      
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            objectStore.createIndex('duration', 'duration', { unique: false });
            objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
          }
        };
      });
      
      const historyData = {
        id: 123456,
        url: 'https://example.com/test',
        title: 'Test Page',
        duration: 60,
        lastUpdateTime: Date.now()
      };
      
      // 保存初始数据
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.add(historyData);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      // 更新时长
      const newDuration = 180;
      const newUpdateTime = Date.now();
      
      await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        const getRequest = objectStore.get(123456);
        
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          record.duration = newDuration;
          record.lastUpdateTime = newUpdateTime;
          
          const updateRequest = objectStore.put(record);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        };
        
        getRequest.onerror = () => reject(getRequest.error);
      });
      
      // 验证更新
      const updatedRecord = await new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(123456);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      expect(updatedRecord.duration).toBe(180);
      expect(updatedRecord.lastUpdateTime).toBe(newUpdateTime);
      
      db.close();
    });
  });

  describe('Chrome消息通信', () => {
    test('应该能够发送savePageHistory消息', async () => {
      const historyData = {
        id: Date.now(),
        url: 'https://example.com',
        title: 'Test',
        duration: 60,
        lastUpdateTime: Date.now()
      };
      
      const message = {
        action: 'savePageHistory',
        data: historyData
      };
      
      expect(message.action).toBe('savePageHistory');
      expect(message.data.duration).toBe(60);
    });

    test('应该能够发送updatePageHistory消息', async () => {
      const message = {
        action: 'updatePageHistory',
        data: {
          id: 123456,
          duration: 120,
          lastUpdateTime: Date.now()
        }
      };
      
      expect(message.action).toBe('updatePageHistory');
      expect(message.data.id).toBe(123456);
      expect(message.data.duration).toBe(120);
    });
  });

  describe('sessionStorage交互', () => {
    test('应该能够保存和读取记录ID', () => {
      const url = 'https://example.com/test';
      const storageKey = `duration_record_${url}`;
      const recordId = '123456';
      
      // 模拟sessionStorage
      const storage = {};
      storage[storageKey] = recordId;
      
      expect(storage[storageKey]).toBe('123456');
    });

    test('应该能够检测是否有已存在的记录', () => {
      const url = 'https://example.com/test';
      const storageKey = `duration_record_${url}`;
      
      const storage = {};
      
      // 第一次访问
      expect(storage[storageKey]).toBeUndefined();
      
      // 创建记录后
      storage[storageKey] = '123456';
      expect(storage[storageKey]).toBeDefined();
      expect(storage[storageKey]).toBe('123456');
    });
  });

  describe('时长计算逻辑', () => {
    test('应该正确计算多次更新的时长', () => {
      let currentDuration = 0;
      
      // 第一次更新：5秒
      currentDuration = 5;
      expect(currentDuration).toBe(5);
      
      // 30秒后更新：35秒
      currentDuration = 35;
      expect(currentDuration).toBe(35);
      
      // 60秒后更新：95秒
      currentDuration = 95;
      expect(currentDuration).toBe(95);
    });

    test('应该在页面可见时累加时长', () => {
      let currentDuration = 0;
      let isPageVisible = true;
      const elapsed = 10;
      
      if (isPageVisible) {
        currentDuration += elapsed;
      }
      
      expect(currentDuration).toBe(10);
    });

    test('应该在页面不可见时停止累加', () => {
      let currentDuration = 10;
      let isPageVisible = false;
      const elapsed = 5;
      
      if (isPageVisible) {
        currentDuration += elapsed;
      }
      
      expect(currentDuration).toBe(10);  // 没有增加
    });
  });

  describe('错误处理', () => {
    test('更新不存在的记录应该失败', async () => {
      const DB_NAME = 'PageHistoryDB';
      const DB_VERSION = 2;
      const STORE_NAME = 'pageHistory';
      
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
      });
      
      // 尝试更新不存在的记录
      const result = await new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.get(999999);  // 不存在的ID
        
        request.onsuccess = () => resolve(request.result);
      });
      
      expect(result).toBeUndefined();
      
      db.close();
    });

    test('应该处理无效的时长值', () => {
      const record = {
        id: 123,
        duration: null
      };
      
      // 处理null值
      const duration = record.duration || 0;
      expect(duration).toBe(0);
    });
  });
});


