// 页面追踪脚本 - 监测页面停留时间并记录
console.log('[页面追踪] tracker.js 已加载 - URL:', window.location.href);

(async () => {
  // 从 storage 获取功能开关状态
  const settings = await chrome.storage.sync.get({
    enablePageTracking: false
  });

  if (!settings.enablePageTracking) {
    console.log('[页面追踪] 功能未启用');
    return;
  }

  // ========== 核心变量 ==========
  const currentUrl = window.location.href;
  const storageKey = `duration_record_${currentUrl}`;
  
  let recordId = sessionStorage.getItem(storageKey);  // 当前记录ID
  let currentDuration = 0;  // 当前累计时长（秒）
  let startTime = Date.now();  // 计时开始时间
  let isPageVisible = !document.hidden;  // 页面是否可见
  let countTimer = null;  // 1秒计时器
  let saveTimer = null;  // 30秒保存定时器
  let hasInitialRecord = false;  // 是否已创建初始记录

  // ========== 工具函数 ==========
  
  // 获取网站 favicon
  function getFavicon() {
    let icon = document.querySelector('link[rel="icon"]') || 
               document.querySelector('link[rel="shortcut icon"]') ||
               document.querySelector('link[rel="apple-touch-icon"]');
    
    if (icon && icon.href) {
      return icon.href;
    }
    
    const url = new URL(window.location.href);
    return `${url.origin}/favicon.ico`;
  }

  // 提取页面文本内容
  function getPageContent() {
    const article = document.querySelector('article');
    const content = article ? article.innerText : document.body.innerText;
    return content.replace(/\s+/g, ' ').trim();
  }

  // ========== 核心功能函数 ==========
  
  // 创建初始记录
  async function createInitialRecord() {
    if (hasInitialRecord) return;
    
    try {
      const url = new URL(window.location.href);
      const now = Date.now();
      
      const historyData = {
        id: now,
        url: currentUrl,
        title: document.title || 'Untitled',
        favicon: getFavicon(),
        content: getPageContent(),
        visitTime: now,
        domain: url.hostname,
        duration: Math.floor(currentDuration),  // 初始时长（秒）
        lastUpdateTime: now
      };

      // 发送消息到 background script 创建记录
      chrome.runtime.sendMessage({
        action: 'savePageHistory',
        data: historyData
      }, (response) => {
        if (response && response.success) {
          recordId = historyData.id;
          sessionStorage.setItem(storageKey, recordId);
          hasInitialRecord = true;
          console.log('[页面追踪] 初始记录已创建, ID:', recordId, '时长:', currentDuration + '秒');
          
          // 启动定期保存
          startAutoSave();
        } else {
          console.error('[页面追踪] 创建记录失败:', response?.error);
        }
      });
    } catch (error) {
      console.error('[页面追踪] 创建记录时出错:', error);
    }
  }

  // 更新记录时长
  async function updateDuration() {
    if (!recordId) {
      console.warn('[页面追踪] 没有记录ID，跳过更新');
      return;
    }
    
    try {
      const now = Date.now();
      
      // 发送消息到 background script 更新时长
      chrome.runtime.sendMessage({
        action: 'updatePageHistory',
        data: {
          id: parseInt(recordId),
          duration: Math.floor(currentDuration),
          lastUpdateTime: now
        }
      }, (response) => {
        if (response && response.success) {
          console.log('[页面追踪] 时长已更新:', Math.floor(currentDuration) + '秒');
        } else {
          console.error('[页面追踪] 更新失败:', response?.error);
        }
      });
    } catch (error) {
      console.error('[页面追踪] 更新时长时出错:', error);
    }
  }

  // 启动定期保存（每30秒）
  function startAutoSave() {
    if (saveTimer) return;  // 避免重复启动
    
    saveTimer = setInterval(() => {
      if (recordId && currentDuration > 0) {
        updateDuration();
      }
    }, 30000);  // 30秒
    
    console.log('[页面追踪] 定期保存已启动（每30秒）');
  }

  // 停止所有定时器
  function stopTimers() {
    if (countTimer) {
      clearInterval(countTimer);
      countTimer = null;
    }
    if (saveTimer) {
      clearInterval(saveTimer);
      saveTimer = null;
    }
  }

  // ========== 计时逻辑 ==========
  
  // 更新累计时长（每秒调用）
  function updateCounter() {
    if (isPageVisible) {
      const elapsed = (Date.now() - startTime) / 1000;  // 转换为秒
      currentDuration += elapsed;
      startTime = Date.now();
      
      // 达到5秒且未创建记录时，创建初始记录
      if (!hasInitialRecord && currentDuration >= 5) {
        console.log('[页面追踪] 停留超过5秒，创建记录');
        createInitialRecord();
      }
    }
  }

  // 监听页面可见性变化
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // 页面不可见，保存当前时长
      if (isPageVisible) {
        const elapsed = (Date.now() - startTime) / 1000;
        currentDuration += elapsed;
        console.log('[页面追踪] 页面隐藏，当前时长:', Math.floor(currentDuration) + '秒');
      }
      isPageVisible = false;
    } else {
      // 页面可见，重新开始计时
      isPageVisible = true;
      startTime = Date.now();
      console.log('[页面追踪] 页面显示，继续计时');
    }
  });

  // 页面卸载前保存最终时长
  window.addEventListener('beforeunload', () => {
    // 计算最终时长
    if (isPageVisible) {
      const elapsed = (Date.now() - startTime) / 1000;
      currentDuration += elapsed;
    }
    
    // 如果有记录ID，保存最终时长
    if (recordId && currentDuration > 0) {
      // 使用 sendBeacon 确保数据发送（即使页面关闭）
      const data = JSON.stringify({
        action: 'updatePageHistory',
        data: {
          id: parseInt(recordId),
          duration: Math.floor(currentDuration),
          lastUpdateTime: Date.now()
        }
      });
      
      // 尝试使用 sendBeacon
      if (navigator.sendBeacon) {
        // 注意：sendBeacon 需要配合 background script 处理
        // 这里我们仍然用同步方式作为后备
        navigator.sendBeacon('/update-duration', data);
      }
      
      // 同步发送消息（可能不可靠，但作为备份）
      try {
        chrome.runtime.sendMessage({
          action: 'updatePageHistory',
          data: {
            id: parseInt(recordId),
            duration: Math.floor(currentDuration),
            lastUpdateTime: Date.now()
          }
        });
      } catch (e) {
        // 忽略错误（页面可能已关闭）
      }
      
      console.log('[页面追踪] 页面卸载，最终时长:', Math.floor(currentDuration) + '秒');
    }
    
    // 停止所有定时器
    stopTimers();
  });

  // ========== 启动追踪 ==========
  
  // 如果已有记录ID，说明是同一标签页内的继续访问
  if (recordId) {
    console.log('[页面追踪] 继续追踪已有记录, ID:', recordId);
    hasInitialRecord = true;
    startAutoSave();
  }

  // 启动1秒计时器
  if (isPageVisible) {
    countTimer = setInterval(updateCounter, 1000);
    console.log('[页面追踪] 计时器已启动');
  }
})();
