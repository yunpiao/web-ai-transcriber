// 定义搜索引擎的信息
const SEARCH_ENGINES = {
  gemini: {
    url: 'https://gemini.google.com/app',
  },
  qwen: {
    url: 'https://chat.qwen.ai/',
  },
  deepseek: {
    url: 'https://chat.deepseek.com/',
  },
  aistudio: {
    url: 'https://aistudio.google.com/app/prompts/new_chat',
  }
};

// 通用的处理搜索函数
async function handleSearch(tab) {
  try {
    // 1. 从当前页面抓取文本
    const injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => document.body.innerText,
    });
    
    if (!injectionResults || !injectionResults.length) return;
    
    const pageText = injectionResults[0].result;
    if (!pageText) return;
    
    // 2. 将抓取到的文本临时存入 storage
    await chrome.storage.local.set({ 'tempSearchText': pageText });
    
    // 3. 从 storage 读取用户配置
    const settings = await chrome.storage.sync.get({
      favoriteEngine: 'qwen',
      useCurrentTab: false,
      enabledeepThinking: true,
    });
    
    // 4. 根据配置打开对应的搜索引擎页面
    // 防御性检查：确保引擎配置有效
    const engineKey = settings.favoriteEngine || 'qwen';
    const engine = SEARCH_ENGINES[engineKey];
    let engineUrl;
    
    if (!engine) {
      console.error('[Background] 无效的引擎配置:', engineKey, '使用默认引擎: qwen');
      engineUrl = SEARCH_ENGINES['qwen'].url;
    } else {
      engineUrl = engine.url;
    }
    
    // 5. 根据用户设置决定是在当前标签页打开还是新建标签页
    let targetTabId;
    if (settings.useCurrentTab) {
      // 在当前标签页导航
      await chrome.tabs.update(tab.id, { url: engineUrl });
      targetTabId = tab.id;
    } else {
      // 打开新标签页
      const newTab = await chrome.tabs.create({ url: engineUrl });
      targetTabId = newTab.id;
    }
    
    // 6. 等待页面加载完成
    chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo, updatedTab) {
      if (tabId === targetTabId && changeInfo.status === 'complete') {
        // 移除监听器
        chrome.tabs.onUpdated.removeListener(listener);
        
        // 7. 将 content.js 注入到搜索页
        chrome.scripting.executeScript({
          target: { tabId: targetTabId },
          files: ["content.js"]
        });
      }
    });
  } catch (error) {
    console.error('搜索处理出错:', error);
  }
}

// 1. 创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "searchWithPageTextV4.2",
    title: "使用 AI 转写网页内容",
    contexts: ["page"]
  });

  // 初始化扩展时确保所有设置都有默认值
  chrome.storage.sync.get({
    favoriteEngine: 'qwen', // 默认搜索引擎
    promptTemplate: null, // 提示词可能还没有设置
    enabledeepThinking: false, // 默认不启用深度搜索
    useCurrentTab: false, // 默认不在当前页面打开
    enablePageTracking: false // 默认不启用页面追踪（新功能）
  }, (items) => {
    // 如果提示词模板未设置，设置默认值
    if (items.promptTemplate === null) {
      const defaultPrompt = `你将扮演一个'录音文字稿'优化器，将用户发送的视频文字稿优化为一篇结构清晰、内容准确且易于阅读的文章。你必须严格遵循以下规则来优化文稿：
目的和目标：
* 接收用户提供的视频文字稿。
* 优化文稿，使其具备更好的可读性和结构。
* 保留文稿中的所有核心信息，确保信息的完整性。
* 最终产出一篇适合保存和后续阅读的文章。
行为和规则：
1. 内容优化：
    a) 为文字稿添加适当的二级标题，以帮助组织内容并提升阅读体验。
    b) 将文字稿中的重要内容进行加粗处理，突出重点信息。
    c) 将文字稿合理分段落，避免大段文字堆砌，使结构更清晰。
    d) 仔细校对并修改文字稿中的错别字、语法错误和标点符号问题。
    e) 识别并彻底删除文字稿中所有的广告部分（包括但不限于推销信息、产品宣传等）。
    f) 优化口语化表述，将其转换为书面化语言，去除冗余的语气词（例如：'嗯'、'啊'、'呃'、'那个'等），使文稿更流畅、专业。
2. 格式和结构：
    a) 尽可能避免使用多层级的无序列表。如果必须使用列表，请尽量使用单层级列表，或考虑将其转换为段落文字。
    b) 优化后的文字稿应以文章形式呈现，而不是简单的文字堆砌。
3. 信息保留：
    a) 你的首要任务是保留文字稿的所有原始信息。在优化过程中，不得删除任何非广告性的内容，确保信息的完整性。
    b) 任何修改都应以提升可读性为目标，而不是改变原意。
整体语气：
* 保持专业、严谨和细致。
* 提供清晰、准确的优化结果。
* 专注于文字稿的优化工作，不进行额外的评论或问答。 文字稿为：`;

      chrome.storage.sync.set({
        promptTemplate: defaultPrompt
      });
    }
  });
});

// 2. 监听右键菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "searchWithPageTextV4.2") {
    handleSearch(tab);
  }
});

// 3. 监听扩展图标点击事件
chrome.action.onClicked.addListener((tab) => {
  handleSearch(tab);
});

// 4. 监听来自 content script 的消息（页面追踪功能）
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'savePageHistory') {
    // 保存数据到 IndexedDB
    (async () => {
      try {
        // 使用 IndexedDB 保存数据
        await saveHistoryToDB(request.data);
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Background] 保存历史记录失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    // 返回 true 表示异步响应
    return true;
  }
  
  if (request.action === 'updatePageHistory') {
    // 更新历史记录的停留时长
    (async () => {
      try {
        await updateHistoryDurationToDB(request.data.id, request.data.duration, request.data.lastUpdateTime);
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Background] 更新时长失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    // 返回 true 表示异步响应
    return true;
  }
  
  if (request.action === 'openSummaryPage') {
    // 打开总结页面（从历史记录页面调用）
    (async () => {
      try {
        console.log('[Background] 收到打开总结页面请求');
        
        // 读取用户配置
        const settings = await chrome.storage.sync.get({
          favoriteEngine: 'qwen',
          useCurrentTab: false
        });
        
        // 确定引擎URL
        const engineKey = request.engineKey || settings.favoriteEngine || 'qwen';
        const engine = SEARCH_ENGINES[engineKey];
        let engineUrl;
        
        if (!engine) {
          console.error('[Background] 无效的引擎配置:', engineKey, '使用默认引擎: qwen');
          engineUrl = SEARCH_ENGINES['qwen'].url;
        } else {
          engineUrl = engine.url;
        }
        
        console.log('[Background] 将打开引擎:', engineKey, engineUrl);
        
        // 打开/更新标签页
        let targetTabId;
        if (settings.useCurrentTab) {
          // 在当前标签页打开
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs && tabs[0]) {
            await chrome.tabs.update(tabs[0].id, { url: engineUrl });
            targetTabId = tabs[0].id;
          } else {
            // 如果没有活动标签页，创建新标签页
            const newTab = await chrome.tabs.create({ url: engineUrl });
            targetTabId = newTab.id;
          }
        } else {
          // 在新标签页打开
          const newTab = await chrome.tabs.create({ url: engineUrl });
          targetTabId = newTab.id;
        }
        
        console.log('[Background] 目标标签页ID:', targetTabId);
        
        // 监听页面加载完成后注入content.js
        chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
          if (tabId === targetTabId && changeInfo.status === 'complete') {
            console.log('[Background] 页面加载完成，注入content.js');
            chrome.tabs.onUpdated.removeListener(listener);
            
            chrome.scripting.executeScript({
              target: { tabId: targetTabId },
              files: ["content.js"]
            }).then(() => {
              console.log('[Background] content.js 注入成功');
            }).catch((error) => {
              console.error('[Background] content.js 注入失败:', error);
            });
          }
        });
        
        sendResponse({ success: true });
      } catch (error) {
        console.error('[Background] 打开总结页面失败:', error);
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    // 返回 true 表示异步响应
    return true;
  }
});

// IndexedDB 操作函数（在 background service worker 中）
async function saveHistoryToDB(historyData) {
  const DB_NAME = 'PageHistoryDB';
  const DB_VERSION = 2;  // 升级到版本2
  const STORE_NAME = 'pageHistory';
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('数据库打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const addRequest = objectStore.add(historyData);
      
      addRequest.onsuccess = () => {
        console.log('历史记录保存成功:', historyData.url);
        db.close();
        resolve();
      };
      
      addRequest.onerror = () => {
        console.error('历史记录保存失败:', addRequest.error);
        db.close();
        reject(addRequest.error);
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('url', 'url', { unique: false });
        objectStore.createIndex('visitTime', 'visitTime', { unique: false });
        objectStore.createIndex('domain', 'domain', { unique: false });
        objectStore.createIndex('duration', 'duration', { unique: false });
        objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
      } else if (oldVersion < 2) {
        // 升级到版本2：添加时长字段索引
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
}

// 更新历史记录时长
async function updateHistoryDurationToDB(id, duration, lastUpdateTime) {
  const DB_NAME = 'PageHistoryDB';
  const DB_VERSION = 2;
  const STORE_NAME = 'pageHistory';
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('数据库打开失败:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      const db = request.result;
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
            console.log('[Background] 时长更新成功:', id, duration + '秒');
            db.close();
            resolve();
          };
          
          updateRequest.onerror = () => {
            console.error('[Background] 时长更新失败:', updateRequest.error);
            db.close();
            reject(updateRequest.error);
          };
        } else {
          console.error('[Background] 记录不存在:', id);
          db.close();
          reject(new Error('Record not found'));
        }
      };
      
      getRequest.onerror = () => {
        console.error('[Background] 获取记录失败:', getRequest.error);
        db.close();
        reject(getRequest.error);
      };
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('url', 'url', { unique: false });
        objectStore.createIndex('visitTime', 'visitTime', { unique: false });
        objectStore.createIndex('domain', 'domain', { unique: false });
        objectStore.createIndex('duration', 'duration', { unique: false });
        objectStore.createIndex('lastUpdateTime', 'lastUpdateTime', { unique: false });
      } else if (oldVersion < 2) {
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
}
