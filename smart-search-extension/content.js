// ==================== 常量定义 ====================
const ENGINE_CONFIG = {
  'gemini.google.com': {
    input: 'div.ql-editor.textarea, rich-textarea .ql-editor',
    submit: 'button.send-button, div.send-button-container button',
  },
  'chat.qwen.ai': {
    input: '#chat-input',
    submit: '#send-message-button',
    deepThinkingButton: 'button.ThinkingButton,button.chat-input-feature-btn'
  },
  'chat.deepseek.com': {
    input: 'textarea#chat-input',
    submit: 'button#send-message-button',
  },
  'aistudio.google.com': {
    input: 'textarea.textarea, textarea[aria-label*="Type something"]',
    submit: 'button[aria-label="Run"], button.run-button',
  }
};

const TIMING = {
  ELEMENT_CHECK_INTERVAL: 100,  // 元素检查间隔（毫秒）- 更快的响应速度
  MAX_ATTEMPTS: 50,              // 最大重试次数（5秒超时）
  DEEP_THINKING_DELAY: 1000,     // 深度思考按钮延迟
  DEEP_THINKING_RESPONSE: 300,   // 深度思考响应延迟
  SUBMIT_DELAY: 200,             // 提交延迟
  BLUR_DELAY: 1000,              // 失焦延迟
  MARKDOWN_CHECK_INTERVAL: 1000  // Markdown 检查间隔
};

// ==================== 配置管理 ====================
/**
 * 配置加载器
 * 职责：从 storage 加载所有必要的配置
 */
class ConfigLoader {
  /**
   * 加载临时搜索文本
   */
  static async loadSearchText() {
    const data = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
    return {
      searchText: data.tempSearchText,
      skipPromptTemplate: data.skipPromptTemplate || false
    };
  }

  /**
   * 加载提示词模板
   */
  static async loadPromptTemplate() {
    const data = await chrome.storage.sync.get('promptTemplate');
    return data.promptTemplate || '';
  }

  /**
   * 加载深度思考设置
   */
  static async loadDeepThinkingSetting() {
    const data = await chrome.storage.sync.get('enabledeepThinking');
    return data.enabledeepThinking || false;
  }

  /**
   * 加载所有配置
   */
  static async loadAll() {
    const [textData, promptTemplate, enableDeepThinking] = await Promise.all([
      this.loadSearchText(),
      this.loadPromptTemplate(),
      this.loadDeepThinkingSetting()
    ]);

    return {
      searchText: textData.searchText,
      skipPromptTemplate: textData.skipPromptTemplate,
      promptTemplate: promptTemplate,  // 始终加载提示词，由 skipPromptTemplate 控制是否使用
      enableDeepThinking
    };
  }

  /**
   * 清理临时数据
   */
  static async cleanup() {
    await chrome.storage.local.remove(['tempSearchText', 'skipPromptTemplate']);
    console.log('[智能搜索扩展] 临时数据已清除');
  }
}

// ==================== DOM 操作 ====================
/**
 * DOM 工具类
 * 职责：处理所有 DOM 操作和元素查找
 */
class DOMHelper {
  /**
   * 等待元素出现
   * @param {string} selector - CSS 选择器
   * @param {number} maxAttempts - 最大尝试次数
   * @param {number} interval - 检查间隔（毫秒）
   */
  static async waitForElement(selector, maxAttempts = TIMING.MAX_ATTEMPTS, interval = TIMING.ELEMENT_CHECK_INTERVAL) {
    let attempts = 0;
    
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        attempts++;
        const element = document.querySelector(selector);
        
        console.log(`[调试] 第${attempts}次尝试查找元素: ${selector}`, { found: !!element });
        
        if (element) {
          clearInterval(checkInterval);
          resolve(element);
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          reject(new Error(`元素未找到: ${selector}`));
        }
      }, interval);
    });
  }

  /**
   * 填充输入框
   * @param {HTMLElement} inputBox - 输入框元素
   * @param {string} text - 要填充的文本
   */
  static fillInput(inputBox, text) {
    // 转义 HTML 以防止 XSS
    const escapedText = text.replace(/</g, '\'<\'').replace(/>/g, '\'>\'');
    
    if (inputBox.tagName === 'DIV') {
      inputBox.innerHTML = escapedText.replace(/\n/g, '<br>');
    } else {
      inputBox.value = escapedText;
    }
    
    // 派发 input 事件，通知框架内容已更新
    inputBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
  }

  /**
   * 点击提交按钮
   * @param {string} selector - 按钮选择器
   */
  static clickSubmit(selector) {
    const button = document.querySelector(selector);
    if (button) {
      button.click();
      return true;
    }
    return false;
  }

  /**
   * 模拟按键提交
   * @param {HTMLElement} inputBox - 输入框元素
   */
  static simulateEnterKey(inputBox) {
    inputBox.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Enter',
      code: 'Enter',
      bubbles: true,
      cancelable: true
    }));
  }

  /**
   * 等待并聚焦 Markdown 面板
   */
  static async waitAndFocusMarkdown() {
    let markdownPanel = document.querySelector('.markdown-main-panel');
    
    while (!markdownPanel) {
      await this.delay(TIMING.MARKDOWN_CHECK_INTERVAL);
      markdownPanel = document.querySelector('.markdown-main-panel');
    }
    
    if (markdownPanel) {
      console.log('[智能搜索扩展] 已找到 markdown-main-panel 元素');
      markdownPanel.focus();
      markdownPanel.scrollIntoView({ behavior: 'smooth' });
      markdownPanel.click();
    }
  }

  /**
   * 延迟函数
   */
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== 引擎特定处理器 ====================
/**
 * 引擎处理器基类
 * 职责：定义引擎处理器的接口
 * 原则：开闭原则（OCP）- 通过继承扩展功能
 */
class EngineHandler {
  constructor(config) {
    this.config = config;
  }

  /**
   * 处理深度思考功能（子类可覆盖）
   */
  async handleDeepThinking(enableDeepThinking) {
    if (!enableDeepThinking || !this.config.deepThinkingButton) {
      return;
    }

    await DOMHelper.delay(TIMING.DEEP_THINKING_DELAY);
    console.log('[智能搜索扩展] 选择器:', this.config.deepThinkingButton);
    
    const button = document.querySelector(this.config.deepThinkingButton);
    if (button) {
      console.log('[智能搜索扩展] 正在启用深度搜索/思考功能...');
      button.click();
      await DOMHelper.delay(TIMING.DEEP_THINKING_RESPONSE);
    } else {
      console.log('[智能搜索扩展] 未找到深度搜索/思考按钮');
    }
  }

  /**
   * 处理提交后的操作（子类可覆盖）
   */
  async handlePostSubmit() {
    // 默认实现：等待并聚焦 Markdown
    await DOMHelper.waitAndFocusMarkdown();
  }
}

/**
 * AI Studio 引擎处理器
 * 职责：处理 AI Studio 特有的逻辑
 */
class AIStudioHandler extends EngineHandler {
  async handlePostSubmit() {
    await super.handlePostSubmit();
    await this.closeRunSettingsPanel();
  }

  /**
   * 关闭 Run Settings 面板
   */
  async closeRunSettingsPanel() {
    console.log('[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...');
    await DOMHelper.delay(500);
    
    const closeButton = document.querySelector('button[aria-label="Close run settings panel"]');
    if (closeButton) {
      console.log('[智能搜索扩展] 成功找到 "Close run settings panel" 按钮，正在关闭...');
      closeButton.click();
      console.log('[智能搜索扩展] Run Settings 面板已关闭');
    } else {
      console.log('[智能搜索扩展] 未找到 "Close run settings panel" 按钮');
    }
  }
}

/**
 * 引擎处理器工厂
 * 职责：根据主机名创建对应的处理器
 */
class EngineHandlerFactory {
  static create(hostname, config) {
    if (hostname === 'aistudio.google.com') {
      return new AIStudioHandler(config);
    }
    return new EngineHandler(config);
  }
}

// ==================== 主控制器 ====================
/**
 * 内容脚本控制器
 * 职责：协调整个内容脚本的执行流程
 * 原则：单一职责原则（SRP）- 只负责流程编排
 */
class ContentScriptController {
  constructor() {
    this.executed = false;
  }

  /**
   * 检查是否已执行
   */
  checkExecutionStatus() {
    if (window.__contentScriptExecuted) {
      console.log('[智能搜索扩展] content.js 已执行过，跳过');
      return false;
    }
    window.__contentScriptExecuted = true;
    return true;
  }

  /**
   * 加载配置并验证
   */
  async loadAndValidateConfig() {
    const config = await ConfigLoader.loadAll();
    
    if (!config.searchText) {
      console.log('[智能搜索扩展] 没有临时搜索文本，跳过执行');
      return null;
    }
    
    console.log('[智能搜索扩展] 开始处理搜索文本');
    return config;
  }

  /**
   * 获取引擎配置
   */
  getEngineConfig() {
    const hostname = window.location.hostname;
    const config = ENGINE_CONFIG[hostname];
    
    if (!config) {
      console.error(`[智能搜索扩展] 未找到适用于 ${hostname} 的配置`);
      return null;
    }
    
    return { hostname, config };
  }

  /**
   * 准备搜索文本
   */
  prepareSearchText(config) {
    let { searchText, promptTemplate, skipPromptTemplate } = config;
    
    // 如果不跳过提示词，则添加提示词模板
    if (!skipPromptTemplate && promptTemplate) {
      searchText = `${promptTemplate}${searchText}`;
    }
    
    return searchText;
  }

  /**
   * 执行搜索流程
   */
  async executeSearch(engineConfig, searchText, config) {
    const { hostname, config: engineCfg } = engineConfig;
    const handler = EngineHandlerFactory.create(hostname, engineCfg);
    
    try {
      // 1. 等待输入框出现
      console.log('[智能搜索扩展] → 等待输入框:', engineCfg.input);
      const inputBox = await DOMHelper.waitForElement(engineCfg.input);
      console.log('[智能搜索扩展] ✓ 已找到输入框，tagName:', inputBox.tagName);
      
      // 2. 处理深度思考功能
      if (config.enableDeepThinking && engineCfg.deepThinkingButton) {
        console.log('[智能搜索扩展] → 处理深度思考功能');
        await handler.handleDeepThinking(config.enableDeepThinking);
      } else {
        console.log('[智能搜索扩展] ✓ 跳过深度思考功能');
      }
      
      // 3. 填充文本
      console.log('[智能搜索扩展] → 填充文本，长度:', searchText.length);
      DOMHelper.fillInput(inputBox, searchText);
      console.log('[智能搜索扩展] ✓ 文本已填充');
      
      // 4. 延迟后提交
      console.log(`[智能搜索扩展] → 等待${TIMING.SUBMIT_DELAY}ms后提交`);
      await DOMHelper.delay(TIMING.SUBMIT_DELAY);
      
      // 5. 尝试点击提交按钮
      console.log('[智能搜索扩展] → 尝试点击提交按钮:', engineCfg.submit);
      const submitted = DOMHelper.clickSubmit(engineCfg.submit);
      if (submitted) {
        console.log('[智能搜索扩展] ✓ 提交按钮已点击');
      } else {
        console.error(`[智能搜索扩展] ✗ 未找到提交按钮 ('${engineCfg.submit}')`);
        console.log('[智能搜索扩展] → 尝试模拟Enter键');
        DOMHelper.simulateEnterKey(inputBox);
        console.log('[智能搜索扩展] ✓ Enter键已模拟');
      }
      
      // 6. 失焦输入框
      console.log(`[智能搜索扩展] → 等待${TIMING.BLUR_DELAY}ms后失焦`);
      await DOMHelper.delay(TIMING.BLUR_DELAY);
      inputBox.blur();
      console.log('[智能搜索扩展] ✓ 输入框已失焦');
      
      // 7. 处理提交后操作
      console.log('[智能搜索扩展] → 处理提交后操作');
      await handler.handlePostSubmit();
      console.log('[智能搜索扩展] ✓ 提交后操作完成');
      
      // 8. 清理临时数据
      console.log('[智能搜索扩展] → 清理临时数据');
      await ConfigLoader.cleanup();
      console.log('[智能搜索扩展] ✓ 临时数据已清理');
      
      console.log('[智能搜索扩展] ✅ 任务完成');
      
    } catch (error) {
      console.error('[智能搜索扩展] ❌ 执行出错:', error);
      console.error('[智能搜索扩展] 错误堆栈:', error.stack);
    }
  }

  /**
   * 运行主流程
   */
  async run() {
    console.log('[智能搜索扩展] ========== Content Script 开始执行 ==========');
    
    // 1. 检查执行状态
    console.log('[智能搜索扩展] 步骤1: 检查执行状态');
    if (!this.checkExecutionStatus()) {
      console.log('[智能搜索扩展] 已执行过，退出');
      return;
    }
    console.log('[智能搜索扩展] ✓ 首次执行，继续');
    
    // 2. 加载配置
    console.log('[智能搜索扩展] 步骤2: 加载配置');
    const config = await this.loadAndValidateConfig();
    if (!config) {
      console.log('[智能搜索扩展] 配置无效或无搜索文本，退出');
      return;
    }
    console.log('[智能搜索扩展] ✓ 配置加载成功:', {
      hasSearchText: !!config.searchText,
      skipPromptTemplate: config.skipPromptTemplate,
      hasPromptTemplate: !!config.promptTemplate,
      enableDeepThinking: config.enableDeepThinking
    });
    
    // 3. 获取引擎配置
    console.log('[智能搜索扩展] 步骤3: 获取引擎配置');
    console.log('[智能搜索扩展] 当前hostname:', window.location.hostname);
    const engineConfig = this.getEngineConfig();
    if (!engineConfig) {
      console.error('[智能搜索扩展] 未找到引擎配置，退出');
      return;
    }
    console.log('[智能搜索扩展] ✓ 引擎配置:', engineConfig.hostname);
    
    // 4. 准备搜索文本
    console.log('[智能搜索扩展] 步骤4: 准备搜索文本');
    const searchText = this.prepareSearchText(config);
    console.log('[智能搜索扩展] ✓ 文本长度:', searchText.length);
    console.log('[智能搜索扩展] ✓ 文本开头:', searchText.substring(0, 50));
    
    // 5. 执行搜索
    console.log('[智能搜索扩展] 步骤5: 执行搜索流程');
    await this.executeSearch(engineConfig, searchText, config);
    console.log('[智能搜索扩展] ========== Content Script 执行完成 ==========');
  }
}

// ==================== 主程序入口 ====================
(async () => {
  const controller = new ContentScriptController();
  await controller.run();
})();
