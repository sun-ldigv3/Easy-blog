export default {
    async fetch(request, env, ctx) {
      const html = `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Easy-blog - 追求极简的博客</title>
      <style>
          * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              font-family: 'Segoe UI', 'Microsoft YaHei', sans-serif;
          }
          
          html, body {
              height: 100%;
              overflow-x: hidden;
              scroll-behavior: smooth;
          }
          
          body {
              background-color: #ffffff;
              color: #000000;
              line-height: 1.6;
              opacity: 0; /* 初始隐藏，用于页面加载渐显 */
              animation: pageFadeIn 1.2s ease forwards 0.3s;
          }
          
          @keyframes pageFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          
          .container {
              height: 100vh;
              overflow-y: auto;
              scroll-snap-type: y mandatory;
          }
          
          section {
              height: 100vh;
              scroll-snap-align: start;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
              position: relative;
          }
          
          .section-content {
              max-width: 800px;
              width: 100%;
              opacity: 0;
              transform: translateX(-50px) scale(0.95);
              transition: 
                  opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), 
                  transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
              transition-delay: 0.2s;
          }
          
          section.active .section-content {
              opacity: 1;
              transform: translateX(0) scale(1);
          }
          
          h1 {
              font-size: 3.5rem;
              font-weight: 900;
              margin-bottom: 20px;
              line-height: 1.2;
              letter-spacing: -0.5px;
          }
          
          h2 {
              font-size: 1.8rem;
              font-weight: 700;
              margin-bottom: 15px;
              position: relative;
              display: inline-block;
          }
          
          h2::after {
              content: '';
              position: absolute;
              bottom: -5px;
              left: 0;
              width: 0;
              height: 3px;
              background-color: #000;
              transition: width 0.8s ease;
              transition-delay: 0.5s;
          }
          
          section.active h2::after {
              width: 60px;
          }
          
          p {
              font-size: 1.2rem;
              margin-bottom: 15px;
              font-weight: 500;
              transform: translateY(20px);
              opacity: 0;
              transition: 
                  opacity 0.6s ease, 
                  transform 0.6s ease;
          }
          
          section.active p {
              transform: translateY(0);
              opacity: 1;
          }
          
          /* 为段落添加顺序延迟动画 */
          section.active p:nth-child(2) { transition-delay: 0.4s; }
          section.active p:nth-child(3) { transition-delay: 0.6s; }
          section.active p:nth-child(4) { transition-delay: 0.8s; }
          
          .btn {
              display: inline-block;
              padding: 12px 25px;
              background-color: #000000;
              color: #ffffff;
              text-decoration: none;
              font-weight: 700;
              border-radius: 4px;
              transition: all 0.3s ease;
              border: none;
              cursor: pointer;
              font-size: 1rem;
              transform: translateY(20px);
              opacity: 0;
              transition: 
                  opacity 0.6s ease, 
                  transform 0.6s ease,
                  background-color 0.3s ease;
          }
          
          section.active .btn {
              transform: translateY(0);
              opacity: 1;
          }
          
          /* 按钮顺序延迟 */
          .btn:nth-child(1) { transition-delay: 0.7s; }
          .btn:nth-child(2) { transition-delay: 0.9s; }
          
          .btn:hover {
              background-color: #333333;
              transform: translateY(-3px) scale(1.02);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          }
          
          .btn-secondary {
              background-color: #f5f5f5;
              color: #333;
              border: 1px solid #ddd;
          }
          
          .btn-secondary:hover {
              background-color: #e9e9e9;
          }
          
          .contact {
              border-top: 1px solid #eee;
              padding-top: 30px;
          }
          
          .gray-link {
              color: #888;
              font-size: 0.9rem;
              text-decoration: none;
              margin-top: 10px;
              display: inline-block;
              transition: color 0.3s ease, transform 0.3s ease;
              transform: translateY(20px);
              opacity: 0;
              transition: 
                  opacity 0.6s ease, 
                  transform 0.6s ease,
                  color 0.3s ease;
              transition-delay: 1.1s;
          }
          
          section.active .gray-link {
              transform: translateY(0);
              opacity: 1;
          }
          
          .gray-link:hover {
              color: #555;
              text-decoration: underline;
              transform: translateY(-2px);
          }
          
          .button-group {
              display: flex;
              flex-direction: column;
              gap: 10px;
              margin-top: 20px;
          }
          
          .scroll-indicator {
              position: fixed;
              bottom: 30px;
              left: 50%;
              transform: translateX(-50%);
              text-align: center;
              color: #888;
              font-size: 0.9rem;
              z-index: 10;
              opacity: 1;
              transition: opacity 0.5s ease, transform 0.5s ease;
          }
          
          .scroll-indicator.hidden {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
              pointer-events: none;
          }
          
          .scroll-indicator span {
              display: block;
              margin-top: 8px;
              animation: bounce 2s infinite;
          }
          
          @keyframes bounce {
              0%, 20%, 50%, 80%, 100% {transform: translateY(0);}
              40% {transform: translateY(-10px);}
              60% {transform: translateY(-5px);}
          }
          
          /* 页面计数指示器 */
          .page-indicator {
              position: fixed;
              right: 30px;
              top: 50%;
              transform: translateY(-50%);
              display: flex;
              flex-direction: column;
              gap: 10px;
              z-index: 10;
          }
          
          .page-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background-color: #ddd;
              transition: all 0.3s ease;
              cursor: pointer;
          }
          
          .page-dot.active {
              background-color: #000;
              transform: scale(1.3);
          }
          
          @media (max-width: 768px) {
              h1 {
                  font-size: 2.5rem;
              }
              
              h2 {
                  font-size: 1.5rem;
              }
              
              p {
                  font-size: 1.1rem;
              }
              
              .links {
                  flex-direction: column;
              }
              
              .page-indicator {
                  right: 15px;
              }
          }
      </style>
  </head>
  <body>
      <div class="container">
          <section id="title-section">
              <div class="section-content">
                  <h1>Easy-blog,追求极简的博客。</h1>
                  <p>纯粹的博客，边缘函数计算。</p>
                  
                  <div class="button-group">
                      <a href="https://github.com/sun-ldigv3/Easy-blog" class="btn" target="_blank">GitHub 地址</a>
                      <a href="https://sun2009.dpdns.org" class="gray-link" target="_blank">sunldigv3-blog</a>
                  </div>
              </div>
          </section>
          
          <section id="description-section">
              <div class="section-content">
                  <h2>无需服务器，由边缘函数驱动。</h2>
                  <p>Cloudflare work计算</p>
                  <p>Kv命名空间存储</p>
              </div>
          </section>
          
          <section id="action-section">
              <div class="section-content">
                  <h2>即刻部署，现在就开始。</h2>
                  <div class="button-group">
                      <a href="https://cloudflare.com/login" class="btn" target="_blank">登录 Cloudflare</a>
                      <a href="https://github.com/sun-ldigv3/Easy-blog" class="btn btn-secondary" target="_blank">GitHub 项目地址</a>
                  </div>
              </div>
          </section>
          
          <section id="contact-section">
              <div class="section-content contact">
                  <h2>联系我：sun-ldigv3@outlook.com</h2>
                  <p>作者还在上学，回复不及时请见谅。</p>
              </div>
          </section>
      </div>
  
      <div class="scroll-indicator">
          向下滑动
          <span>↓</span>
      </div>
      
      <div class="page-indicator">
          <div class="page-dot active" data-index="0"></div>
          <div class="page-dot" data-index="1"></div>
          <div class="page-dot" data-index="2"></div>
          <div class="page-dot" data-index="3"></div>
      </div>
  
      <script>
          document.addEventListener('DOMContentLoaded', function() {
              const sections = document.querySelectorAll('section');
              const container = document.querySelector('.container');
              const scrollIndicator = document.querySelector('.scroll-indicator');
              const pageDots = document.querySelectorAll('.page-dot');
              const totalSections = sections.length;
              
              // 设置当前激活的区块
              function setActiveSection() {
                  const scrollPosition = container.scrollTop;
                  let currentIndex = 0;
                  
                  sections.forEach((section, index) => {
                      const sectionTop = section.offsetTop;
                      const sectionHeight = section.offsetHeight;
                      
                      if (scrollPosition >= sectionTop - sectionHeight * 0.2 && 
                          scrollPosition < sectionTop + sectionHeight * 0.8) {
                          section.classList.add('active');
                          currentIndex = index;
                      } else {
                          section.classList.remove('active');
                      }
                  });
                  
                  // 更新页面指示器
                  updatePageIndicator(currentIndex);
                  
                  // 最后一页隐藏滚动提示
                  if (currentIndex === totalSections - 1) {
                      scrollIndicator.classList.add('hidden');
                  } else {
                      scrollIndicator.classList.remove('hidden');
                  }
              }
              
              // 更新页面指示器
              function updatePageIndicator(activeIndex) {
                  pageDots.forEach((dot, index) => {
                      if (index === activeIndex) {
                          dot.classList.add('active');
                      } else {
                          dot.classList.remove('active');
                      }
                  });
              }
              
              // 初始激活第一个区块
              sections[0].classList.add('active');
              
              // 监听滚动事件
              container.addEventListener('scroll', setActiveSection);
              
              // 鼠标滚轮控制
              container.addEventListener('wheel', function(e) {
                  e.preventDefault();
                  
                  const currentIndex = Array.from(sections).findIndex(section => 
                      section.classList.contains('active')
                  );
                  
                  // 向下滚动
                  if (e.deltaY > 0 && currentIndex < sections.length - 1) {
                      sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
                  }
                  // 向上滚动
                  else if (e.deltaY < 0 && currentIndex > 0) {
                      sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
                  }
              }, { passive: false });
              
              // 页面指示器点击事件
              pageDots.forEach(dot => {
                  dot.addEventListener('click', () => {
                      const index = parseInt(dot.dataset.index);
                      sections[index].scrollIntoView({ behavior: 'smooth' });
                  });
              });
              
              // 键盘箭头控制
              document.addEventListener('keydown', (e) => {
                  const currentIndex = Array.from(sections).findIndex(section => 
                      section.classList.contains('active')
                  );
                  
                  if (e.key === 'ArrowDown' && currentIndex < sections.length - 1) {
                      e.preventDefault();
                      sections[currentIndex + 1].scrollIntoView({ behavior: 'smooth' });
                  } else if (e.key === 'ArrowUp' && currentIndex > 0) {
                      e.preventDefault();
                      sections[currentIndex - 1].scrollIntoView({ behavior: 'smooth' });
                  }
              });
          });
      </script>
  </body>
  </html>
      `;
  
      return new Response(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      });
    },
  };