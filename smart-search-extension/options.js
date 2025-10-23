// ==================== 常量定义 ====================
const UI_CONFIG = {
  STATUS_DISPLAY_DURATION: 1500,  // 状态消息显示时长（毫秒）
  RESET_MESSAGE_DURATION: 3000    // 重置消息显示时长（毫秒）
};

const DEFAULT_SETTINGS = {
  favoriteEngine: 'qwen',
  promptTemplate: '',
  enabledeepThinking: false,
  useCurrentTab: false,
  enablePageTracking: false
};

const ELEMENT_IDS = {
  SEARCH_ENGINE: 'search-engine',
  PROMPT_TEMPLATE: 'prompt-template',
  ENABLE_DEEP_SEARCH: 'enable-deep-search',
  USE_CURRENT_TAB: 'use-current-tab',
  ENABLE_PAGE_TRACKING: 'enable-page-tracking',
  STATUS: 'status',
  SAVE_BUTTON: 'save',
  RESET_BUTTON: 'reset-prompt'
};

// ==================== UI 工具类 ====================
/**
 * UI 管理器
 * 职责：管理所有 UI 相关的操作
 * 原则：单一职责原则（SRP）- 只负责 UI 交互
 */
class UIManager {
  /**
   * 显示状态消息
   * @param {string} message - 消息内容
   * @param {number} duration - 显示时长（毫秒）
   */
  static showStatus(message, duration = UI_CONFIG.STATUS_DISPLAY_DURATION) {
    const statusElement = document.getElementById(ELEMENT_IDS.STATUS);
    statusElement.textContent = message;
    
    setTimeout(() => {
      statusElement.textContent = '';
    }, duration);
  }

  /**
   * 显示成功消息
   */
  static showSuccess(message) {
    this.showStatus(message);
  }

  /**
   * 显示错误消息
   */
  static showError(message) {
    this.showStatus(message, UI_CONFIG.RESET_MESSAGE_DURATION);
  }

  /**
   * 显示信息消息
   */
  static showInfo(message) {
    this.showStatus(message, UI_CONFIG.RESET_MESSAGE_DURATION);
  }

  /**
   * 获取表单元素
   */
  static getElement(id) {
    return document.getElementById(id);
  }
}

// ==================== 表单数据管理 ====================
/**
 * 表单数据管理器
 * 职责：处理表单数据的获取和设置
 * 原则：单一职责原则（SRP）- 只负责表单数据操作
 */
class FormDataManager {
  /**
   * 从表单获取所有设置
   */
  static getFormData() {
    return {
      favoriteEngine: UIManager.getElement(ELEMENT_IDS.SEARCH_ENGINE).value,
      promptTemplate: UIManager.getElement(ELEMENT_IDS.PROMPT_TEMPLATE).value,
      enabledeepThinking: UIManager.getElement(ELEMENT_IDS.ENABLE_DEEP_SEARCH).checked,
      useCurrentTab: UIManager.getElement(ELEMENT_IDS.USE_CURRENT_TAB).checked,
      enablePageTracking: UIManager.getElement(ELEMENT_IDS.ENABLE_PAGE_TRACKING).checked
    };
  }

  /**
   * 设置表单数据
   * @param {Object} data - 设置数据
   */
  static setFormData(data) {
    UIManager.getElement(ELEMENT_IDS.SEARCH_ENGINE).value = data.favoriteEngine;
    UIManager.getElement(ELEMENT_IDS.PROMPT_TEMPLATE).value = data.promptTemplate;
    UIManager.getElement(ELEMENT_IDS.ENABLE_DEEP_SEARCH).checked = data.enabledeepThinking;
    UIManager.getElement(ELEMENT_IDS.USE_CURRENT_TAB).checked = data.useCurrentTab;
    UIManager.getElement(ELEMENT_IDS.ENABLE_PAGE_TRACKING).checked = data.enablePageTracking;
  }

  /**
   * 验证表单数据
   * @param {Object} data - 要验证的数据
   * @returns {Array} 错误消息数组
   */
  static validate(data) {
    const errors = [];
    
    // 这里可以添加验证规则
    // 例如：
    // if (!data.favoriteEngine) {
    //   errors.push('请选择搜索引擎');
    // }
    
    return errors;
  }
}

// ==================== 设置管理 ====================
/**
 * 设置管理器
 * 职责：处理设置的保存和加载
 * 原则：单一职责原则（SRP）- 只负责设置的持久化
 */
class SettingsManager {
  /**
   * 保存设置
   * @param {Object} settings - 要保存的设置
   */
  static async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.set(settings, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 加载设置
   * @param {Object} defaults - 默认设置
   */
  static async loadSettings(defaults = DEFAULT_SETTINGS) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(defaults, (items) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items);
        }
      });
    });
  }

  /**
   * 获取默认提示词
   */
  static async getDefaultPrompt() {
    const response = await chrome.runtime.sendMessage({ action: 'getDefaultPrompt' });
    
    if (!response || !response.success) {
      throw new Error('获取默认提示词失败');
    }
    
    return response.data;
  }
}

// ==================== 业务逻辑控制器 ====================
/**
 * 选项页控制器
 * 职责：协调各个模块完成选项页的功能
 * 原则：单一职责原则（SRP）- 只负责业务流程编排
 */
class OptionsController {
  /**
   * 保存选项
   */
  static async saveOptions() {
    try {
      // 1. 获取表单数据
      const formData = FormDataManager.getFormData();
      
      // 2. 验证数据
      const errors = FormDataManager.validate(formData);
      if (errors.length > 0) {
        UIManager.showError(errors.join('; '));
        return;
      }
      
      // 3. 保存设置
      await SettingsManager.saveSettings(formData);
      
      // 4. 显示成功消息
      UIManager.showSuccess('选项已保存。');
      
      console.log('[Options] 设置已保存:', formData);
    } catch (error) {
      console.error('[Options] 保存设置失败:', error);
      UIManager.showError('保存失败：' + error.message);
    }
  }

  /**
   * 恢复选项
   */
  static async restoreOptions() {
    try {
      // 1. 加载设置
      const settings = await SettingsManager.loadSettings();
      
      // 2. 设置表单数据
      FormDataManager.setFormData(settings);
      
      console.log('[Options] 设置已加载:', settings);
    } catch (error) {
      console.error('[Options] 加载设置失败:', error);
      UIManager.showError('加载失败：' + error.message);
    }
  }

  /**
   * 重置提示词
   */
  static async resetPrompt() {
    try {
      // 1. 获取默认提示词
      const defaultPrompt = await SettingsManager.getDefaultPrompt();
      
      // 2. 设置到表单
      UIManager.getElement(ELEMENT_IDS.PROMPT_TEMPLATE).value = defaultPrompt;
      
      // 3. 显示提示
      UIManager.showInfo('已重置为默认提示词，请点击保存按钮以应用更改。');
      
      console.log('[Options] 提示词已重置为默认值');
    } catch (error) {
      console.error('[Options] 重置提示词失败:', error);
      UIManager.showError('重置失败：' + error.message);
    }
  }

  /**
   * 初始化事件监听器
   */
  static initializeEventListeners() {
    // 保存按钮
    UIManager.getElement(ELEMENT_IDS.SAVE_BUTTON).addEventListener('click', () => {
      this.saveOptions();
    });

    // 重置按钮
    UIManager.getElement(ELEMENT_IDS.RESET_BUTTON).addEventListener('click', () => {
      this.resetPrompt();
    });

    console.log('[Options] 事件监听器已初始化');
  }

  /**
   * 初始化选项页
   */
  static async initialize() {
    console.log('[Options] 初始化选项页');
    
    // 1. 恢复选项
    await this.restoreOptions();
    
    // 2. 初始化事件监听器
    this.initializeEventListeners();
    
    console.log('[Options] 选项页初始化完成');
  }
}

// ==================== 主程序入口 ====================
// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  OptionsController.initialize();
});
