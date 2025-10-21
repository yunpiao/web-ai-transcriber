/**
 * E2E测试环境配置
 */

const puppeteer = require('puppeteer');
const path = require('path');

// 扩展目录路径
const EXTENSION_PATH = path.join(__dirname, '../../smart-search-extension');

/**
 * 启动带扩展的浏览器
 */
async function launchBrowserWithExtension() {
  const browser = await puppeteer.launch({
    headless: false, // 前台模式，可以看到浏览器
    args: [
      `--disable-extensions-except=${EXTENSION_PATH}`,
      `--load-extension=${EXTENSION_PATH}`,
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled' // 避免被检测为自动化
    ],
    // 重要：不要设置defaultViewport，让浏览器使用正常大小
    defaultViewport: null
  });
  
  return browser;
}

/**
 * 获取扩展ID
 */
async function getExtensionId(browser) {
  // 等待service worker启动（最多10秒）
  for (let i = 0; i < 20; i++) {
    const targets = await browser.targets();
    const extensionTarget = targets.find(
      target => target.type() === 'service_worker'
    );
    
    if (extensionTarget) {
      const extensionUrl = extensionTarget.url();
      const [, , extensionId] = extensionUrl.split('/');
      return extensionId;
    }
    
    // 等待500ms后重试
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  throw new Error('Extension service worker not found after 10 seconds');
}

/**
 * 打开扩展页面
 */
async function openExtensionPage(browser, extensionId, page) {
  const extensionUrl = `chrome-extension://${extensionId}/${page}`;
  const newPage = await browser.newPage();
  await newPage.goto(extensionUrl, { waitUntil: 'networkidle0' });
  return newPage;
}

/**
 * 等待元素出现
 */
async function waitForElement(page, selector, timeout = 5000) {
  try {
    await page.waitForSelector(selector, { timeout });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 等待指定时间
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  waitForElement,
  wait,
  EXTENSION_PATH
};

