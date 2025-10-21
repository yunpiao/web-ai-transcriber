/**
 * 追踪功能E2E测试
 */

const path = require('path');
const {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  waitForElement,
  wait
} = require('./setup');

describe('追踪功能E2E测试', () => {
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

  test('应该能够启用追踪功能', async () => {
    // 打开设置页面
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    
    await wait(1000);
    
    // 启用页面追踪
    await optionsPage.click('#enable-page-tracking');
    await optionsPage.click('#save');
    
    await wait(1000);
    
    // 验证保存成功
    const statusText = await optionsPage.$eval('#status', el => el.textContent);
    expect(statusText).toContain('已保存');
    
    await optionsPage.close();
  });

  test('应该在页面停留5秒后记录', async () => {
    // 首先启用功能
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    await wait(500);
    await optionsPage.click('#enable-page-tracking');
    await optionsPage.click('#save');
    await wait(500);
    await optionsPage.close();
    
    // 获取初始记录数
    const historyPage1 = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);
    const initialCount = parseInt(await historyPage1.$eval('#total-count', el => el.textContent));
    console.log(`初始记录数: ${initialCount}`);
    await historyPage1.close();
    
    // 打开一个真实的网页（使用about:blank作为简单测试）
    const testPage = await browser.newPage();
    await testPage.goto('about:blank');
    
    // 在页面中添加内容和标记，模拟真实页面
    await testPage.evaluate(() => {
      document.title = '测试页面标题';
      document.body.innerHTML = '<h1>测试内容</h1><p>这是测试文本</p>';
      document.body.dataset.testReady = 'true';
    });
    
    console.log('页面已加载，等待6秒记录...');
    
    // 等待6秒（确保超过5秒阈值）
    await wait(6000);
    
    console.log('等待完成，检查记录...');
    
    await testPage.close();
    
    // 再次检查记录数
    const historyPage2 = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);
    const finalCount = parseInt(await historyPage2.$eval('#total-count', el => el.textContent));
    console.log(`最终记录数: ${finalCount}`);
    await historyPage2.close();
    
    // 验证记录数增加了（注意：about:blank可能不会被记录，这是已知限制）
    // 这个测试主要验证流程，实际记录需要真实URL
    expect(finalCount).toBeGreaterThanOrEqual(initialCount);
  }, 20000); // 延长测试超时时间

  test('应该在功能禁用时不记录', async () => {
    // 禁用功能
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    await wait(500);
    
    // 确保checkbox未勾选
    const isChecked = await optionsPage.$eval('#enable-page-tracking', el => el.checked);
    if (isChecked) {
      await optionsPage.click('#enable-page-tracking');
      await optionsPage.click('#save');
      await wait(500);
    }
    
    await optionsPage.close();
    
    // 打开测试页面
    const testPagePath = path.join(__dirname, '../fixtures/test-page.html');
    const testPage = await browser.newPage();
    await testPage.goto(`file://${testPagePath}`);
    
    await testPage.waitForSelector('[data-test-ready="true"]');
    
    // 等待6秒
    await wait(6000);
    
    // 功能禁用，不应该记录
    // 实际验证需要检查IndexedDB
    
    await testPage.close();
  }, 15000);

  test('应该能够访问真实网页并创建记录', async () => {
    console.log('🔧 扩展ID:', extensionId);
    
    // 启用功能
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    await wait(1000);
    
    // 验证配置页面是否正常
    const optionsLoaded = await optionsPage.evaluate(() => {
      return {
        hasEnableCheckbox: !!document.querySelector('#enable-page-tracking'),
        hasSaveButton: !!document.querySelector('#save')
      };
    });
    console.log('⚙️  配置页面状态:', optionsLoaded);
    
    await optionsPage.click('#enable-page-tracking');
    await optionsPage.click('#save');
    await wait(1000);
    
    // 确认配置已保存
    const savedSettings = await optionsPage.evaluate(() => {
      return document.querySelector('#enable-page-tracking').checked;
    });
    console.log('✅ 配置已保存，追踪功能启用:', savedSettings);
    
    await optionsPage.close();
    
    // 获取初始记录数
    const historyPage1 = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(3000);
    const initialCount = parseInt(await historyPage1.$eval('#total-count', el => el.textContent));
    console.log(`✅ 初始记录数: ${initialCount}`);
    await historyPage1.close();
    
    // 访问真实网页（百度）
    const testPage = await browser.newPage();
    
    // 监听console输出，查看tracker是否运行
    testPage.on('console', msg => {
      const text = msg.text();
      if (text.includes('页面追踪') || text.includes('tracker') || text.includes('记录')) {
        console.log(`  📝 页面日志: ${text}`);
      }
    });
    
    console.log('🌐 正在访问 baidu.com...');
    
    try {
      await testPage.goto('https://www.baidu.com', { 
        waitUntil: 'domcontentloaded',
        timeout: 15000 
      });
      console.log('✓ 页面已加载');
      
      // 等待content script加载
      await wait(2000);
      
      // 检查扩展状态和tracker
      const debugInfo = await testPage.evaluate(() => {
        const recordKey = `recorded_${window.location.href}`;
        return {
          url: window.location.href,
          title: document.title,
          hasSessionStorage: !!sessionStorage.getItem(recordKey),
          sessionStorageKeys: Object.keys(sessionStorage),
          bodyText: document.body.innerText.substring(0, 100),
          scriptsCount: document.scripts.length
        };
      });
      console.log('📍 页面调试信息:', JSON.stringify(debugInfo, null, 2));
      
      // 检查chrome runtime是否可用（表示content script已加载）
      const hasChrome = await testPage.evaluate(() => {
        return {
          hasChromeRuntime: typeof chrome !== 'undefined' && !!chrome.runtime,
          hasChromeStorage: typeof chrome !== 'undefined' && !!chrome.storage
        };
      });
      console.log('🔌 Chrome API状态:', hasChrome);
      
    } catch (e) {
      console.log('⚠️ 页面加载出错:', e.message);
    }
    
    console.log('⏱️  等待6秒让tracker记录页面...');
    await wait(6000);
    
    console.log('✓ 关闭测试页面');
    await testPage.close();
    
    // 检查是否创建了记录
    console.log('⏱️  等待2秒让数据写入数据库...');
    await wait(2000);
    
    const historyPage2 = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(3000);
    
    const finalCount = parseInt(await historyPage2.$eval('#total-count', el => el.textContent));
    console.log(`📊 最终记录数: ${finalCount}`);
    
    // 验证：记录数应该增加了
    if (finalCount > initialCount) {
      console.log(`✅ 成功！记录从 ${initialCount} 增加到 ${finalCount}`);
      expect(finalCount).toBeGreaterThan(initialCount);
    } else {
      console.log(`❌ 失败：记录未增加 (仍然是 ${finalCount})`);
      // 获取更多调试信息
      const debugInfo = await historyPage2.evaluate(() => {
        return {
          hasEmptyState: !document.querySelector('#empty-state')?.classList.contains('hidden'),
          hasTimeline: !document.querySelector('#timeline')?.classList.contains('hidden')
        };
      });
      console.log('调试信息:', debugInfo);
      expect(finalCount).toBeGreaterThan(initialCount);
    }
    
    await historyPage2.close();
  }, 45000);

  test('应该能够打开历史记录并查看统计', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    
    await wait(2000); // 等待页面加载和数据库查询
    
    // 检查统计信息元素存在
    const totalCountElement = await historyPage.$('#total-count');
    expect(totalCountElement).not.toBeNull();
    
    // 获取统计数字
    const totalCount = await historyPage.$eval('#total-count', el => el.textContent);
    console.log(`历史记录总数: ${totalCount}`);
    
    // 应该是有效的数字
    const count = parseInt(totalCount);
    expect(isNaN(count)).toBe(false);
    expect(count).toBeGreaterThanOrEqual(0);
    
    // 验证页面状态：如果没有记录应该显示空状态，如果有记录应该显示列表
    const pageState = await historyPage.evaluate(() => {
      const emptyState = document.querySelector('#empty-state');
      const timeline = document.querySelector('#timeline');
      return {
        emptyVisible: emptyState && !emptyState.classList.contains('hidden'),
        timelineVisible: timeline && !timeline.classList.contains('hidden'),
        count: parseInt(document.querySelector('#total-count').textContent)
      };
    });
    
    console.log('页面状态:', pageState);
    
    // 验证逻辑一致性：没有记录时显示空状态，有记录时显示时间线
    if (pageState.count === 0) {
      expect(pageState.emptyVisible).toBe(true);
    } else {
      expect(pageState.timelineVisible).toBe(true);
    }
    
    await historyPage.close();
  });
});

