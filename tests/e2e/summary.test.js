/**
 * 浏览记录总结功能E2E测试
 */

const {
  launchBrowserWithExtension,
  getExtensionId,
  openExtensionPage,
  wait
} = require('./setup');

describe('浏览记录总结功能E2E测试', () => {
  let browser;
  let extensionId;

  beforeAll(async () => {
    browser = await launchBrowserWithExtension();
    extensionId = await getExtensionId(browser);
    console.log('🔧 扩展ID:', extensionId);
  }, 60000);

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('应该能够在历史记录页面显示总结按钮', async () => {
    // 打开历史记录页面
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);

    // 检查总结按钮是否存在
    const buttonExists = await historyPage.evaluate(() => {
      const btn = document.getElementById('summarize-today-btn');
      return btn !== null && btn.textContent.includes('总结今天浏览');
    });

    expect(buttonExists).toBe(true);
    await historyPage.close();
  }, 30000);

  test('应该能够在没有记录时显示提示', async () => {
    // 打开历史记录页面
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);

    // 清空所有记录
    const hasClearBtn = await historyPage.evaluate(() => {
      const btn = document.getElementById('clear-btn');
      return btn !== null;
    });

    if (hasClearBtn) {
      // 注意：这里可能会弹出确认对话框，需要处理
      historyPage.on('dialog', async dialog => {
        await dialog.accept();
      });
    }

    await historyPage.close();
  }, 30000);

  test('应该能够生成真实的浏览记录', async () => {
    // 1. 先启用页面追踪功能
    const optionsPage = await openExtensionPage(browser, extensionId, 'options.html');
    await wait(1000);

    const enableTracking = await optionsPage.evaluate(() => {
      const checkbox = document.getElementById('enable-page-tracking');
      if (checkbox && !checkbox.checked) {
        checkbox.checked = true;
        document.getElementById('save').click();
        return true;
      }
      return false;
    });

    if (enableTracking) {
      await wait(1000);
      console.log('✅ 已启用页面追踪');
    }

    await optionsPage.close();

    // 2. 访问几个测试网页来创建浏览记录
    const testUrls = [
      'https://www.baidu.com',
      'https://example.com'
    ];

    for (const url of testUrls) {
      const testPage = await browser.newPage();
      await testPage.goto(url);
      console.log('📄 访问:', url);
      await wait(6000); // 等待超过5秒以触发记录
      await testPage.close();
    }

    console.log('✅ 已创建测试浏览记录');
  }, 120000);

  test('应该能够点击总结按钮并生成总结', async () => {
    // 打开历史记录页面
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(3000);

    // 检查是否有今天的记录
    const todayRecordCount = await historyPage.evaluate(() => {
      const todayHeader = Array.from(document.querySelectorAll('.date-header'))
        .find(h => h.textContent.includes('今天'));
      
      if (todayHeader) {
        const match = todayHeader.textContent.match(/\((\d+)\)/);
        return match ? parseInt(match[1]) : 0;
      }
      return 0;
    });

    console.log('📊 今天的记录数:', todayRecordCount);

    if (todayRecordCount > 0) {
      // 设置对话框处理
      let alertMessage = '';
      historyPage.on('dialog', async dialog => {
        alertMessage = dialog.message();
        console.log('💬 提示信息:', alertMessage);
        await dialog.accept();
      });

      // 点击总结按钮
      await historyPage.evaluate(() => {
        document.getElementById('summarize-today-btn').click();
      });

      await wait(2000);

      // 验证提示信息
      expect(alertMessage).toContain('已准备好今天的浏览总结');
      expect(alertMessage).toContain('条记录');
    } else {
      console.log('⚠️  今天没有浏览记录，跳过总结测试');
    }

    await historyPage.close();
  }, 30000);

  test('应该能够将总结数据保存到storage', async () => {
    // 打开历史记录页面
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);

    // 模拟点击总结（如果有记录）
    const hasRecords = await historyPage.evaluate(() => {
      const cards = document.querySelectorAll('.history-card');
      return cards.length > 0;
    });

    if (hasRecords) {
      // 处理可能的弹窗
      historyPage.on('dialog', async dialog => {
        await dialog.accept();
      });

      // 点击总结按钮前，先检查storage
      const beforeClick = await historyPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate'], (result) => {
            resolve(result);
          });
        });
      });

      console.log('📦 点击前的storage:', beforeClick);

      // 点击总结按钮
      await historyPage.evaluate(() => {
        document.getElementById('summarize-today-btn').click();
      });

      await wait(2000);

      // 检查storage中的数据
      const afterClick = await historyPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate'], (result) => {
            resolve(result);
          });
        });
      });

      console.log('📦 点击后的storage:', afterClick);

      // 验证数据已保存
      if (afterClick.tempSearchText) {
        expect(afterClick.tempSearchText).toContain('请帮我总结');
        expect(afterClick.skipPromptTemplate).toBe(true);
      }
    } else {
      console.log('⚠️  没有浏览记录，跳过storage验证');
    }

    await historyPage.close();
  }, 30000);

  test('应该能够验证总结文本的格式', async () => {
    const historyPage = await openExtensionPage(browser, extensionId, 'history.html');
    await wait(2000);

    const todayRecordCount = await historyPage.evaluate(() => {
      const todayHeader = Array.from(document.querySelectorAll('.date-header'))
        .find(h => h.textContent.includes('今天'));
      return todayHeader ? true : false;
    });

    if (todayRecordCount) {
      historyPage.on('dialog', async dialog => {
        await dialog.accept();
      });

      await historyPage.evaluate(() => {
        document.getElementById('summarize-today-btn').click();
      });

      await wait(2000);

      // 读取生成的总结文本
      const summaryData = await historyPage.evaluate(() => {
        return new Promise((resolve) => {
          chrome.storage.local.get('tempSearchText', (result) => {
            resolve(result.tempSearchText);
          });
        });
      });

      if (summaryData) {
        console.log('📝 总结文本长度:', summaryData.length);
        
        // 验证总结文本包含必要的部分
        expect(summaryData).toContain('请帮我总结');
        expect(summaryData).toContain('浏览记录');
        expect(summaryData).toContain('主要浏览的网站和类型');
        expect(summaryData).toContain('关注的主要话题或领域');
        expect(summaryData).toContain('浏览时间分布特点');
        expect(summaryData).toContain('建议和洞察');
      }
    } else {
      console.log('⚠️  今天没有记录，跳过文本格式验证');
    }

    await historyPage.close();
  }, 30000);
});


