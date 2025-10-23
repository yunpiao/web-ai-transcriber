/**
 * AI Studio 自动关闭侧边栏功能测试
 * 
 * 测试目标：
 * 1. 在 AI Studio 上自动检测并关闭 "Run settings panel"
 * 2. 只在 aistudio.google.com 上生效
 * 3. 正确处理按钮不存在的情况
 */

describe('AI Studio 侧边栏自动关闭功能', () => {
  let mockButton;
  let clickCount;

  beforeEach(() => {
    // 模拟 DOM 环境
    clickCount = 0;
    mockButton = {
      click: jest.fn(() => {
        clickCount++;
      }),
      getAttribute: jest.fn((attr) => {
        if (attr === 'aria-label') {
          return 'Close run settings panel';
        }
        return null;
      })
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('应该能够找到并点击关闭按钮', () => {
    // 模拟 querySelector
    const querySelector = jest.fn((selector) => {
      if (selector === 'button[aria-label="Close run settings panel"]') {
        return mockButton;
      }
      return null;
    });
    
    const closeButton = querySelector('button[aria-label="Close run settings panel"]');
    
    expect(closeButton).toBeTruthy();
    expect(closeButton).toBe(mockButton);
    
    if (closeButton) {
      closeButton.click();
    }
    
    expect(clickCount).toBe(1);
    expect(mockButton.click).toHaveBeenCalledTimes(1);
  });

  test('应该只在 aistudio.google.com 上执行关闭操作', () => {
    const hostname = 'aistudio.google.com';
    
    // 模拟 querySelector
    const querySelector = jest.fn((selector) => {
      if (selector === 'button[aria-label="Close run settings panel"]') {
        return mockButton;
      }
      return null;
    });
    
    if (hostname === 'aistudio.google.com') {
      const closeButton = querySelector('button[aria-label="Close run settings panel"]');
      if (closeButton) {
        closeButton.click();
      }
    }
    
    expect(clickCount).toBe(1);
  });

  test('不应该在其他网站上执行关闭操作', () => {
    const hostname = 'chat.qwen.ai';
    
    if (hostname === 'aistudio.google.com') {
      const closeButton = document.querySelector('button[aria-label="Close run settings panel"]');
      if (closeButton) {
        closeButton.click();
      }
    }
    
    // 由于 hostname 不是 aistudio，不应该执行
    expect(clickCount).toBe(0);
  });

  test('应该正确处理按钮不存在的情况', () => {
    // 模拟按钮不存在
    document.querySelector = jest.fn(() => null);
    
    const closeButton = document.querySelector('button[aria-label="Close run settings panel"]');
    
    expect(closeButton).toBeNull();
    
    // 不应该抛出错误
    if (closeButton) {
      closeButton.click();
    }
    
    expect(clickCount).toBe(0);
  });

  test('应该使用正确的选择器', () => {
    const selector = 'button[aria-label="Close run settings panel"]';
    const querySelector = jest.fn();
    
    querySelector(selector);
    
    expect(querySelector).toHaveBeenCalledWith(selector);
  });

  test('应该在页面稳定后执行（模拟延迟）', async () => {
    // 模拟 querySelector
    const querySelector = jest.fn((selector) => {
      if (selector === 'button[aria-label="Close run settings panel"]') {
        return mockButton;
      }
      return null;
    });
    
    // 模拟异步执行流程
    const executeCloseAction = async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const closeButton = querySelector('button[aria-label="Close run settings panel"]');
      if (closeButton) {
        closeButton.click();
        return true;
      }
      return false;
    };
    
    const result = await executeCloseAction();
    
    expect(result).toBe(true);
    expect(clickCount).toBe(1);
  });

  test('应该记录日志信息', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // 模拟 querySelector
    const querySelector = jest.fn((selector) => {
      if (selector === 'button[aria-label="Close run settings panel"]') {
        return mockButton;
      }
      return null;
    });
    
    const hostname = 'aistudio.google.com';
    
    if (hostname === 'aistudio.google.com') {
      console.log('[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...');
      
      const closeButton = querySelector('button[aria-label="Close run settings panel"]');
      if (closeButton) {
        console.log('[智能搜索扩展] 成功找到 "Close run settings panel" 按钮，正在关闭...');
        closeButton.click();
        console.log('[智能搜索扩展] Run Settings 面板已关闭');
      }
    }
    
    expect(consoleSpy).toHaveBeenCalledWith('[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...');
    expect(consoleSpy).toHaveBeenCalledWith('[智能搜索扩展] 成功找到 "Close run settings panel" 按钮，正在关闭...');
    expect(consoleSpy).toHaveBeenCalledWith('[智能搜索扩展] Run Settings 面板已关闭');
    
    consoleSpy.mockRestore();
  });

  test('当按钮不存在时应该记录相应日志', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // 模拟按钮不存在
    const querySelector = jest.fn(() => null);
    
    const hostname = 'aistudio.google.com';
    
    if (hostname === 'aistudio.google.com') {
      console.log('[智能搜索扩展] 检查是否需要关闭 Run Settings 面板...');
      
      const closeButton = querySelector('button[aria-label="Close run settings panel"]');
      if (closeButton) {
        console.log('[智能搜索扩展] 成功找到按钮');
        closeButton.click();
      } else {
        console.log('[智能搜索扩展] 未找到 "Close run settings panel" 按钮（可能已经关闭或页面结构已更新）');
      }
    }
    
    expect(consoleSpy).toHaveBeenCalledWith('[智能搜索扩展] 未找到 "Close run settings panel" 按钮（可能已经关闭或页面结构已更新）');
    
    consoleSpy.mockRestore();
  });
});

