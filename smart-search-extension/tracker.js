// 页面追踪脚本 - 监测页面停留时间并记录
console.log('[页面追踪] tracker.js 已加载 - URL:', window.location.href);

(async () => {
  // 检查是否已记录过此页面（使用 sessionStorage 防止同一标签页重复记录）
  const recordKey = `recorded_${window.location.href}`;
  if (sessionStorage.getItem(recordKey)) {
    console.log('[页面追踪] 此页面已记录，跳过');
    return;
  }

  // 从 storage 获取功能开关状态
  const settings = await chrome.storage.sync.get({
    enablePageTracking: false
  });

  if (!settings.enablePageTracking) {
    console.log('[页面追踪] 功能未启用');
    return;
  }

  let startTime = Date.now();
  let totalTime = 0;
  let isPageVisible = !document.hidden;
  let timerHandle = null;
  let hasRecorded = false;

  // 获取网站 favicon
  function getFavicon() {
    // 尝试多种方式获取 favicon
    let icon = document.querySelector('link[rel="icon"]') || 
               document.querySelector('link[rel="shortcut icon"]') ||
               document.querySelector('link[rel="apple-touch-icon"]');
    
    if (icon && icon.href) {
      return icon.href;
    }
    
    // 默认使用根路径的 favicon.ico
    const url = new URL(window.location.href);
    return `${url.origin}/favicon.ico`;
  }

  // 提取页面文本内容
  function getPageContent() {
    // 优先提取 article 标签内容，否则使用 body
    const article = document.querySelector('article');
    const content = article ? article.innerText : document.body.innerText;
    
    // 清理多余的空白字符
    return content.replace(/\s+/g, ' ').trim();
  }

  // 记录页面访问
  async function recordPageVisit() {
    if (hasRecorded) return;
    
    try {
      const url = new URL(window.location.href);
      
      const historyData = {
        id: Date.now(),
        url: window.location.href,
        title: document.title || 'Untitled',
        favicon: getFavicon(),
        content: getPageContent(),
        visitTime: Date.now(),
        domain: url.hostname
      };

      // 发送消息到 background script
      chrome.runtime.sendMessage({
        action: 'savePageHistory',
        data: historyData
      }, (response) => {
        if (response && response.success) {
          console.log('[页面追踪] 页面访问已记录');
          // 标记为已记录
          sessionStorage.setItem(recordKey, 'true');
          hasRecorded = true;
        } else {
          console.error('[页面追踪] 记录失败:', response?.error);
        }
      });
    } catch (error) {
      console.error('[页面追踪] 记录页面时出错:', error);
    }
  }

  // 检查是否达到5秒
  function checkTimer() {
    if (hasRecorded) return;
    
    if (isPageVisible) {
      const elapsed = Date.now() - startTime;
      totalTime += elapsed;
      
      if (totalTime >= 5000) {
        console.log('[页面追踪] 页面停留超过5秒，开始记录');
        recordPageVisit();
        clearInterval(timerHandle);
      }
      
      startTime = Date.now();
    }
  }

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (hasRecorded) return;
    
    if (document.hidden) {
      // 页面不可见，暂停计时
      isPageVisible = false;
      if (timerHandle) {
        const elapsed = Date.now() - startTime;
        totalTime += elapsed;
      }
    } else {
      // 页面可见，继续计时
      isPageVisible = true;
      startTime = Date.now();
    }
  });

  // 启动计时器（每秒检查一次）
  if (isPageVisible) {
    timerHandle = setInterval(checkTimer, 1000);
  }

  // 页面卸载前检查（如果快要达到5秒）
  window.addEventListener('beforeunload', () => {
    if (!hasRecorded && isPageVisible) {
      const elapsed = Date.now() - startTime;
      totalTime += elapsed;
      
      // 如果总时间接近5秒（4.5秒以上），立即记录
      if (totalTime >= 4500) {
        recordPageVisit();
      }
    }
  });
})();

