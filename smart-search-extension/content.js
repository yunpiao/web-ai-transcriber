// 【架构升级】为每个引擎定义输入框和提交按钮的选择器
const ENGINE_CONFIG = {
  'gemini.google.com': {
    // Gemini 的输入框和按钮选择器
    input: 'div.ql-editor.textarea, rich-textarea .ql-editor',
    submit: 'button.send-button, div.send-button-container button',
  },
  'chat.qwen.ai': {
    // Qwen 的选择器同样针对其UI组件
    input: '#chat-input',
    submit: '#send-message-button',
    deepThinkingButton: 'button.ThinkingButton,button.chat-input-feature-btn' //
  },
  'chat.deepseek.com': {
    // DeepSeek 的选择器，基于用户提供的实际界面
    input: 'textarea#chat-input',
    submit: 'button#send-message-button',
  },
  'aistudio.google.com': {
    // Google AI Studio 的输入框和按钮选择器
    input: 'textarea.textarea, textarea[aria-label*="Type something"]',
    submit: 'button[aria-label="Run"], button.run-button',
  }
};

// 自执行异步函数
(async () => {
  // 从storage获取临时搜索文本和相关标识
  const data = await chrome.storage.local.get(['tempSearchText', 'skipPromptTemplate']);
  let searchText = data.tempSearchText;
  if (!searchText) return;
  
  const skipPromptTemplate = data.skipPromptTemplate || false;

  // 从storage获取用户自定义提示词（如果不跳过的话）
  let promptTemplate = '';
  if (!skipPromptTemplate) {
    const promptData = await chrome.storage.sync.get('promptTemplate');
    promptTemplate = promptData.promptTemplate || `你将扮演一个'录音文字稿'优化器，将用户发送的视频文字稿优化为一篇结构清晰、内容准确且易于阅读的文章。你必须严格遵循以下规则来优化文稿：
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
  }

  // 从storage获取深度搜索设置
  const deepThinkingData = await chrome.storage.sync.get('enabledeepThinking');
  const enabledeepThinking = deepThinkingData.enabledeepThinking || false;

  const hostname = window.location.hostname;
  const config = ENGINE_CONFIG[hostname];

  if (!config) {
    console.error(`[智能搜索扩展] 未找到适用于 ${hostname} 的配置`);
    return;
  }
  
  // 使用延时和重试来等待动态加载的元素
  let attempts = 0;
  const maxAttempts = 20; // 10秒超时
  const interval = setInterval(async () => {
    const inputBox = document.querySelector(config.input);
    attempts++;
    console.log(`[调试] 第${attempts}次尝试:`, {
      inputFound: !!document.querySelector(config.input),
      submitFound: !!document.querySelector(config.submit)
    });

    if (inputBox) {
      clearInterval(interval);
      console.log(`[智能搜索扩展] 已找到输入框。`);

      // 如果启用了深度搜索，并且当前网站有深度搜索/思考按钮，则点击
      if (enabledeepThinking && config.deepThinkingButton) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("选择器", config.deepThinkingButton);
        const deepThinkingButton = document.querySelector(config.deepThinkingButton);
        if (deepThinkingButton) {
          console.log('[智能搜索扩展] 正在启用深度搜索/思考功能...');
          deepThinkingButton.click();
          // 给一点时间让界面响应
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
          console.log('[智能搜索扩展] 未找到深度搜索/思考按钮');
        }
      }

      // 组装最终的搜索文本，将提示词模板与实际文本结合
      searchText = `${promptTemplate}${searchText}`;

      // 1. 填入内容
      searchText = searchText.replace(/</g, '\'<\'').replace(/>/g, '\'>\'');
      if (inputBox.tagName === 'DIV') {
        inputBox.innerHTML = searchText.replace(/\n/g, '<br>');
      } else {
        inputBox.value = searchText;
      }

      // 2. 【关键】派发 'input' 事件，通知网页框架内容已更新
      inputBox.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      
      // 3. 等待一个微小的延迟，让框架有时间反应
      setTimeout(async () => {
        // 4. 【最可靠】直接点击提交按钮
        const submitButton = document.querySelector(config.submit);
        if (submitButton) {
          submitButton.click();
        } else {
          console.error(`[智能搜索扩展] 未找到提交按钮 ('${config.submit}')。`);
        }
        //  如果提交按钮未找到, 则在文本输入框上模拟按键
        if (!submitButton) {
          inputBox.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            bubbles: true,
            cancelable: true
          }));
        }
        // 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
        inputBox.blur();

        // 循环等待 markdown markdown-main-panel 出现
        let markdownMainPanel = document.querySelector(".markdown-main-panel");
        while (!markdownMainPanel) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          markdownMainPanel = document.querySelector(".markdown-main-panel");
        }
        if (markdownMainPanel) {
          console.log('[智能搜索扩展] 已找到 markdown-main-panel 元素');
          markdownMainPanel.focus();
          markdownMainPanel.scrollIntoView({ behavior: 'smooth' });
          markdownMainPanel.click();
        } else {
          console.error('[智能搜索扩展] 未找到 markdown 元素');
        }

        
        // 5. 清理工作
        await chrome.storage.local.remove(['tempSearchText', 'skipPromptTemplate']);
        console.log(`[智能搜索扩展] 任务完成，临时数据已清除。`);
      }, 200); // 延迟增加到200ms以提高稳定性

    } else if (attempts >= maxAttempts) {
      clearInterval(interval);
      console.error(`[智能搜索扩展] 超时：未能找到输入框 ('${config.input}') 或提交按钮 ('${config.submit}')。`);
    }
  }, 500);
})();
