export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/note") {
      // 记事本API
      if (request.method === "GET") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("Missing id", { status: 400 });
        const note = await env.NOTES.get(id);
        return new Response(note || "", { status: 200 });
      }
      if (request.method === "POST") {
        const { id, content } = await request.json();
        if (!id || !content) return new Response("Missing id or content", { status: 400 });
        await env.NOTES.put(id, content);
        return new Response("Saved", { status: 200 });
      }
      if (request.method === "DELETE") {
        const id = url.searchParams.get("id");
        if (!id) return new Response("Missing id", { status: 400 });
        await env.NOTES.delete(id);
        return new Response("Deleted", { status: 200 });
      }
      return new Response("Method Not Allowed", { status: 405 });
    }

    // 前端页面
    return new Response(`
      <!DOCTYPE html>
      <html lang="zh">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Easy-blog 上传</title>
        <meta name="robots" content="index,follow">
        <style>
          body {
            margin: 0;
            padding: 40px 0;
            font-family: Arial, sans-serif;
            background: #f7f8fa;
            opacity: 0;
            animation: fadeIn 0.7s ease-out forwards;
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 48px 48px 36px 48px;
            background: #fff;
            border-radius: 22px;
            box-shadow: 0 4px 24px rgba(100,100,100,0.07);
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          h1 {
            font-size: 2.2rem;
            color: #333;
            margin-bottom: 2.2rem;
            font-weight: bold;
          }
          .form-row {
            width: 100%;
            display: flex;
            gap: 24px;
            margin-bottom: 24px;
          }
          input {
            flex: 1;
            padding: 12px 18px;
            border-radius: 14px;
            border: 1px solid #d1d5db;
            font-size: 1.08rem;
            background: #f8fafc;
            box-sizing: border-box;
          }
          .btn-group {
            display: flex;
            gap: 16px;
            margin-bottom: 24px;
          }
          .btn {
            padding: 12px 32px;
            border-radius: 16px;
            border: none;
            background: #e5e7eb;
            color: #333;
            font-size: 1rem;
            cursor: pointer;
            transition: background 0.3s, transform 0.3s;
          }
          .btn:hover {
            background: #c3cfe2;
            color: #222;
            transform: translateY(-2px);
          }
          textarea {
            width: 100%;
            height: 320px;
            border: 1px solid #ddd;
            padding: 18px;
            box-sizing: border-box;
            font-size: 18px;
            border-radius: 14px;
            background: #f8fafc;
            resize: vertical;
            margin-bottom: 24px;
          }
          #msg {
            color: #2563eb;
            margin-top: 10px;
            min-height: 24px;
            font-size: 1rem;
          }
          @media (max-width: 700px) {
            .container {
              padding: 24px 8px;
            }
            .form-row {
              flex-direction: column;
              gap: 12px;
            }
            textarea {
              height: 180px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="form-row">
            <input id="noteId" placeholder="记事本ID" />
            <div class="btn-group">
              <button class="btn" onclick="loadNote()">加载</button>
              <button class="btn" onclick="deleteNote()">删除</button>
            </div>
          </div>
          <textarea id="noteContent" placeholder="输入内容... "></textarea>
          <div class="btn-group">
            <button class="btn" onclick="saveNote()">保存</button>
          </div>
          <p id="msg"></p>
        </div>
        <script>
          // Cookie操作函数
          function setCookie(name, value, days = 365) {
            const d = new Date();
            d.setTime(d.getTime() + (days*24*60*60*1000));
            document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + d.toUTCString() + ';path=/';
          }
          function getCookie(name) {
            const arr = document.cookie.split(';');
            for (let i = 0; i < arr.length; i++) {
              const kv = arr[i].trim().split('=');
              if (kv[0] === name) return decodeURIComponent(kv[1] || '');
            }
            return '';
          }
          function delCookie(name) {
            document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
          }

          // 页面加载时自动填充内容
          window.addEventListener('DOMContentLoaded', () => {
            const id = document.getElementById('noteId').value;
            if (!id) {
              const saved = getCookie('saved_text');
              if (saved) {
                document.getElementById('noteContent').value = saved;
                document.getElementById('msg').textContent = '已从本地加载';
              }
            }
          });
          async function loadNote() {
            const id = document.getElementById('noteId').value;
            if (!id) {
              const saved = getCookie('saved_text');
              document.getElementById('noteContent').value = saved;
              document.getElementById('msg').textContent = saved ? '已从本地加载' : '本地无内容';
              return;
            }
            const res = await fetch('/api/note?id=' + encodeURIComponent(id));
            document.getElementById('noteContent').value = await res.text();
            document.getElementById('msg').textContent = '已加载';
          }
          async function saveNote() {
            const id = document.getElementById('noteId').value;
            const content = document.getElementById('noteContent').value;
            if (!id) {
              setCookie('saved_text', content);
              document.getElementById('msg').textContent = '内容已本地保存';
              return;
            }
            const res = await fetch('/api/note', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, content })
            });
            document.getElementById('msg').textContent = '已保存';
          }
          async function deleteNote() {
            const id = document.getElementById('noteId').value;
            if (!id) {
              delCookie('saved_text');
              document.getElementById('noteContent').value = '';
              document.getElementById('msg').textContent = '本地内容已清空';
              return;
            }
            const res = await fetch('/api/note?id=' + encodeURIComponent(id), { method: 'DELETE' });
            document.getElementById('noteContent').value = '';
            document.getElementById('msg').textContent = await res.text();
          }
        </script>
      </body>
      </html>
    `, { headers: { "content-type": "text/html" } });
  }
}