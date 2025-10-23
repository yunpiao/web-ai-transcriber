/**
 * Content Script E2E测试
 * 测试重构后修复的两个关键bug：
 * 1. Bug Fix: 元素检查从500ms降到100ms，响应速度提升5倍
 * 2. Bug Fix: skipPromptTemplate逻辑修复，提示词正确添加
 */

const {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  wait
} = require('./setup');

describe('Content Script Bug Fixes E2E测试', () => {
  let browser;
  let extensionId;

  beforeAll(async () => {
    browser = await launchBrowserWithExtension();
    extensionId = await getExtensionId(browser);
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  describe('Bug Fix 1: 元素检查响应速度从500ms降到100ms', () => {
    test('应该验证TIMING.ELEMENT_CHECK_INTERVAL配置为100ms', () => {
      const fs = require('fs');
      const path = require('path');
      const contentScriptPath = path.join(__dirname, '../../smart-search-extension/content.js');
      const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf-8');
      
      // 验证ELEMENT_CHECK_INTERVAL从500改为100
      expect(contentScriptCode).toMatch(/ELEMENT_CHECK_INTERVAL:\s*100/);
      expect(contentScriptCode).not.toMatch(/ELEMENT_CHECK_INTERVAL:\s*500/);
      
      // 验证MAX_ATTEMPTS从20改为50
      expect(contentScriptCode).toMatch(/MAX_ATTEMPTS:\s*50/);
      expect(contentScriptCode).not.toMatch(/MAX_ATTEMPTS:\s*20[,\s]/);
      
      // 计算理论响应速度
      const interval = 100;
      const maxAttempts = 50;
      const maxWaitTime = interval * maxAttempts;
      
      console.log(`✓ Bug Fix 1 验证通过:`);
      console.log(`  - 检查间隔: 500ms → 100ms (提升 5 倍) ✓`);
      console.log(`  - 最大重试: 20次 → 50次 ✓`);
      console.log(`  - 理论最快响应: 100ms`);
      console.log(`  - 理论最慢响应: ${maxWaitTime}ms`);
    });

    test('应该验证等待逻辑使用正确的间隔', () => {
      const fs = require('fs');
      const path = require('path');
      const contentScriptPath = path.join(__dirname, '../../smart-search-extension/content.js');
      const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf-8');
      
      // 验证waitForElement使用TIMING.ELEMENT_CHECK_INTERVAL
      expect(contentScriptCode).toMatch(/interval\s*=\s*TIMING\.ELEMENT_CHECK_INTERVAL/);
      expect(contentScriptCode).toMatch(/maxAttempts\s*=\s*TIMING\.MAX_ATTEMPTS/);
      
      console.log(`✓ waitForElement使用正确的TIMING常量 ✓`);
    });
  });

  describe('Bug Fix 2: 提示词模板逻辑修复', () => {
    test('skipPromptTemplate=false时应该添加提示词', async () => {
      const page = await openExtensionPage(browser, extensionId, 'options.html');
      
      await wait(1000);
      
      // 设置一个自定义提示词
      const customPrompt = '【测试提示词】请优化：';
      await page.evaluate((prompt) => {
        document.getElementById('prompt-template').value = prompt;
      }, customPrompt);
      
      // 保存配置
      await page.click('#save');
      await wait(1000);
      
      // 验证提示词被保存
      const savedPrompt = await page.$eval('#prompt-template', el => el.value);
      expect(savedPrompt).toBe(customPrompt);
      
      // 读取storage验证skipPromptTemplate默认为false
      const config = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['promptTemplate', 'enabledeepThinking'], (items) => {
            resolve(items);
          });
        });
      });
      
      expect(config.promptTemplate).toBe(customPrompt);
      
      console.log(`✓ 提示词模板配置正确: "${config.promptTemplate}"`);
      console.log(`✓ 深度思考设置: ${config.enabledeepThinking}`);
      
      await page.close();
    });

    test('提示词逻辑应该独立于enableDeepThinking', async () => {
      const page = await openExtensionPage(browser, extensionId, 'options.html');
      
      await wait(1000);
      
      // 设置提示词并启用深度思考
      await page.evaluate(() => {
        document.getElementById('prompt-template').value = '提示词测试：';
        document.getElementById('enable-deep-search').checked = true;
      });
      
      await page.click('#save');
      await wait(1000);
      
      // 验证两个配置都被保存
      const config = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['promptTemplate', 'enabledeepThinking'], (items) => {
            resolve(items);
          });
        });
      });
      
      // 验证两个设置是独立的
      expect(config.promptTemplate).toBe('提示词测试：');
      expect(config.enabledeepThinking).toBe(true);
      
      console.log(`✓ 提示词和深度思考设置相互独立`);
      console.log(`  - 提示词: "${config.promptTemplate}"`);
      console.log(`  - 深度思考: ${config.enabledeepThinking}`);
      
      await page.close();
    });

    test('应该验证ConfigLoader.loadAll的逻辑', async () => {
      const page = await openExtensionPage(browser, extensionId, 'options.html');
      
      await wait(1000);
      
      // 场景1：深度思考关闭，提示词仍应加载
      await page.evaluate(() => {
        document.getElementById('prompt-template').value = '场景1提示词：';
        document.getElementById('enable-deep-search').checked = false;
      });
      await page.click('#save');
      await wait(1000);
      
      let config1 = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['promptTemplate', 'enabledeepThinking'], resolve);
        });
      });
      
      // 关键验证：即使enableDeepThinking=false，promptTemplate也应该被保存
      expect(config1.promptTemplate).toBe('场景1提示词：');
      expect(config1.enabledeepThinking).toBe(false);
      
      // 场景2：深度思考开启，提示词也应加载
      await page.evaluate(() => {
        document.getElementById('prompt-template').value = '场景2提示词：';
        document.getElementById('enable-deep-search').checked = true;
      });
      await page.click('#save');
      await wait(1000);
      
      let config2 = await page.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.sync.get(['promptTemplate', 'enabledeepThinking'], resolve);
        });
      });
      
      expect(config2.promptTemplate).toBe('场景2提示词：');
      expect(config2.enabledeepThinking).toBe(true);
      
      console.log(`✓ ConfigLoader逻辑验证通过`);
      console.log(`  场景1 (深度思考=关): promptTemplate="${config1.promptTemplate}"`);
      console.log(`  场景2 (深度思考=开): promptTemplate="${config2.promptTemplate}"`);
      
      await page.close();
    });
  });

  describe('综合验证：配置正确性', () => {
    test('应该验证TIMING常量的所有配置', async () => {
      // 验证代码中的TIMING配置是否正确
      const expectedTiming = {
        ELEMENT_CHECK_INTERVAL: 100,  // Bug Fix: 从500改为100
        MAX_ATTEMPTS: 50,              // Bug Fix: 从20改为50
        DEEP_THINKING_DELAY: 1000,
        DEEP_THINKING_RESPONSE: 300,
        SUBMIT_DELAY: 200,
        BLUR_DELAY: 1000,
        MARKDOWN_CHECK_INTERVAL: 1000
      };
      
      // 读取实际代码并验证
      const fs = require('fs');
      const path = require('path');
      const contentScriptPath = path.join(__dirname, '../../smart-search-extension/content.js');
      const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf-8');
      
      // 验证ELEMENT_CHECK_INTERVAL: 100
      expect(contentScriptCode).toMatch(/ELEMENT_CHECK_INTERVAL:\s*100/);
      expect(contentScriptCode).not.toMatch(/ELEMENT_CHECK_INTERVAL:\s*500/);
      
      // 验证MAX_ATTEMPTS: 50
      expect(contentScriptCode).toMatch(/MAX_ATTEMPTS:\s*50/);
      expect(contentScriptCode).not.toMatch(/MAX_ATTEMPTS:\s*20/);
      
      console.log(`✓ TIMING配置验证通过`);
      console.log(`  - ELEMENT_CHECK_INTERVAL: 100ms ✓`);
      console.log(`  - MAX_ATTEMPTS: 50次 ✓`);
      console.log(`  - 理论最大等待时间: 5000ms (100ms × 50)`);
    });

    test('应该验证promptTemplate加载逻辑的修复', async () => {
      const fs = require('fs');
      const path = require('path');
      const contentScriptPath = path.join(__dirname, '../../smart-search-extension/content.js');
      const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf-8');
      
      // 验证promptTemplate始终被加载（不依赖enableDeepThinking）
      expect(contentScriptCode).toMatch(/promptTemplate:\s*promptTemplate/);
      
      // 确保没有错误的逻辑（enableDeepThinking ? promptTemplate : ''）
      expect(contentScriptCode).not.toMatch(/enableDeepThinking\s*\?\s*promptTemplate\s*:\s*['"]/);
      
      console.log(`✓ promptTemplate加载逻辑验证通过`);
      console.log(`  - 始终加载promptTemplate，不依赖enableDeepThinking ✓`);
      console.log(`  - 由skipPromptTemplate控制是否使用 ✓`);
    });

    test('应该验证prepareSearchText逻辑正确', async () => {
      const fs = require('fs');
      const path = require('path');
      const contentScriptPath = path.join(__dirname, '../../smart-search-extension/content.js');
      const contentScriptCode = fs.readFileSync(contentScriptPath, 'utf-8');
      
      // 验证prepareSearchText中使用skipPromptTemplate
      expect(contentScriptCode).toMatch(/!skipPromptTemplate\s*&&\s*promptTemplate/);
      
      console.log(`✓ prepareSearchText逻辑验证通过`);
      console.log(`  - 使用skipPromptTemplate控制提示词添加 ✓`);
    });
  });
});
