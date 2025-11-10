# Easy-blog
基于Cloudflare Work的极简博客，随时随地上传，边缘函数计算，无需服务器，即刻部署。

## 概述
其中 Easy-blog 文件夹为主要文件，blog-main.js是博客主页，blog-updata.js是博客上传页。
## 使用方法
<li>在<b>Cloudflare</b>中创建两个<b>work</b>,上传项目代码</li>
<li>创建<b>kv存储空间</b>并命名为<b>NOTES</b>，绑定到两个<b>work</b>上
<li>访问上传<b>blog-updata.js</b>的work,输入记事本ID与内容并点击保存</li>
<li>访问上传<b>blog-main.js</b>的work,查看上传的笔记</li>

## 示例
部署示例：https://sun2009.dpdns.org
