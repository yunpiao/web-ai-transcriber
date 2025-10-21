/**
 * 浏览时长功能E2E测试
 */

const {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  wait
} = require('./setup');

describe('浏览时长功能E2E测试', () => {
  let browser;
  let extensionId;

  beforeAll(async () => {
    browser = await launchBrowserWithExtension();
    extensionId = await getExtensionId(browser);
    
    // 启用页面追踪功能
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    await wait(1000);
    
    await optionsPage.click('#enable-page-tracking');
    await optionsPage.click('#save');
    await wait(1000);
    
    await optionsPage.close();
    
    console.log('✅ 已启用页面追踪功能');
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('应该能够创建包含时长的记录', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    
    await wait(1000);
    
    // 清空所有记录
    await historyPage.evaluate(async () => {
      const { clearAllHistory } = await import('./db.js');
      await clearAllHistory();
    });
    
    // 直接在页面中创建带时长的记录（模拟tracker.js的行为）
    await historyPage.evaluate(async () => {
      const { saveHistory } = await import('./db.js');
      const now = Date.now();
      
      await saveHistory({
        id: now,
        url: 'https://example.com/test',
        title: '测试页面（有时长）',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '这是一个测试页面内容',
        visitTime: now,
        duration: 6,  // 6秒停留时长
        lastUpdateTime: now
      });
    });
    
    console.log('✅ 已创建带时长的测试记录');
    
    // 刷新历史记录页面
    await historyPage.reload();
    await wait(2000);
    
    // 检查是否有记录
    const recordCount = await historyPage.$$eval('.history-card', cards => cards.length);
    expect(recordCount).toBe(1);
    console.log(`✅ 发现 ${recordCount} 条记录`);
    
    // 检查记录是否包含时长信息
    const durationInfo = await historyPage.evaluate(() => {
      const durationEl = document.querySelector('.card-duration');
      if (!durationEl) return null;
      
      return {
        exists: true,
        text: durationEl.textContent.trim()
      };
    });
    
    expect(durationInfo).not.toBeNull();
    expect(durationInfo.exists).toBe(true);
    expect(durationInfo.text).toContain('秒');
    console.log('✅ 记录包含时长信息:', durationInfo.text);
    
    // 清理
    await historyPage.evaluate(async () => {
      const { clearAllHistory } = await import('./db.js');
      await clearAllHistory();
    });
    
    await historyPage.close();
  }, 30000);

  test('应该在历史记录页面显示格式化的时长', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    
    await wait(1000);
    
    // 清空并插入测试数据
    await historyPage.evaluate(async () => {
      const { clearAllHistory, saveHistory } = await import('./db.js');
      await clearAllHistory();
      
      const now = Date.now();
      
      // 插入带有不同时长的记录
      await saveHistory({
        id: now,
        url: 'https://example.com/short',
        title: '短时长页面',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '测试内容',
        visitTime: now,
        duration: 30,  // 30秒
        lastUpdateTime: now
      });
      
      await saveHistory({
        id: now + 1,
        url: 'https://example.com/medium',
        title: '中等时长页面',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '测试内容',
        visitTime: now + 1,
        duration: 150,  // 2分30秒
        lastUpdateTime: now + 1
      });
      
      await saveHistory({
        id: now + 2,
        url: 'https://example.com/long',
        title: '长时长页面',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '测试内容',
        visitTime: now + 2,
        duration: 3661,  // 1小时1分1秒
        lastUpdateTime: now + 2
      });
    });
    
    await historyPage.reload();
    await wait(2000);
    
    // 获取所有时长显示
    const durations = await historyPage.$$eval('.card-duration, .card-duration-empty', 
      els => els.map(el => el.textContent.trim())
    );
    
    expect(durations.length).toBe(3);
    console.log('时长显示:', durations);
    
    // 验证时长格式
    expect(durations.some(d => d.includes('秒'))).toBe(true);
    expect(durations.some(d => d.includes('分'))).toBe(true);
    expect(durations.some(d => d.includes('小时'))).toBe(true);
    
    console.log('✅ 时长格式化正确');
    
    // 清理
    await historyPage.evaluate(async () => {
      const { clearAllHistory } = await import('./db.js');
      await clearAllHistory();
    });
    
    await historyPage.close();
  }, 30000);

  test('应该显示时长图标和样式', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    
    await wait(1000);
    
    // 插入带时长的记录
    await historyPage.evaluate(async () => {
      const { clearAllHistory, saveHistory } = await import('./db.js');
      await clearAllHistory();
      
      await saveHistory({
        id: Date.now(),
        url: 'https://example.com',
        title: '测试页面',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '测试内容',
        visitTime: Date.now(),
        duration: 120,
        lastUpdateTime: Date.now()
      });
    });
    
    await historyPage.reload();
    await wait(2000);
    
    // 检查时长元素
    const durationInfo = await historyPage.evaluate(() => {
      const durationEl = document.querySelector('.card-duration');
      if (!durationEl) return null;
      
      return {
        text: durationEl.textContent,
        hasIcon: durationEl.textContent.includes('⏱️'),
        className: durationEl.className
      };
    });
    
    expect(durationInfo).not.toBeNull();
    expect(durationInfo.hasIcon).toBe(true);
    expect(durationInfo.className).toContain('card-duration');
    
    console.log('✅ 时长图标和样式正确');
    
    // 清理
    await historyPage.evaluate(async () => {
      const { clearAllHistory } = await import('./db.js');
      await clearAllHistory();
    });
    
    await historyPage.close();
  }, 30000);

  test('应该正确处理没有时长的旧记录', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    
    await wait(1000);
    
    // 插入没有duration字段的旧记录
    await historyPage.evaluate(async () => {
      const { clearAllHistory, saveHistory } = await import('./db.js');
      await clearAllHistory();
      
      await saveHistory({
        id: Date.now(),
        url: 'https://example.com/old',
        title: '旧记录（无时长）',
        domain: 'example.com',
        favicon: 'https://example.com/favicon.ico',
        content: '测试内容',
        visitTime: Date.now()
        // 没有duration字段
      });
    });
    
    await historyPage.reload();
    await wait(2000);
    
    // 检查是否显示"未记录"
    const durationText = await historyPage.evaluate(() => {
      const durationEl = document.querySelector('.card-duration-empty');
      return durationEl ? durationEl.textContent.trim() : null;
    });
    
    expect(durationText).toContain('未记录');
    console.log('✅ 正确处理旧记录:', durationText);
    
    // 清理
    await historyPage.evaluate(async () => {
      const { clearAllHistory } = await import('./db.js');
      await clearAllHistory();
    });
    
    await historyPage.close();
  }, 30000);
});

