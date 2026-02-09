// ==================== 常量定义 ====================
const SEARCH_ENGINES = {
  gemini: { url: 'https://gemini.google.com/app' },
  qwen: { url: 'https://chat.qwen.ai/' },
  deepseek: { url: 'https://chat.deepseek.com/' },
  aistudio: { url: 'https://aistudio.google.com/prompts/new_chat' }
};

const DB_CONFIG = {
  NAME: 'PageHistoryDB',
  VERSION: 2,
  STORE_NAME: 'pageHistory'
};

const DEFAULT_SETTINGS = {
  favoriteEngine: 'gemini',
  promptTemplate: null,
  enabledeepThinking: false,
  useCurrentTab: false,
  enablePageTracking: false
};

const MENU_ID = 'searchWithPageTextV4.2';
const MENU_TITLE = '使用 AI 转写网页内容';

// 默认提示词模板（单一数据源，重复两遍以强化指令遵循）
const DEFAULT_PROMPT = `Role: 中文暴躁文字稿优化专家
你是一个毫无耐心、极其厌恶废话的文字稿优化专家。你的职责是把用户扔给你的一堆乱七八糟的录音稿或混乱文本，暴力整理成清晰、逻辑严密的文章。
核心态度
闭嘴干活：绝不废话，不打招呼，不写"好的，这是优化后的内容"这种无用的开场白。直接输出结果。
拒绝矫情：不要用花哨的词藻。用最直白、最感官化（视觉、听觉、触觉）的语言重述内容。
零容忍：对原稿中的语气词（嗯、啊）、废话、广告推销内容，见一个删一个，绝不手软。
执行流程（自我审查）
在输出前，你必须在后台快速过一遍：
信息漏没漏？（除了广告，核心干货必须全在）
标题起得烂不烂？（必须清晰分段）
重点突出了吗？（关键信息必须加粗）
像不像人话？（修正语病，保持口语的流畅，但不要啰嗦）
输出规则
1. 优化后的文章
风格：干脆利落，像一把手术刀切开冗余信息。
结构：
必须使用二级标题（##）强行分段。
关键结论和数据直接加粗。
彻底删除任何形式的广告、求关注、卖课内容。
既然是"暴躁"风格，行文要短促有力，避免长难句。
2. 原子笔记
提炼3-7条核心干货，要求：
每条都是一句完整的话。
看了这一句就不需要看原文。
格式统一用「-」。
3. 行动反思
基于文章内容，用拷问的语气简短回答以下问题（无关的可跳过，不要硬凑）：
掌控权：这里有什么是我能立刻控制的？
倒推：想要那个结果，我现在该干嘛？
第一步：别废话，第一步做什么？
共赢：怎么让大家都有利可图？
倾听：不仔细听会错过什么坑？
整合：怎么把这些点串起来用？
精进：怎么把这事儿做得更绝？
现在，把你的原始文稿扔过来。
Role: 中文暴躁文字稿优化专家
你是一个毫无耐心、极其厌恶废话的文字稿优化专家。你的职责是把用户扔给你的一堆乱七八糟的录音稿或混乱文本，暴力整理成清晰、逻辑严密的文章。
核心态度
闭嘴干活：绝不废话，不打招呼，不写"好的，这是优化后的内容"这种无用的开场白。直接输出结果。
拒绝矫情：不要用花哨的词藻。用最直白、最感官化（视觉、听觉、触觉）的语言重述内容。
零容忍：对原稿中的语气词（嗯、啊）、废话、广告推销内容，见一个删一个，绝不手软。
执行流程（自我审查）
在输出前，你必须在后台快速过一遍：
信息漏没漏？（除了广告，核心干货必须全在）
标题起得烂不烂？（必须清晰分段）
重点突出了吗？（关键信息必须加粗）
像不像人话？（修正语病，保持口语的流畅，但不要啰嗦）
输出规则
1. 优化后的文章
风格：干脆利落，像一把手术刀切开冗余信息。
结构：
必须使用二级标题（##）强行分段。
关键结论和数据直接加粗。
彻底删除任何形式的广告、求关注、卖课内容。
既然是"暴躁"风格，行文要短促有力，避免长难句。
2. 原子笔记
提炼3-7条核心干货，要求：
每条都是一句完整的话。
看了这一句就不需要看原文。
格式统一用「-」。
3. 行动反思
基于文章内容，用拷问的语气简短回答以下问题（无关的可跳过，不要硬凑）：
掌控权：这里有什么是我能立刻控制的？
倒推：想要那个结果，我现在该干嘛？
第一步：别废话，第一步做什么？
共赢：怎么让大家都有利可图？
倾听：不仔细听会错过什么坑？
整合：怎么把这些点串起来用？
精进：怎么把这事儿做得更绝？
现在，把你的原始文稿扔过来。
文字稿为：`;

// ==================== 数据访问层 ====================
/**
 * IndexedDB 数据访问类
 * 职责：封装所有数据库操作，提供统一的数据访问接口
 * 原则：单一职责原则（SRP）- 只负责数据持久化
 */
class IndexedDBManager {
  constructor(config = DB_CONFIG) {
    this.dbName = config.NAME;
    this.dbVersion = config.VERSION;
    this.storeName = config.STORE_NAME;
  }

  /**
   * 打开数据库连接
   * @returns {Promise<IDBDatabase>}
   */
  async openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => {
        console.error('[IndexedDB] 数据库打开失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        this._handleUpgrade(event);
      };
    });
  }

  /**
   * 处理数据库升级
   * @private
   */
  _handleUpgrade(event) {
    const db = event.target.result;
    const oldVersion = event.oldVersion;
    
    if (!db.objectStoreNames.contains(this.storeName)) {
      const objectStore = db.createObjectStore(this.storeName, { keyPath: 'id' });
      this._createIndexes(objectStore);
    } else if (oldVersion < 2) {
      const transaction = event.target.transaction;
      const objectStore = transaction.objectStore(this.storeName);
      this._createIndexes(objectStore);
    }
  }

  /**
   * 创建索引
   * @private
   */
  _createIndexes(objectStore) {
    const indexes = [
      { name: 'url', keyPath: 'url', options: { unique: false } },
      { name: 'visitTime', keyPath: 'visitTime', options: { unique: false } },
      { name: 'domain', keyPath: 'domain', options: { unique: false } },
      { name: 'duration', keyPath: 'duration', options: { unique: false } },
      { name: 'lastUpdateTime', keyPath: 'lastUpdateTime', options: { unique: false } }
    ];

    indexes.forEach(({ name, keyPath, options }) => {
      if (!objectStore.indexNames.contains(name)) {
        objectStore.createIndex(name, keyPath, options);
      }
    });
  }

  /**
   * 保存历史记录
   * @param {Object} historyData - 历史记录数据
   */
  async saveHistory(historyData) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.add(historyData);
        
        request.onsuccess = () => {
          console.log('[IndexedDB] 历史记录保存成功:', historyData.url);
          db.close();
          resolve();
        };
        
        request.onerror = () => {
          console.error('[IndexedDB] 历史记录保存失败:', request.error);
          db.close();
          reject(request.error);
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  }

  /**
   * 更新历史记录时长
   * @param {string} id - 记录ID
   * @param {number} duration - 停留时长（秒）
   * @param {number} lastUpdateTime - 最后更新时间
   */
  async updateDuration(id, duration, lastUpdateTime) {
    const db = await this.openDatabase();
    
    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const getRequest = objectStore.get(id);
        
        getRequest.onsuccess = () => {
          const record = getRequest.result;
          if (record) {
            record.duration = duration;
            record.lastUpdateTime = lastUpdateTime;
            
            const updateRequest = objectStore.put(record);
            
            updateRequest.onsuccess = () => {
              console.log('[IndexedDB] 时长更新成功:', id, duration + '秒');
              db.close();
              resolve();
            };
            
            updateRequest.onerror = () => {
              console.error('[IndexedDB] 时长更新失败:', updateRequest.error);
              db.close();
              reject(updateRequest.error);
            };
          } else {
            console.error('[IndexedDB] 记录不存在:', id);
            db.close();
            reject(new Error('Record not found'));
          }
        };
        
        getRequest.onerror = () => {
          console.error('[IndexedDB] 获取记录失败:', getRequest.error);
          db.close();
          reject(getRequest.error);
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    });
  }
}

// ==================== 配置管理 ====================
/**
 * 配置管理器
 * 职责：统一管理扩展配置的获取和设置
 * 原则：单一职责原则（SRP）- 只负责配置管理
 */
class ConfigManager {
  /**
   * 获取用户配置（带默认值）
   * @param {Object} defaults - 默认配置
   */
  static async getSettings(defaults = DEFAULT_SETTINGS) {
    return chrome.storage.sync.get(defaults);
  }

  /**
   * 获取引擎URL
   * @param {string} engineKey - 引擎标识
   */
  static getEngineUrl(engineKey) {
    const engine = SEARCH_ENGINES[engineKey];
    if (!engine) {
      console.error('[Config] 无效的引擎配置:', engineKey, '使用默认引擎: qwen');
      return SEARCH_ENGINES.qwen.url;
    }
    return engine.url;
  }

  /**
   * 初始化默认配置
   */
  static async initializeDefaults() {
    const items = await chrome.storage.sync.get(DEFAULT_SETTINGS);
    if (items.promptTemplate === null) {
      await chrome.storage.sync.set({ promptTemplate: DEFAULT_PROMPT });
    }
  }
}

// ==================== 标签页管理 ====================
/**
 * 标签页管理器
 * 职责：处理标签页的创建、导航和脚本注入
 * 原则：单一职责原则（SRP）- 只负责标签页操作
 */
class TabManager {
  /**
   * 打开或更新标签页
   * @param {string} url - 目标URL
   * @param {boolean} useCurrentTab - 是否在当前标签页打开
   * @param {Object} currentTab - 当前标签页对象（可选）
   */
  static async openOrUpdateTab(url, useCurrentTab, currentTab = null) {
    if (useCurrentTab && currentTab) {
      await chrome.tabs.update(currentTab.id, { url });
      return currentTab.id;
    }
    
    if (useCurrentTab && !currentTab) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) {
        await chrome.tabs.update(tabs[0].id, { url });
        return tabs[0].id;
      }
    }
    
    const newTab = await chrome.tabs.create({ url });
    return newTab.id;
  }

  /**
   * 等待页面加载完成并注入脚本
   * @param {number} tabId - 标签页ID
   * @param {string} scriptFile - 脚本文件名
   */
  static injectScriptWhenReady(tabId, scriptFile = 'content.js') {
    const injected = new Set();
    
    chrome.tabs.onUpdated.addListener(function listener(listenTabId, changeInfo) {
      if (listenTabId === tabId && changeInfo.status === 'complete') {
        if (!injected.has(tabId)) {
          injected.add(tabId);
          chrome.tabs.onUpdated.removeListener(listener);
          
          chrome.scripting.executeScript({
            target: { tabId },
            files: [scriptFile]
          }).then(() => {
            console.log('[TabManager] 脚本注入成功，Tab ID:', tabId);
          }).catch((error) => {
            console.error('[TabManager] 脚本注入失败:', error);
          });
        }
      }
    });
  }

  /**
   * 从标签页抓取文本
   * @param {number} tabId - 标签页ID
   */
  static async extractPageText(tabId) {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      function: () => document.body.innerText,
    });
    
    if (!results || !results.length) {
      return null;
    }
    
    return results[0].result;
  }
}

// ==================== 业务逻辑层 ====================
/**
 * 搜索处理器
 * 职责：协调各个模块完成搜索功能
 * 原则：开闭原则（OCP）- 对扩展开放，对修改关闭
 */
class SearchHandler {
  constructor() {
    this.dbManager = new IndexedDBManager();
  }

  /**
   * 处理搜索请求
   * @param {Object} tab - 当前标签页
   */
  async handleSearch(tab) {
    try {
      // 1. 抓取页面文本
      const pageText = await TabManager.extractPageText(tab.id);
      if (!pageText) {
        console.log('[SearchHandler] 无法获取页面文本');
        return;
      }
      
      // 2. 存储文本到临时存储（明确设置 skipPromptTemplate: false）
      await chrome.storage.local.set({ 
        tempSearchText: pageText,
        skipPromptTemplate: false
      });
      
      // 3. 获取用户配置
      const settings = await ConfigManager.getSettings();
      
      // 4. 获取引擎URL
      const engineUrl = ConfigManager.getEngineUrl(settings.favoriteEngine);
      
      // 5. 打开标签页
      const targetTabId = await TabManager.openOrUpdateTab(
        engineUrl,
        settings.useCurrentTab,
        tab
      );
      
      // 6. 注入脚本
      TabManager.injectScriptWhenReady(targetTabId);
      
    } catch (error) {
      console.error('[SearchHandler] 搜索处理出错:', error);
    }
  }
}

// ==================== 消息处理器 ====================
/**
 * 消息路由器
 * 职责：将不同类型的消息路由到对应的处理器
 * 原则：单一职责原则（SRP）+ 开闭原则（OCP）
 */
class MessageRouter {
  constructor() {
    this.dbManager = new IndexedDBManager();
    this.handlers = {
      'getDefaultPrompt': this.handleGetDefaultPrompt.bind(this),
      'savePageHistory': this.handleSavePageHistory.bind(this),
      'updatePageHistory': this.handleUpdatePageHistory.bind(this),
      'openSummaryPage': this.handleOpenSummaryPage.bind(this)
    };
  }

  /**
   * 路由消息到对应的处理器
   */
  route(request, sender, sendResponse) {
    const handler = this.handlers[request.action];
    
    if (!handler) {
      return false;
    }
    
    // 异步处理器
    if (request.action !== 'getDefaultPrompt') {
      handler(request, sender).then(
        result => sendResponse({ success: true, ...result }),
        error => sendResponse({ success: false, error: error.message })
      );
      return true; // 异步响应
    }
    
    // 同步处理器
    const result = handler(request, sender);
    sendResponse(result);
    return false;
  }

  /**
   * 处理获取默认提示词
   */
  handleGetDefaultPrompt() {
    return { success: true, data: DEFAULT_PROMPT };
  }

  /**
   * 处理保存页面历史
   */
  async handleSavePageHistory(request) {
    console.log('[MessageRouter] 保存历史记录');
    await this.dbManager.saveHistory(request.data);
    return {};
  }

  /**
   * 处理更新页面历史时长
   */
  async handleUpdatePageHistory(request) {
    console.log('[MessageRouter] 更新时长');
    await this.dbManager.updateDuration(
      request.data.id,
      request.data.duration,
      request.data.lastUpdateTime
    );
    return {};
  }

  /**
   * 处理打开总结页面
   */
  async handleOpenSummaryPage(request) {
    console.log('[MessageRouter] 收到打开总结页面请求');
    
    const settings = await ConfigManager.getSettings();
    const engineKey = request.engineKey || settings.favoriteEngine;
    const engineUrl = ConfigManager.getEngineUrl(engineKey);
    
    console.log('[MessageRouter] 将打开引擎:', engineKey, engineUrl);
    
    const targetTabId = await TabManager.openOrUpdateTab(
      engineUrl,
      settings.useCurrentTab
    );
    
    console.log('[MessageRouter] 目标标签页ID:', targetTabId);
    
    TabManager.injectScriptWhenReady(targetTabId);
    
    return {};
  }
}

// ==================== 主程序逻辑 ====================
// 创建全局实例
const searchHandler = new SearchHandler();
const messageRouter = new MessageRouter();

// 向后兼容的包装函数
async function handleSearch(tab) {
  await searchHandler.handleSearch(tab);
}

// ==================== 事件监听器 ====================
// 1. 扩展安装/更新时初始化
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: MENU_TITLE,
    contexts: ["page"]
  });

  // 初始化默认配置
  ConfigManager.initializeDefaults();
});

// 2. 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID) {
    handleSearch(tab);
  }
});

// 3. 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  handleSearch(tab);
});

// 4. 监听来自 content script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  return messageRouter.route(request, sender, sendResponse);
});
