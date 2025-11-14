# Easy-blog

基于Cloudflare Work的极简博客，随时随地上传，边缘函数计算，无需服务器，即刻部署。

## 概述
其中 Easy-blog 文件夹为主要文件
- blog-main.js 功能说明：该文件实现博客主页功能
- blog-updata.js 功能说明：该文件实现笔记上传和管理功能

## 使用方法
- 在**Cloudflare**中创建两个**work**,上传项目代码
- 创建**kv存储空间**并命名为**NOTES**，绑定到两个**work**上
- 访问上传**blog-updata.js**的work,输入记事本ID与内容并点击保存
- 访问上传**blog-main.js**的work,查看上传的笔记

## 示例
部署示例：https://blog.sun2009.dpdns.org


### 技术栈
- Cloudflare Workers：无服务器边缘计算平台
- Cloudflare KV：分布式键值存储服务
- 原生HTML/CSS/JavaScript：前端界面实现
