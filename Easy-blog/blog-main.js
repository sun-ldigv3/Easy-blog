export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 核心API路由：保持原有逻辑完全不变
    if (url.pathname === "/api/notes") {
      // 获取所有笔记（原有KV读取逻辑）
      if (request.method === "GET") {
        const notes = [];
        try {
          let cursor = null;
          do {
            const listOptions = { limit: 1000 };
            if (cursor) listOptions.cursor = cursor;
            
          if (!env.NOTES) throw new Error("KV namespace 'NOTES' not bound");
            
          const result = await env.NOTES.list(listOptions);
          for (const key of result.keys) {
            if (key.name) {
              try {
                const value = await env.NOTES.get(key.name);
                notes.push({
                  id: key.name,
                  content: value || "",
                  modified: key.modified ? new Date(key.modified).toISOString() : new Date().toISOString()
                });
              } catch (getErr) {
                console.warn(`Failed to get value for key ${key.name}:`, getErr);
              }
            }
          }
          cursor = result.cursor;
        } while (cursor);
      } catch (err) {
        console.error("KV list error:", err);
        return new Response(JSON.stringify({ 
          error: "Failed to read KV", 
          details: err.message 
        }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
      return new Response(JSON.stringify(notes), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    
    // 保存笔记（原有逻辑）
    if (request.method === "POST") {
      try {
        const body = await request.json().catch(() => null);
        if (!body || !body.id || !body.content) {
          return new Response("Missing id or content", { status: 400 });
        }
        await env.NOTES.put(body.id, body.content);
        return new Response(JSON.stringify({ success: true, message: "Note saved" }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Save failed", details: err.message }), { status: 500 });
      }
    }
    
    // 删除笔记（原有逻辑）
    if (request.method === "DELETE") {
      const id = url.searchParams.get("id");
      if (!id) return new Response("Missing id", { status: 400 });
      try {
        await env.NOTES.delete(id);
        return new Response(JSON.stringify({ success: true, message: "Note deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Delete failed", details: err.message }), { status: 500 });
      }
    }
    
    return new Response("Method Not Allowed", { status: 405 });
  }

  // 单页面展示：Material Design扁平极简风格
  return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Easy-blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    /* 页面渐显动画 */
    body {
      font-family: "Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: #FFFFFF;
      color: #202124;
      animation: pageFadeIn 0.6s cubic-bezier(0.4,0,0.2,1);
    }
    
    @keyframes pageFadeIn {
      0% { opacity: 0; }
      100% { opacity: 1; }
    }

    /* 主布局容器 */
    .main-container {
      display: flex;
      min-height: 100vh;
    }
    
    /* Material Design左侧导航栏 */
    .sidebar {
      width: 280px;
      background: #FFFFFF;
      border-right: 1px solid #E8EAED;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      z-index: 100;
      box-shadow: 0 1px 2px rgba(60,64,67,0.1);
    }
    
    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid #E8EAED;
    }
    
    .sidebar-header h2 {
      font-size: 20px;
      color: #202124;
      font-weight: 500;
    }
    
    .navigation-list {
      padding: 16px;
    }
    
    .nav-item {
      display: block;
      background: transparent;
      border-radius: 0 25px 25px 0;
      margin: 4px 12px;
      padding: 12px 16px;
      color: #5F6368;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      border: none;
    }
    
    .nav-item:hover {
      background: #F1F3F4;
    }
    
    .nav-title {
      font-weight: 500;
      font-size: 14px;
      margin-bottom: 4px;
      color: #202124;
    }
    
    .nav-preview {
      font-size: 12px;
      color: #5F6368;
      line-height: 1.4;
    }
    
    .nav-date {
      font-size: 11px;
      color: #9AA0A6;
    }
    
    .nav-empty {
      text-align: center;
      padding: 40px 16px;
      color: #9AA0A6;
    }
    
    /* Material Design搜索框 */
    .search-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
    }
    
    .search-input {
      width: 48px;
      height: 48px;
      padding: 12px 16px;
      border: none;
      border-radius: 24px;
      font-size: 14px;
      transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
      background: #F1F3F4;
      box-shadow: none;
    }
    
    .search-input:focus {
      width: 320px;
      background: #FFFFFF;
      box-shadow: 0 1px 3px rgba(60,64,67,0.1);
      outline: none;
    }
    
    .search-input:hover {
      width: 200px;
    }
    
    /* 右侧内容区 */
    .content-area {
      flex: 1;
      margin-left: 280px;
      padding: 32px;
    }
    
    header {
      margin-bottom: 32px;
      padding-bottom: 16px;
      border-bottom: 1px solid #E8EAED;
    }
    
    h1 { 
      font-size: 28px; 
      color: #202124;
      font-weight: 400;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 14px;
      color: #5F6368;
    }
    
    /* Material Design状态提示 */
    .alert { 
      padding: 16px; 
      border-radius: 8px; 
      margin-bottom: 20px; 
      font-weight: 500; 
      border: none;
      box-shadow: 0 1px 2px rgba(60,64,67,0.1);
    }
    
    .alert-error { 
      background: #FCE8E6;
      color: #C5221F;
    }
    
    .alert-success { 
      background: #E6F4EA;
      color: #137333;
    }
    
    .loading { 
      text-align: center; 
      padding: 80px 0; 
      color: #5F6368; 
      font-size: 16px;
    }
    
    .empty-state { 
      text-align: center; 
      padding: 80px 0; 
      color: #5F6368;
    }
    
    .empty-state p { 
      font-size: 16px; 
      margin-bottom: 16px; 
    }
    
    /* Material Design按钮 */
    .btn { 
      padding: 10px 24px; 
      border: none; 
      border-radius: 20px; 
      cursor: pointer; 
      font-size: 14px; 
      font-weight: 500;
      text-transform: none;
      box-shadow: none;
    }
    
    .btn-primary { 
      background: #4285F4;
      color: white;
      box-shadow: 0 1px 2px rgba(60,64,67,0.1);
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    }
    
    .btn-primary:hover {
      background: #3367D6;
      box-shadow: 0 1px 3px rgba(60,64,67,0.1);
    }
    
    /* 垂直卡片布局 */
    .data-grid-vertical {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    /* Material Design卡片设计 */
    .data-card {
      width: 100%;
      min-height: 180px;
      border: none;
      border-radius: 12px;
      padding: 24px;
      background: #FFFFFF;
      box-shadow: 0 1px 2px rgba(60,64,67,0.1), 
                  0 1px 3px 1px rgba(60,64,67,0.1);
      transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
      opacity: 0;
      transform: translateY(16px);
    }
    
    .data-card:hover {
      box-shadow: 0 1px 3px rgba(60,64,67,0.1), 
                  0 4px 8px 3px rgba(60,64,67,0.1);
      transform: translateY(-2px);
    }
    
    .data-id {
      font-weight: 500;
      color: #4285F4;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #F1F3F4;
      font-size: 16px;
    }
    
    .data-content {
      color: #202124;
      line-height: 1.6;
      /* 仅修改这一行：pre-wrap 保留空格/缩进，同时支持自动换行 */
      white-space: pre-wrap;
      margin-bottom: 16px;
      font-size: 14px;
    }
    
    .data-meta {
      font-size: 12px;
      color: #5F6368;
      text-align: right;
      font-weight: 400;
    }
    
    /* 卡片加载动画 */
    @keyframes cardSlideUp {
      0% {
        opacity: 0;
        transform: translateY(16px);
      }
      100% {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .card-entering {
      animation: cardSlideUp 0.5s cubic-bezier(0.4,0,0.2,1) forwards;
    }
    
    /* Material Design波纹效果 */
    .ripple {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
      transform: scale(0);
      animation: ripple-animation 0.6s linear;
    }
    
    @keyframes ripple-animation {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  </style>
</head>
<body>
  <div class="main-container">
    <!-- Material Design左侧导航栏 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>导航</h2>
      </div>
      <div id="navigation" class="navigation-list"></div>
    </div>
    
    <!-- Material Design搜索框 -->
    <div class="search-container">
      <input type="text" id="navSearch" placeholder="🔍︎" class="search-input">
    </div>
    
    <!-- 右侧内容区 -->
    <div class="content-area">
      <header>
        <h1>Easy-blog</h1>
        <p class="subtitle">共 <span id="totalCount">0</span> 条笔记</p>
      </header>
      
      <!-- 状态提示区域 -->
      <div id="alert" class="alert" style="display: none;"></div>
      <div id="loading" class="loading">正在加载...</div>
      <div id="empty" class="empty-state" style="display: none;">
        <p>KV存储中未找到数据</p>
        <button class="btn btn-primary" onclick="window.location.reload()">刷新页面</button>
      </div>
      
      <!-- 垂直排列的卡片容器 -->
      <div id="dataGrid" class="data-grid-vertical"></div>
    </div>
  </div>

  <script>
    // 页面加载立即读取KV数据
    document.addEventListener('DOMContentLoaded', function() {
      loadAllKVData();
      setupSearchFilter();
      setupRippleEffects();
    });

    // 核心：读取所有KV数据
    async function loadAllKVData() {
      const alertEl = document.getElementById('alert');
      const loadingEl = document.getElementById('loading');
      const emptyEl = document.getElementById('empty');
      const dataGridEl = document.getElementById('dataGrid');

      try {
        const response = await fetch('/api/notes');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.details || data.error || '加载KV数据失败');
        }

        loadingEl.style.display = 'none';

        if (data.length === 0) {
          emptyEl.style.display = 'block';
          return;
        }

        // 生成导航栏
        generateNavigation(data);
        
        // 渲染垂直卡片
        renderVerticalCards(data);
        
        // 启动卡片入场动画
        animateCardEntrance();
        
        document.getElementById('totalCount').textContent = data.length;

      } catch (err) {
        loadingEl.style.display = 'none';
        alertEl.style.display = 'block';
        alertEl.className = 'alert alert-error';
        alertEl.innerHTML = \`
          <strong>错误:</strong> \${err.message}<br>
          <small>检查: 1) KV命名空间绑定为"NOTES" 2) Worker具有KV读取权限 3) KV中有数据</small>
        \`;
        console.error("KV加载错误:", err);
      }
    }

    // 生成导航栏HTML
    function generateNavigation(data) {
      const navContainer = document.getElementById('navigation');
      
      if (data.length === 0) {
        navContainer.innerHTML = '<div class="nav-empty">暂无数据</div>';
        return;
      }
      
      const navHTML = data.map(item => \`
        <div class="nav-item" onclick="scrollToCard('\${item.id}')">
          <div class="nav-title">\${escapeHtml(item.id)}</div>
          <div class="nav-preview">\${escapeHtml(item.content.substring(0, 45))}\${item.content.length > 45 ? '...' : ''}</div>
          <div class="nav-date">\${new Date(item.modified).toLocaleDateString()}</div>
        </div>
      \`).join('');
      
      navContainer.innerHTML = navHTML;
    }

    // 渲染垂直卡片布局
    function renderVerticalCards(data) {
      const dataGridEl = document.getElementById('dataGrid');
      dataGridEl.innerHTML = '';
      
      data.sort((a, b) => new Date(b.modified) - new Date(a.modified));
      
      data.forEach(item => {
        const card = document.createElement('div');
        card.className = 'data-card';
        card.setAttribute('data-id', item.id);
        
        const safeId = escapeHtml(item.id);
        const safeContent = escapeHtml(item.content);
        const formattedDate = new Date(item.modified).toLocaleString();
        
        card.innerHTML = \`
          <div class="data-id">\${safeId}</div>
          <div class="data-content">\${safeContent.replace(/\\n/g, '<br>')}</div>
          <div class="data-meta">更新时间: \${formattedDate}</div>
        \`;
        
        dataGridEl.appendChild(card);
      });
    }

    // 平滑滚动到指定卡片
    function scrollToCard(cardId) {
      const element = document.querySelector(\`[data-id="\${cardId}"]\`);
      if (element) {
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center'
        });
        
        // Material Design状态指示
        element.style.background = '#F8F9FA';
        setTimeout(() => {
          element.style.background = '#FFFFFF';
        }, 1500);
      }
    }

    // 卡片入场序列动画
    function animateCardEntrance() {
      const cards = document.querySelectorAll('.data-card');
      cards.forEach((card, index) => {
        setTimeout(() => {
          card.style.transition = 'all 0.5s cubic-bezier(0.4,0,0.2,1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 80);
      });
    }

    // 实时搜索过滤
    function setupSearchFilter() {
      const searchInput = document.getElementById('navSearch');
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const navItems = document.querySelectorAll('.nav-item');
        
        navItems.forEach(item => {
          const text = item.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
    }

    // Material Design波纹效果
    function setupRippleEffects() {
      const buttons = document.querySelectorAll('.btn, .nav-item');
      buttons.forEach(button => {
        button.addEventListener('click', function(e) {
          createRipple(e);
        });
      });
    }

    function createRipple(event) {
      const button = event.currentTarget;
      const circle = document.createElement("span");
      const diameter = Math.max(button.clientWidth, button.clientHeight);
      const radius = diameter / 2;
      
      circle.style.width = circle.style.height = \`\${diameter}px\`;
      circle.style.left = \`\${event.clientX - button.offsetLeft - radius}px\`;
      circle.style.top = \`\${event.clientY - button.offsetTop - radius}px\`;
      circle.classList.add("ripple");
      
      const ripple = button.getElementsByClassName("ripple")[0];
      if (ripple) ripple.remove();
      
      button.appendChild(circle);
    }

    // 辅助函数：HTML转义
    function escapeHtml(unsafe) {
      if (!unsafe) return '';
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  </script>
</body>
</html>
    `, { headers: { "content-type": "text/html; charset=utf-8" } });
  }
}
