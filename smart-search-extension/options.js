// 默认提示词模板
const DEFAULT_PROMPT = `你将扮演一个'录音文字稿'优化器，将用户发送的视频文字稿优化为一篇结构清晰、内容准确且易于阅读的文章。你必须严格遵循以下规则来优化文稿：
目的和目标：
* 接收用户提供的视频文字稿。
* 优化文稿，使其具备更好的可读性和结构。
* 保留文稿中的所有核心信息，确保信息的完整性。
* 最终产出一篇适合保存和后续阅读的文章。
行为和规则：
1. 内容优化：
    a) 为文字稿添加适当的二级标题，以帮助组织内容并提升阅读体验。
    b) 将文字稿中的重要内容进行加粗处理，突出重点信息。
    c) 将文字稿合理分段落，避免大段文字堆砌，使结构更清晰。
    d) 仔细校对并修改文字稿中的错别字、语法错误和标点符号问题。
    e) 识别并彻底删除文字稿中所有的广告部分（包括但不限于推销信息、产品宣传等）。
    f) 优化口语化表述，将其转换为书面化语言，去除冗余的语气词（例如：'嗯'、'啊'、'呃'、'那个'等），使文稿更流畅、专业。
2. 格式和结构：
    a) 尽可能避免使用多层级的无序列表。如果必须使用列表，请尽量使用单层级列表，或考虑将其转换为段落文字。
    b) 优化后的文字稿应以文章形式呈现，而不是简单的文字堆砌。
3. 信息保留：
    a) 你的首要任务是保留文字稿的所有原始信息。在优化过程中，不得删除任何非广告性的内容，确保信息的完整性。
    b) 任何修改都应以提升可读性为目标，而不是改变原意。
整体语气：
* 保持专业、严谨和细致。
* 提供清晰、准确的优化结果。
* 专注于文字稿的优化工作，不进行额外的评论或问答。 文字稿为：`;

// 保存选项到 chrome.storage
function save_options() {
  const engine = document.getElementById('search-engine').value;
  const promptTemplate = document.getElementById('prompt-template').value;
  const enabledeepThinking = document.getElementById('enable-deep-search').checked;
  const useCurrentTab = document.getElementById('use-current-tab').checked;
  const enablePageTracking = document.getElementById('enable-page-tracking').checked;
  
  chrome.storage.sync.set({
    favoriteEngine: engine,
    promptTemplate: promptTemplate,
    enabledeepThinking: enabledeepThinking,
    useCurrentTab: useCurrentTab,
    enablePageTracking: enablePageTracking
  }, () => {
    // 更新状态，告诉用户选项已保存
    const status = document.getElementById('status');
    status.textContent = '选项已保存。';
    setTimeout(() => {
      status.textContent = '';
    }, 1500);
  });
}

// 从 chrome.storage 读取已保存的选项并显示
function restore_options() {
  chrome.storage.sync.get({
    favoriteEngine: 'google', // 默认值是 'google'
    promptTemplate: DEFAULT_PROMPT, // 默认提示词
    enabledeepThinking: false, // 默认不启用深度搜索
    useCurrentTab: false, // 默认不在当前页面打开
    enablePageTracking: false // 默认不启用页面追踪
  }, (items) => {
    document.getElementById('search-engine').value = items.favoriteEngine;
    document.getElementById('prompt-template').value = items.promptTemplate;
    document.getElementById('enable-deep-search').checked = items.enabledeepThinking;
    document.getElementById('use-current-tab').checked = items.useCurrentTab;
    document.getElementById('enable-page-tracking').checked = items.enablePageTracking;
  });
}

// 重置提示词为默认值
function reset_prompt() {
  document.getElementById('prompt-template').value = DEFAULT_PROMPT;
  
  // 显示提示但不立即保存，用户需要点击保存按钮
  const status = document.getElementById('status');
  status.textContent = '已重置为默认提示词，请点击保存按钮以应用更改。';
  setTimeout(() => {
    status.textContent = '';
  }, 3000);
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', restore_options);

// 按钮事件监听器
document.getElementById('save').addEventListener('click', save_options);
document.getElementById('reset-prompt').addEventListener('click', reset_prompt);
