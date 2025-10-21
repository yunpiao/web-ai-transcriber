// IndexedDB 数据库管理模块
const DB_NAME = 'PageHistoryDB';
const DB_VERSION = 2;  // 升级到版本2，添加时长记录功能
const STORE_NAME = 'pageHistory';

// 初始化数据库
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('数据库打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      // 如果对象存储不存在，创建它
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // 创建索引以便查询
        objectStore.createIndex('url', 'url', { unique: false });
        objectStore.createIndex('visitTime', 'visitTime', { unique: false });
        objectStore.createIndex('domain', 'domain', { unique: false });
        objectStore.createIndex('duration', 'duration', { unique: false });
        objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
        
        console.log('数据库对象存储创建成功');
      } else if (oldVersion < 2) {
        // 升级到版本2：添加时长字段索引
        const transaction = event.target.transaction;
        const objectStore = transaction.objectStore(STORE_NAME);
        
        // 创建新索引
        if (!objectStore.indexNames.contains('duration')) {
          objectStore.createIndex('duration', 'duration', { unique: false });
        }
        if (!objectStore.indexNames.contains('lastUpdateTime')) {
          objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
        }
        
        console.log('数据库升级到版本2：添加时长字段');
      }
    };
  });
}

// 保存历史记录
async function saveHistory(historyData) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      
      // 添加记录
      const request = objectStore.add(historyData);
      
      request.onsuccess = () => {
        console.log('历史记录保存成功:', historyData.url);
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('历史记录保存失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('保存历史记录时出错:', error);
    throw error;
  }
}

// 获取所有历史记录
async function getAllHistory() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        // 按时间倒序排序
        const records = request.result.sort((a, b) => b.visitTime - a.visitTime);
        resolve(records);
      };
      
      request.onerror = () => {
        console.error('获取历史记录失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('获取历史记录时出错:', error);
    throw error;
  }
}

// 删除单条历史记录
async function deleteHistory(id) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);
      
      request.onsuccess = () => {
        console.log('历史记录删除成功:', id);
        resolve();
      };
      
      request.onerror = () => {
        console.error('历史记录删除失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('删除历史记录时出错:', error);
    throw error;
  }
}

// 清空所有历史记录
async function clearAllHistory() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.clear();
      
      request.onsuccess = () => {
        console.log('所有历史记录已清空');
        resolve();
      };
      
      request.onerror = () => {
        console.error('清空历史记录失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('清空历史记录时出错:', error);
    throw error;
  }
}

// 获取历史记录统计
async function getHistoryStats() {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.count();
      
      request.onsuccess = () => {
        resolve({ total: request.result });
      };
      
      request.onerror = () => {
        console.error('获取统计信息失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('获取统计信息时出错:', error);
    throw error;
  }
}

// 根据URL获取历史记录
async function getHistoryByUrl(url) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('url');
      const request = index.getAll(url);
      
      request.onsuccess = () => {
        // 返回最新的一条记录（按visitTime降序）
        const records = request.result.sort((a, b) => b.visitTime - a.visitTime);
        resolve(records.length > 0 ? records[0] : null);
      };
      
      request.onerror = () => {
        console.error('查询历史记录失败:', request.error);
        reject(request.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('查询历史记录时出错:', error);
    throw error;
  }
}

// 更新历史记录的停留时长
async function updateHistoryDuration(id, duration, lastUpdateTime) {
  try {
    const db = await initDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.get(id);
      
      getRequest.onsuccess = () => {
        const record = getRequest.result;
        if (record) {
          record.duration = duration;
          record.lastUpdateTime = lastUpdateTime;
          
          const updateRequest = objectStore.put(record);
          
          updateRequest.onsuccess = () => {
            console.log('[数据库] 时长更新成功:', id, duration + '秒');
            resolve();
          };
          
          updateRequest.onerror = () => {
            console.error('[数据库] 时长更新失败:', updateRequest.error);
            reject(updateRequest.error);
          };
        } else {
          console.error('[数据库] 记录不存在:', id);
          reject(new Error('Record not found'));
        }
      };
      
      getRequest.onerror = () => {
        console.error('[数据库] 获取记录失败:', getRequest.error);
        reject(getRequest.error);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('更新时长时出错:', error);
    throw error;
  }
}

// 导出函数供ES模块使用
export { 
  initDB, 
  saveHistory, 
  getAllHistory, 
  deleteHistory, 
  clearAllHistory, 
  getHistoryStats,
  getHistoryByUrl,
  updateHistoryDuration
};

