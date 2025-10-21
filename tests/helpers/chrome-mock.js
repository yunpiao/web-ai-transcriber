// Chrome API Mock 工具
// 用于模拟Chrome扩展APIs

class ChromeStorageMock {
  constructor() {
    this.data = {};
  }

  get(keys, callback) {
    const result = {};
    
    if (typeof keys === 'string') {
      result[keys] = this.data[keys];
    } else if (Array.isArray(keys)) {
      // keys 是数组 - 需要先检查数组（因为数组也是对象）
      keys.forEach(key => {
        result[key] = this.data[key];
      });
    } else if (typeof keys === 'object' && keys !== null) {
      // keys 是默认值对象
      Object.keys(keys).forEach(key => {
        result[key] = this.data[key] !== undefined ? this.data[key] : keys[key];
      });
    }
    
    if (callback) {
      callback(result);
    }
    return Promise.resolve(result);
  }

  set(items, callback) {
    Object.assign(this.data, items);
    if (callback) {
      callback();
    }
    return Promise.resolve();
  }

  remove(keys, callback) {
    const keyArray = Array.isArray(keys) ? keys : [keys];
    keyArray.forEach(key => {
      delete this.data[key];
    });
    if (callback) {
      callback();
    }
    return Promise.resolve();
  }

  clear(callback) {
    this.data = {};
    if (callback) {
      callback();
    }
    return Promise.resolve();
  }
}

class ChromeRuntimeMock {
  constructor() {
    this.messageListeners = [];
    
    // 定义 onMessage 对象
    this.onMessage = {
      listeners: this.messageListeners,
      addListener: (callback) => {
        this.messageListeners.push(callback);
      },
      removeListener: (callback) => {
        const index = this.messageListeners.indexOf(callback);
        if (index > -1) {
          this.messageListeners.splice(index, 1);
        }
      }
    };
  }

  sendMessage(message, callback) {
    // 模拟消息发送
    const response = { success: true };
    if (callback) {
      callback(response);
    }
    return Promise.resolve(response);
  }

  getURL(path) {
    return `chrome-extension://mock-extension-id/${path}`;
  }
}

class ChromeTabsMock {
  constructor() {
    this.tabs = [];
    this.currentTabId = 1;
  }

  create(options, callback) {
    const tab = {
      id: this.currentTabId++,
      url: options.url,
      active: options.active !== false
    };
    this.tabs.push(tab);
    if (callback) {
      callback(tab);
    }
    return Promise.resolve(tab);
  }

  update(tabId, options, callback) {
    const tab = this.tabs.find(t => t.id === tabId);
    if (tab) {
      Object.assign(tab, options);
    }
    if (callback) {
      callback(tab);
    }
    return Promise.resolve(tab);
  }

  onUpdated = {
    addListener: jest.fn(),
    removeListener: jest.fn()
  };
}

// 创建全局chrome对象
function setupChromeMock() {
  global.chrome = {
    storage: {
      sync: new ChromeStorageMock(),
      local: new ChromeStorageMock()
    },
    runtime: new ChromeRuntimeMock(),
    tabs: new ChromeTabsMock()
  };
  
  return global.chrome;
}

// 重置mock
function resetChromeMock() {
  if (global.chrome) {
    global.chrome.storage.sync.clear();
    global.chrome.storage.local.clear();
    global.chrome.tabs.tabs = [];
    global.chrome.runtime.messageListeners.length = 0;
  }
}

module.exports = {
  setupChromeMock,
  resetChromeMock,
  ChromeStorageMock,
  ChromeRuntimeMock,
  ChromeTabsMock
};

