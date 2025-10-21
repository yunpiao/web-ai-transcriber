/**
 * 消息通信集成测试
 */

const { setupChromeMock, resetChromeMock } = require('../helpers/chrome-mock');
const { createMockHistoryRecord } = require('../helpers/fixtures');

describe('消息通信集成测试', () => {
  beforeEach(() => {
    setupChromeMock();
  });

  afterEach(() => {
    resetChromeMock();
  });

  test('应该能够发送消息', async () => {
    const message = {
      action: 'savePageHistory',
      data: createMockHistoryRecord()
    };
    
    const response = await chrome.runtime.sendMessage(message);
    
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
  });

  test('应该能够监听消息', (done) => {
    const testMessage = {
      action: 'test',
      data: 'test data'
    };
    
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      expect(message).toEqual(testMessage);
      sendResponse({ received: true });
      done();
    });
    
    // 模拟发送消息
    chrome.runtime.onMessage.listeners[0](testMessage, {}, jest.fn());
  });

  test('应该能够处理保存历史记录消息', async () => {
    const historyData = createMockHistoryRecord();
    const message = {
      action: 'savePageHistory',
      data: historyData
    };
    
    const response = await chrome.runtime.sendMessage(message);
    
    expect(response).toBeDefined();
    expect(response.success).toBe(true);
  });

  test('应该能够获取扩展URL', () => {
    const url = chrome.runtime.getURL('history.html');
    
    expect(url).toBeDefined();
    expect(url).toContain('history.html');
    expect(url).toContain('chrome-extension://');
  });
});

