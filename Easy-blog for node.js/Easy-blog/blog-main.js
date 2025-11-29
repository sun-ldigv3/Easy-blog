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

  // 单页面展示：优化布局设计
  return new Response(`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Easy-blog</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif; background: #fff; color: #333; }
    
    /* 主布局容器 */
    .main-container {
      display: flex;
      min-height: 100vh;
    }
    
    /* 变窄的左侧导航栏 */
    .sidebar {
      width: 250px; /* 从320px缩减至250px */
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
      z-index: 100;
    }
    
    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
      background: white;
    }
    
    .sidebar-header h2 {
      font-size: 1.3rem; /* 适当缩小标题字号 */
      color: #1f2937;
      margin-bottom: 15px;
    }
    
    .navigation-list {
      padding: 15px;
    }
    
    .nav-item {
      display: block;
      padding: 14px;
      margin-bottom: 10px;
      border-radius: 8px;
      color: #4b5563;
      text-decoration: none;
      transition: all 0.3s ease;
      cursor: pointer;
      border: 1px solid transparent;
    }
    
    .nav-item:hover {
      background: #edf2f7;
      color: #2563eb;
      border-color: #e2e8f0;
      transform: translateY(-1px);
    }
    
    .nav-title {
      font-weight: 600;
      font-size: 1rem; /* 缩小导航标题字号 */
      margin-bottom: 6px;
    }
    
    .nav-preview {
      font-size: 0.85rem; /* 缩小预览文字 */
      color: #6b7280;
      line-height: 1.3;
      margin-bottom: 6px;
    }
    
    .nav-date {
      font-size: 0.75rem; /* 缩小日期文字 */
      color: #9ca3af;
    }
    
    .nav-empty {
      text-align: center;
      padding: 30px 15px;
      color: #9ca3af;
    }
    
    /* 右上角搜索框设计 */
    .search-container {
      position: fixed;
      top: 25px;
      right: 40px;
      z-index: 1000;
    }
    
    .search-input {
      width: 45px;
      height: 45px;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 22.5px;
      font-size: 0.95rem;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      background: white;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .search-input:focus {
      width: 280px;
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .search-input:hover {
      width: 200px;
    }
    
    /* 右侧内容区 - 调整边距 */
    .content-area {
      flex: 1;
      margin-left: 250px; /* 对应导航栏宽度 */
      padding: 35px;
    }
    
    header {
      margin-bottom: 35px;
      padding-bottom: 20px;
      border-bottom: 1px solid #f1f5f9;
    }
    
    h1 { 
      font-size: 2.3rem; 
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .subtitle {
      font-size: 1.05rem;
      color: #6b7280;
    }
    
    /* 状态提示样式 */
    .alert { 
      padding: 16px; 
      border-radius: 8px; 
      margin-bottom: 20px; 
      font-weight: 500; 
    }
    
    .alert-error { 
      background: #fee2e2; 
      color: #dc2626; 
      border: 1px solid #fecaca; 
    }
    
    .alert-success { 
      background: #dcfce7; 
      color: #166534; 
      border: 1px solid #bbf7d0; 
    }
    
    .loading { 
      text-align: center; 
      padding: 90px 0; 
      color: #6b7280; 
      font-size: 1.25rem; 
    }
    
    .empty-state { 
      text-align: center; 
      padding: 90px 0; 
      color: #6b7280; 
    }
    
    .empty-state p { 
      font-size: 1.25rem; 
      margin-bottom: 20px; 
    }
    
    .btn { 
      padding: 11px 22px; 
      border: none; 
      border-radius: 7px; 
      cursor: pointer; 
      font-size: 1.05rem; 
      font-weight: 500; 
      transition: all 0.2s ease;
    }
    
    .btn-primary { 
      background: #2563eb; 
      color: white; 
    }
    
    .btn-primary:hover {
      background: #1d4ed8;
      transform: translateY(-1px);
    }
    
    /* 垂直卡片布局 */
    .data-grid-vertical {
      display: flex;
      flex-direction: column;
      gap: 22px;
    }
    
    /* 放大卡片设计 */
    .data-card {
      width: 100%;
      min-height: 210px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 28px;
      background: white;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    
    .data-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 35px -6px rgba(0, 0, 0, 0.1);
      border-color: #d1d5db;
    }
    
    .data-id {
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 16px;
      padding-bottom: 14px;
      border-bottom: 2px solid #f3f4f6;
      font-size: 1.25rem;
    }
    
    .data-content {
      color: #374151;
      line-height: 1.65;
      white-space: pre-line;
      margin-bottom: 18px;
      font-size: 1.05rem;
    }
    
    .data-meta {
      font-size: 0.9rem;
      color: #6b7280;
      text-align: right;
      font-weight: 500;
    }
    
    /* 动画效果 */
    @keyframes highlightPulse {
      0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.6); }
      70% { box-shadow: 0 0 0 10px rgba(37, 99, 235, 0); }
      100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
    }
    
    @keyframes cardEntrance {
      0% { 
        opacity: 0;
        transform: translateY(20px);
      }
      100% { 
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .card-entering {
      animation: cardEntrance 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
    }
  </style>
</head>
<body>
  <div class="main-container">
    <!-- 左侧导航栏 - 变窄 -->
    <div class="sidebar">
      <div class="sidebar-header">
        <h2>导航</h2>
      </div>
      <div id="navigation" class="navigation-list"></div>
    </div>
    
    <!-- 右上角搜索框 -->
    <div class="search-container">
      <input type="text" id="navSearch" placeholder="   🔍︎" class="search-input">
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
    });

    // 核心：读取所有KV数据
    async function loadAllKVData() {
      const alertEl = document.getElementById('alert');
      const loadingEl = document.getElementById('loading');
      const emptyEl = document.getElementById('empty');
      const dataGridEl = document.getElementById('dataGrid');

      try {
        const response = await fetch('/api/notes');
        // 已将此文件归档到 `archive/cloudflare/blog-main.js`
        // 原始内容已移动，保留此文件作为占位与提示。

        export default {};
        // 添加高亮动画
        element.style.animation = 'highlightPulse 1.8s ease';
      }
    }

    // 卡片入场动画
    function animateCardEntrance() {
      const cards = document.querySelectorAll('.data-card');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
          card.style.transition = 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)';
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
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