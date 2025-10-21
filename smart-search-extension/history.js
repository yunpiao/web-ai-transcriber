// 历史记录页面脚本
import { getAllHistory, deleteHistory, clearAllHistory } from './db.js';

let allRecords = [];
let filteredRecords = [];
let currentSearchQuery = ''; // 当前搜索关键词
let selectedDate = null; // 选中的日期 (Date对象)
let selectedHour = null; // 选中的小时 (0-23)
let currentMonth = new Date(); // 当前显示的月份

// 格式化时间
function formatTime(timestamp) {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// 格式化日期
function formatDate(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取相对日期标签
function getDateLabel(timestamp) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  // 重置时间为0点，只比较日期
  date.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  yesterday.setHours(0, 0, 0, 0);
  
  if (date.getTime() === today.getTime()) {
    return '今天';
  } else if (date.getTime() === yesterday.getTime()) {
    return '昨天';
  } else {
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date >= weekAgo) {
      return '本周';
    } else {
      return '更早';
    }
  }
}

// 按日期分组记录
function groupRecordsByDate(records) {
  const groups = {
    '今天': [],
    '昨天': [],
    '本周': [],
    '更早': []
  };
  
  records.forEach(record => {
    const label = getDateLabel(record.visitTime);
    groups[label].push(record);
  });
  
  return groups;
}

// 渲染单条历史记录
function renderHistoryCard(record) {
  const card = document.createElement('div');
  card.className = 'history-card';
  card.dataset.id = record.id;
  
  // 截取内容摘要（前200字符）
  const contentPreview = record.content ? 
    (record.content.length > 200 ? record.content.substring(0, 200) + '...' : record.content) : 
    '无内容';
  
  card.innerHTML = `
    <div class="card-header">
      <img src="${record.favicon}" class="favicon" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>📄</text></svg>'">
      <a href="${record.url}" class="card-title" target="_blank" title="${record.title}">${record.title}</a>
      <span class="card-time">${formatTime(record.visitTime)}</span>
    </div>
    <div class="card-url" title="${record.url}">${record.url}</div>
    <div>
      <span class="card-domain">${record.domain}</span>
      <span style="font-size: 12px; color: #999;">${formatDate(record.visitTime)}</span>
    </div>
    <div class="card-content">${contentPreview}</div>
    <div class="card-actions">
      <button class="btn btn-primary btn-small visit-btn" data-url="${record.url}">访问</button>
      <button class="btn btn-danger btn-small delete-btn" data-id="${record.id}">删除</button>
    </div>
  `;
  
  return card;
}

// 渲染历史记录列表
function renderHistory(records) {
  const timeline = document.getElementById('timeline');
  timeline.innerHTML = '';
  
  if (records.length === 0) {
    timeline.classList.add('hidden');
    document.getElementById('empty-state').classList.remove('hidden');
    return;
  }
  
  timeline.classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  
  const groups = groupRecordsByDate(records);
  
  // 按照顺序渲染各个分组
  ['今天', '昨天', '本周', '更早'].forEach(label => {
    if (groups[label].length > 0) {
      const dateGroup = document.createElement('div');
      dateGroup.className = 'date-group';
      
      const dateHeader = document.createElement('div');
      dateHeader.className = 'date-header';
      dateHeader.textContent = `${label} (${groups[label].length})`;
      dateGroup.appendChild(dateHeader);
      
      groups[label].forEach(record => {
        dateGroup.appendChild(renderHistoryCard(record));
      });
      
      timeline.appendChild(dateGroup);
    }
  });
  
  // 绑定事件监听器
  bindEventListeners();
}

// 绑定事件监听器
function bindEventListeners() {
  // 访问按钮
  document.querySelectorAll('.visit-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const url = e.target.dataset.url;
      window.open(url, '_blank');
    });
  });
  
  // 删除按钮
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = parseInt(e.target.dataset.id);
      if (confirm('确定要删除这条记录吗？')) {
        try {
          await deleteHistory(id);
          // 从数组中移除
          allRecords = allRecords.filter(r => r.id !== id);
          filteredRecords = filteredRecords.filter(r => r.id !== id);
          // 重新渲染
          renderHistory(filteredRecords);
          updateStats();
        } catch (error) {
          alert('删除失败：' + error.message);
        }
      }
    });
  });
}

// 更新统计信息
function updateStats() {
  document.getElementById('total-count').textContent = allRecords.length;
}

// 更新筛选信息
function updateFilterInfo() {
  const filteredInfo = document.getElementById('filtered-info');
  if (filteredRecords.length < allRecords.length) {
    filteredInfo.textContent = `(已筛选出 ${filteredRecords.length} 条)`;
    filteredInfo.style.color = '#1a73e8';
  } else {
    filteredInfo.textContent = '';
  }
}

// 生成日历
function renderCalendar() {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  // 更新月份显示
  document.getElementById('current-month').textContent = `${year}年${month + 1}月`;
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startWeekday = firstDay.getDay();
  
  const calendarGrid = document.getElementById('calendar-grid');
  
  // 清除之前生成的日期（保留星期标题）
  const weekdayElements = calendarGrid.querySelectorAll('.calendar-weekday');
  calendarGrid.innerHTML = '';
  weekdayElements.forEach(el => calendarGrid.appendChild(el));
  
  // 获取有记录的日期
  const recordDates = getRecordDates();
  
  // 填充上个月的日期
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day other-month';
    dayDiv.textContent = day;
    calendarGrid.appendChild(dayDiv);
  }
  
  // 填充当月日期
  const today = new Date();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = day;
    dayDiv.dataset.date = date.toDateString();
    
    // 标记今天
    if (isSameDay(date, today)) {
      dayDiv.classList.add('today');
    }
    
    // 标记选中日期
    if (selectedDate && isSameDay(date, selectedDate)) {
      dayDiv.classList.add('selected');
    }
    
    // 标记有记录的日期
    const dateStr = formatDateKey(date);
    if (recordDates[dateStr]) {
      dayDiv.classList.add('has-records');
    }
    
    // 未来日期不可选
    if (date > today) {
      dayDiv.classList.add('disabled');
    } else {
      dayDiv.addEventListener('click', () => selectDate(date));
    }
    
    calendarGrid.appendChild(dayDiv);
  }
  
  // 填充下个月的日期
  const remainingCells = 42 - (startWeekday + daysInMonth);
  for (let day = 1; day <= remainingCells; day++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day other-month';
    dayDiv.textContent = day;
    calendarGrid.appendChild(dayDiv);
  }
}

// 生成24小时选择器
function renderHours() {
  const hoursGrid = document.getElementById('hours-grid');
  hoursGrid.innerHTML = '';
  
  // 获取选中日期的小时记录
  const hourCounts = getHourCounts();
  
  for (let hour = 0; hour < 24; hour++) {
    const hourBtn = document.createElement('div');
    hourBtn.className = 'hour-btn';
    hourBtn.textContent = `${hour}点`;
    hourBtn.dataset.hour = hour;
    
    // 标记选中小时
    if (selectedHour === hour) {
      hourBtn.classList.add('selected');
    }
    
    // 标记有记录的小时
    if (hourCounts[hour]) {
      hourBtn.classList.add('has-records');
    }
    
    hourBtn.addEventListener('click', () => selectHour(hour));
    hoursGrid.appendChild(hourBtn);
  }
}

// 获取有记录的日期
function getRecordDates() {
  const dates = {};
  allRecords.forEach(record => {
    const date = new Date(record.visitTime);
    const key = formatDateKey(date);
    dates[key] = (dates[key] || 0) + 1;
  });
  return dates;
}

// 获取选中日期每小时的记录数
function getHourCounts() {
  const counts = {};
  if (!selectedDate) return counts;
  
  allRecords.forEach(record => {
    const recordDate = new Date(record.visitTime);
    if (isSameDay(recordDate, selectedDate)) {
      const hour = recordDate.getHours();
      counts[hour] = (counts[hour] || 0) + 1;
    }
  });
  
  return counts;
}

// 选择日期
function selectDate(date) {
  selectedDate = date;
  selectedHour = null; // 切换日期时清除小时选择
  renderCalendar();
  renderHours();
  applyFilters();
}

// 选择小时
function selectHour(hour) {
  if (selectedHour === hour) {
    selectedHour = null; // 取消选择
  } else {
    selectedHour = hour;
  }
  renderHours();
  applyFilters();
}

// 清除筛选
function clearFilters() {
  selectedDate = null;
  selectedHour = null;
  currentSearchQuery = '';
  document.getElementById('search-input').value = '';
  renderCalendar();
  renderHours();
  applyFilters();
}

// 格式化日期为键（用于分组）
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 判断两个日期是否是同一天
function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// 搜索功能
function searchRecords(query) {
  currentSearchQuery = query;
  applyFilters();
}

// 应用所有筛选条件
function applyFilters() {
  let results = [...allRecords];
  
  // 应用日期筛选
  if (selectedDate) {
    results = results.filter(record => {
      const recordDate = new Date(record.visitTime);
      return isSameDay(recordDate, selectedDate);
    });
    
    // 应用小时筛选
    if (selectedHour !== null) {
      results = results.filter(record => {
        const recordDate = new Date(record.visitTime);
        return recordDate.getHours() === selectedHour;
      });
    }
  }
  
  // 应用搜索筛选
  if (currentSearchQuery.trim()) {
    const lowerQuery = currentSearchQuery.toLowerCase();
    results = results.filter(record => 
      record.title.toLowerCase().includes(lowerQuery) ||
      record.url.toLowerCase().includes(lowerQuery) ||
      record.domain.toLowerCase().includes(lowerQuery)
    );
  }
  
  filteredRecords = results;
  renderHistory(filteredRecords);
  updateFilterInfo();
}

// 导出数据
function exportData() {
  if (allRecords.length === 0) {
    alert('没有数据可以导出');
    return;
  }
  
  const dataStr = JSON.stringify(allRecords, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `browsing-history-${formatDate(Date.now())}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// 清空所有记录
async function clearAll() {
  if (allRecords.length === 0) {
    alert('没有记录可以清空');
    return;
  }
  
  if (confirm(`确定要清空所有 ${allRecords.length} 条记录吗？此操作不可恢复！`)) {
    try {
      await clearAllHistory();
      allRecords = [];
      filteredRecords = [];
      renderHistory(filteredRecords);
      updateStats();
      alert('所有记录已清空');
    } catch (error) {
      alert('清空失败：' + error.message);
    }
  }
}

// 总结今天的浏览记录
async function summarizeToday() {
  try {
    // 获取今天的记录
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 过滤并验证记录
    const todayRecords = allRecords.filter(record => {
      if (!record || !record.visitTime) return false;
      const recordDate = new Date(record.visitTime);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
    
    if (todayRecords.length === 0) {
      alert('今天还没有浏览记录');
      return;
    }
    
    // 生成总结提示词
    let summaryText = `请帮我总结一下今天（${formatDate(Date.now())}）的浏览记录，共浏览了 ${todayRecords.length} 个网页。以下是详细的浏览记录：\n\n`;
    
    // 按时间顺序排序
    const sortedRecords = [...todayRecords].sort((a, b) => a.visitTime - b.visitTime);
    
    // 添加每条记录的信息
    sortedRecords.forEach((record, index) => {
      if (!record) return; // 防御性检查
      
      summaryText += `${index + 1}. [${formatTime(record.visitTime)}] ${record.title || '无标题'}\n`;
      summaryText += `   网址: ${record.url || '无网址'}\n`;
      summaryText += `   域名: ${record.domain || '未知域名'}\n`;
      if (record.content && record.content.trim()) {
        // 限制内容长度，避免过长
        const contentPreview = record.content.length > 150 
          ? record.content.substring(0, 150) + '...' 
          : record.content;
        summaryText += `   内容摘要: ${contentPreview}\n`;
      }
      summaryText += '\n';
    });
    
    summaryText += '\n请根据以上浏览记录，总结今天的浏览主题和关注重点，并给出以下内容：\n';
    summaryText += '1. 主要浏览的网站和类型\n';
    summaryText += '2. 关注的主要话题或领域\n';
    summaryText += '3. 浏览时间分布特点\n';
    summaryText += '4. 建议和洞察（如果有的话）';
    
    // 将总结文本保存到 storage，供转写页面使用
    // 添加标识表示这是总结功能，不需要添加默认提示词模板
    await chrome.storage.local.set({ 
      'tempSearchText': summaryText,
      'skipPromptTemplate': true  // 跳过默认提示词模板
    });
    
    // 获取用户设置的转写引擎
    const settings = await chrome.storage.sync.get({
      favoriteEngine: 'qwen',
      useCurrentTab: false
    });
    
    // 定义搜索引擎URL
    const SEARCH_ENGINES = {
      gemini: { url: 'https://gemini.google.com/app' },
      qwen: { url: 'https://chat.qwen.ai/' },
      deepseek: { url: 'https://chat.deepseek.com/' },
      aistudio: { url: 'https://aistudio.google.com/app/prompts/new_chat' }
    };
    
    const engineUrl = SEARCH_ENGINES[settings.favoriteEngine].url;
    
    // 提示用户
    alert(`已准备好今天的浏览总结（${todayRecords.length} 条记录），即将打开转写界面...`);
    
    // 根据用户设置决定打开方式
    if (settings.useCurrentTab) {
      // 在当前页面打开
      window.location.href = engineUrl;
    } else {
      // 在新标签页打开
      window.open(engineUrl, '_blank');
    }
    
  } catch (error) {
    console.error('总结失败:', error);
    alert('总结失败：' + error.message);
  }
}

// 初始化页面
async function init() {
  try {
    // 显示加载状态
    document.getElementById('loading').classList.remove('hidden');
    document.getElementById('timeline').classList.add('hidden');
    document.getElementById('empty-state').classList.add('hidden');
    
    // 加载历史记录
    allRecords = await getAllHistory();
    filteredRecords = [...allRecords];
    
    // 隐藏加载状态
    document.getElementById('loading').classList.add('hidden');
    
    // 渲染记录
    renderHistory(filteredRecords);
    updateStats();
    
    // 初始化日历和小时选择器
    renderCalendar();
    renderHours();
    
    // 绑定全局事件
    document.getElementById('search-input').addEventListener('input', (e) => {
      searchRecords(e.target.value);
    });
    
    // 月份导航
    document.getElementById('prev-month').addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() - 1);
      renderCalendar();
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      renderCalendar();
    });
    
    // 清除筛选
    document.getElementById('clear-filter').addEventListener('click', clearFilters);
    
    document.getElementById('export-btn').addEventListener('click', exportData);
    document.getElementById('clear-btn').addEventListener('click', clearAll);
    document.getElementById('summarize-today-btn').addEventListener('click', summarizeToday);
    
  } catch (error) {
    console.error('初始化失败:', error);
    document.getElementById('loading').innerHTML = `
      <div style="color: #d32f2f;">
        <p>加载失败：${error.message}</p>
        <button onclick="location.reload()" class="btn btn-primary" style="margin-top: 10px;">重试</button>
      </div>
    `;
  }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

