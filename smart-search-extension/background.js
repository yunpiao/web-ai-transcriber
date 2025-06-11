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
      favoriteEngine: 'google',
      useCurrentTab: false
    });
    
    // 4. 根据配置打开对应的搜索引擎页面
    const engineUrl = SEARCH_ENGINES[settings.favoriteEngine].url;
    
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
    favoriteEngine: 'google', // 默认搜索引擎
    promptTemplate: null, // 提示词可能还没有设置
    enabledeepThinking: false, // 默认不启用深度搜索
    useCurrentTab: false // 默认不在当前页面打开
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
