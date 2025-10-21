/**
 * 设置页面E2E测试
 */

const {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  waitForElement,
  wait
} = require('./setup');

describe('设置页面E2E测试', () => {
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

  test('应该能够打开设置页面', async () => {
    const page = await openExtensionPage(browser, extensionId, 'options.html');
    
    // 检查页面标题
    const title = await page.title();
    expect(title).toContain('设置');
    
    // 检查关键元素是否存在
    const hasSearchEngine = await waitForElement(page, '#search-engine');
    const hasSaveButton = await waitForElement(page, '#save');
    
    expect(hasSearchEngine).toBe(true);
    expect(hasSaveButton).toBe(true);
    
    await page.close();
  });

  test('应该能够启用页面追踪功能', async () => {
    const page = await openExtensionPage(browser, extensionId, 'options.html');
    
    // 等待页面加载
    await wait(1000);
    
    // 勾选页面追踪选项
    await page.click('#enable-page-tracking');
    
    // 点击保存按钮
    await page.click('#save');
    
    // 等待保存完成
    await wait(1000);
    
    // 检查状态提示
    const statusText = await page.$eval('#status', el => el.textContent);
    expect(statusText).toContain('已保存');
    
    await page.close();
  });

  test('应该能够切换搜索引擎选项', async () => {
    const page = await openExtensionPage(browser, extensionId, 'options.html');
    
    await wait(1000);
    
    // 选择DeepSeek引擎
    await page.select('#search-engine', 'deepseek');
    
    // 保存
    await page.click('#save');
    await wait(1000);
    
    // 刷新页面验证保存
    await page.reload({ waitUntil: 'networkidle0' });
    await wait(1000);
    
    // 验证选项被保存
    const selectedValue = await page.$eval('#search-engine', el => el.value);
    expect(selectedValue).toBe('deepseek');
    
    await page.close();
  });

  test('应该能够查看历史记录链接', async () => {
    const page = await openExtensionPage(browser, extensionId, 'options.html');
    
    await wait(1000);
    
    // 检查历史记录链接是否存在
    const historyLink = await page.$('a[href="history.html"]');
    expect(historyLink).not.toBeNull();
    
    // 获取链接文本
    const linkText = await page.$eval('a[href="history.html"]', el => el.textContent);
    expect(linkText).toContain('历史记录');
    
    await page.close();
  });

  test('应该能够启用深度思考功能', async () => {
    const page = await openExtensionPage(browser, extensionId, 'options.html');
    
    await wait(1000);
    
    // 勾选深度思考
    await page.click('#enable-deep-search');
    
    // 保存
    await page.click('#save');
    await wait(1000);
    
    // 刷新验证
    await page.reload({ waitUntil: 'networkidle0' });
    await wait(1000);
    
    // 验证复选框状态
    const isChecked = await page.$eval('#enable-deep-search', el => el.checked);
    expect(isChecked).toBe(true);
    
    await page.close();
  });
});

