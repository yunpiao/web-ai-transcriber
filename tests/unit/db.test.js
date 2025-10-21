/**
 * 数据库操作单元测试
 */

// Mock IndexedDB
require('fake-indexeddb/auto');
const { createMockHistoryRecord, createMockHistoryRecords } = require('../helpers/fixtures');

// 导入要测试的函数
// 注意：由于db.js是ES模块格式，我们需要模拟它的功能
const DB_NAME = 'PageHistoryDB';
const DB_VERSION = 1;
const STORE_NAME = 'pageHistory';

// 复制db.js中的函数用于测试
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('url', 'url', { unique: false });
        objectStore.createIndex('visitTime', 'visitTime', { unique: false });
        objectStore.createIndex('domain', 'domain', { unique: false });
      }
    };
  });
}

async function saveHistory(historyData) {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.add(historyData);
    
    request.onsuccess = () => {
      db.close();
      resolve(request.result);
    };
    
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function getAllHistory() {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.getAll();
    
    request.onsuccess = () => {
      const records = request.result.sort((a, b) => b.visitTime - a.visitTime);
      db.close();
      resolve(records);
    };
    
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function deleteHistory(id) {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.delete(id);
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

async function clearAllHistory() {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const objectStore = transaction.objectStore(STORE_NAME);
    const request = objectStore.clear();
    
    request.onsuccess = () => {
      db.close();
      resolve();
    };
    
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

describe('数据库操作测试', () => {
  beforeEach(async () => {
    // 每个测试前清空数据库
    try {
      await clearAllHistory();
    } catch (e) {
      // 数据库可能还不存在，忽略错误
    }
  });

  afterEach(async () => {
    // 清理
    try {
      await clearAllHistory();
    } catch (e) {
      // 忽略错误
    }
  });

  test('应该能够初始化数据库', async () => {
    const db = await initDB();
    expect(db).toBeDefined();
    expect(db.name).toBe(DB_NAME);
    expect(db.objectStoreNames.contains(STORE_NAME)).toBe(true);
    db.close();
  });

  test('应该能够保存历史记录', async () => {
    const record = createMockHistoryRecord();
    const id = await saveHistory(record);
    
    expect(id).toBe(record.id);
    
    const allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(1);
    expect(allRecords[0]).toMatchObject(record);
  });

  test('应该能够获取所有历史记录', async () => {
    const records = createMockHistoryRecords(3);
    
    for (const record of records) {
      await saveHistory(record);
    }
    
    const allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(3);
  });

  test('应该按时间倒序返回记录', async () => {
    const record1 = createMockHistoryRecord({ id: 1000, visitTime: 1000 });
    const record2 = createMockHistoryRecord({ id: 2000, visitTime: 2000 });
    const record3 = createMockHistoryRecord({ id: 3000, visitTime: 3000 });
    
    await saveHistory(record1);
    await saveHistory(record3);
    await saveHistory(record2);
    
    const allRecords = await getAllHistory();
    expect(allRecords[0].id).toBe(3000); // 最新的在前
    expect(allRecords[1].id).toBe(2000);
    expect(allRecords[2].id).toBe(1000);
  });

  test('应该能够删除单条记录', async () => {
    const records = createMockHistoryRecords(3);
    
    for (const record of records) {
      await saveHistory(record);
    }
    
    await deleteHistory(records[1].id);
    
    const allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(2);
    expect(allRecords.find(r => r.id === records[1].id)).toBeUndefined();
  });

  test('应该能够清空所有记录', async () => {
    const records = createMockHistoryRecords(5);
    
    for (const record of records) {
      await saveHistory(record);
    }
    
    let allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(5);
    
    await clearAllHistory();
    
    allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(0);
  });

  test('不应该保存重复ID的记录', async () => {
    const record = createMockHistoryRecord({ id: 12345 });
    
    await saveHistory(record);
    
    // 尝试保存相同ID的记录
    await expect(saveHistory({ ...record, title: 'Different Title' }))
      .rejects
      .toThrow();
  });

  test('应该正确处理空数据库', async () => {
    const allRecords = await getAllHistory();
    expect(allRecords).toHaveLength(0);
    expect(Array.isArray(allRecords)).toBe(true);
  });
});

