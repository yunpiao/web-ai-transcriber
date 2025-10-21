/**
 * 浏览记录总结功能集成测试
 */

const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');

describe('浏览记录总结功能集成测试', () => {
  beforeEach(() => {
    setupChromeMock();
  });

  afterEach(() => {
    resetChromeMock();
  });

  test('应该能够保存总结文本到storage', async () => {
    const summaryText = '这是一个总结文本';
    
    await chrome.storage.local.set({
      'tempSearchText': summaryText,
      'skipPromptTemplate': true
    });
    
    const result = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
    
    expect(result.tempSearchText).toBe(summaryText);
    expect(result.skipPromptTemplate).toBe(true);
  });

  test('应该能够从storage读取转写引擎配置', async () => {
    await chrome.storage.sync.set({
      favoriteEngine: 'deepseek',
      useCurrentTab: true
    });
    
    const settings = await chrome.storage.sync.get({
      favoriteEngine: 'qwen',
      useCurrentTab: false
    });
    
    expect(settings.favoriteEngine).toBe('deepseek');
    expect(settings.useCurrentTab).toBe(true);
  });

  test('应该能够清除临时数据', async () => {
    // 先设置数据
    await chrome.storage.local.set({
      'tempSearchText': '测试文本',
      'skipPromptTemplate': true
    });
    
    // 清除数据
    await chrome.storage.local.remove(['tempSearchText', 'skipPromptTemplate']);
    
    // 验证已清除
    const result = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
    expect(result.tempSearchText).toBeUndefined();
    expect(result.skipPromptTemplate).toBeUndefined();
  });

  test('应该能够处理默认配置', async () => {
    const settings = await chrome.storage.sync.get({
      favoriteEngine: 'qwen',
      useCurrentTab: false
    });
    
    expect(settings.favoriteEngine).toBe('qwen');
    expect(settings.useCurrentTab).toBe(false);
  });

  test('应该能够验证skipPromptTemplate标识', async () => {
    // 普通转写 - 不设置skipPromptTemplate
    await chrome.storage.local.set({
      'tempSearchText': '普通文本'
    });
    
    let result = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
    expect(result.skipPromptTemplate).toBeUndefined();
    
    // 总结功能 - 设置skipPromptTemplate
    await chrome.storage.local.set({
      'tempSearchText': '总结文本',
      'skipPromptTemplate': true
    });
    
    result = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
    expect(result.skipPromptTemplate).toBe(true);
  });

  test('应该能够支持所有搜索引擎', async () => {
    const engines = ['gemini', 'qwen', 'deepseek', 'aistudio'];
    
    for (const engine of engines) {
      await chrome.storage.sync.set({ favoriteEngine: engine });
      const result = await chrome.storage.sync.get('favoriteEngine');
      expect(result.favoriteEngine).toBe(engine);
    }
  });

  test('应该能够同时保存多个配置项', async () => {
    await chrome.storage.sync.set({
      favoriteEngine: 'deepseek',
      useCurrentTab: true,
      enabledeepThinking: true
    });
    
    const result = await chrome.storage.sync.get([
      'favoriteEngine',
      'useCurrentTab',
      'enabledeepThinking'
    ]);
    
    expect(result.favoriteEngine).toBe('deepseek');
    expect(result.useCurrentTab).toBe(true);
    expect(result.enabledeepThinking).toBe(true);
  });

  test('应该能够更新已存在的配置', async () => {
    // 初始配置
    await chrome.storage.sync.set({ favoriteEngine: 'qwen' });
    
    // 更新配置
    await chrome.storage.sync.set({ favoriteEngine: 'gemini' });
    
    const result = await chrome.storage.sync.get('favoriteEngine');
    expect(result.favoriteEngine).toBe('gemini');
  });

  describe('边界情况和降级处理', () => {
    test('应该处理null的favoriteEngine', async () => {
      await chrome.storage.sync.set({ favoriteEngine: null });
      
      const settings = await chrome.storage.sync.get({
        favoriteEngine: 'qwen'
      });
      
      // null会被存储，不会使用默认值
      expect(settings.favoriteEngine).toBeNull();
      
      // 验证降级逻辑
      const engineKey = settings.favoriteEngine || 'qwen';
      expect(engineKey).toBe('qwen');
    });

    test('应该处理空字符串的favoriteEngine', async () => {
      await chrome.storage.sync.set({ favoriteEngine: '' });
      
      const settings = await chrome.storage.sync.get({
        favoriteEngine: 'qwen'
      });
      
      // 空字符串会被存储
      expect(settings.favoriteEngine).toBe('');
      
      // 验证降级逻辑
      const engineKey = settings.favoriteEngine || 'qwen';
      expect(engineKey).toBe('qwen');
    });

    test('应该处理无效的引擎名称', async () => {
      const SEARCH_ENGINES = {
        gemini: { url: 'https://gemini.google.com/app' },
        qwen: { url: 'https://chat.qwen.ai/' },
        deepseek: { url: 'https://chat.deepseek.com/' },
        aistudio: { url: 'https://aistudio.google.com/app/prompts/new_chat' }
      };
      
      await chrome.storage.sync.set({ favoriteEngine: 'chatgpt' });
      
      const settings = await chrome.storage.sync.get({
        favoriteEngine: 'qwen'
      });
      
      expect(settings.favoriteEngine).toBe('chatgpt');
      
      // 验证SEARCH_ENGINES查找和降级
      const engineKey = settings.favoriteEngine || 'qwen';
      const engine = SEARCH_ENGINES[engineKey];
      
      expect(engine).toBeUndefined();
      
      // 降级逻辑
      const engineUrl = engine?.url || SEARCH_ENGINES['qwen'].url;
      expect(engineUrl).toBe('https://chat.qwen.ai/');
    });

    test('所有默认值应该在SEARCH_ENGINES中存在', () => {
      const SEARCH_ENGINES = {
        gemini: { url: 'https://gemini.google.com/app' },
        qwen: { url: 'https://chat.qwen.ai/' },
        deepseek: { url: 'https://chat.deepseek.com/' },
        aistudio: { url: 'https://aistudio.google.com/app/prompts/new_chat' }
      };
      
      const defaultEngines = ['qwen'];  // 所有文件中使用的默认值
      
      defaultEngines.forEach(engineName => {
        expect(SEARCH_ENGINES[engineName]).toBeDefined();
        expect(SEARCH_ENGINES[engineName].url).toBeDefined();
        expect(typeof SEARCH_ENGINES[engineName].url).toBe('string');
      });
    });

    test('降级逻辑应该总是返回有效URL', () => {
      const SEARCH_ENGINES = {
        gemini: { url: 'https://gemini.google.com/app' },
        qwen: { url: 'https://chat.qwen.ai/' },
        deepseek: { url: 'https://chat.deepseek.com/' },
        aistudio: { url: 'https://aistudio.google.com/app/prompts/new_chat' }
      };
      
      // 测试各种无效值
      const invalidValues = ['', null, undefined, 'invalid', 'google', 'chatgpt'];
      
      invalidValues.forEach(invalidValue => {
        const engineKey = invalidValue || 'qwen';
        const engine = SEARCH_ENGINES[engineKey];
        const engineUrl = engine?.url || SEARCH_ENGINES['qwen'].url;
        
        expect(engineUrl).toBeDefined();
        expect(typeof engineUrl).toBe('string');
        expect(engineUrl.startsWith('http')).toBe(true);
      });
    });
  });
});


