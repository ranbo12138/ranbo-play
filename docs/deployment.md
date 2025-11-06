# 部署指南

本文档介绍 ranbo-play MVU 状态栏生成器在生产环境中的部署方案与注意事项，涵盖 Nginx 配置、环境变量策略及安全优化建议。

---

## Nginx 配置说明

ranbo-play 以 Vite 构建的单页应用（SPA）形式发布，推荐在生产环境使用 Nginx 作为静态资源服务器与反向代理层。以下示例展示典型配置：

```nginx
server {
    listen 80;
    server_name example.com;

    root /usr/share/nginx/html;
    index index.html;

    # SPA 路由转发：所有未命中的路径回退到 index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存策略
    location ~* \.(?:js|css|png|jpg|jpeg|gif|svg|webp|woff2?)$ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # HTML 禁止长缓存，确保及时更新
    location ~* \.(?:html)$ {
        add_header Cache-Control "no-cache";
    }

    # 启用 Gzip 压缩
    gzip on;
    gzip_comp_level 6;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json application/xml;
    gzip_proxied any;
}
```

> 若应用部署在子路径（如 `/app`），需要同步调整 `location` 与构建时的 `base` 配置。

---

## 环境变量

- 当前版本为纯前端静态应用，不依赖运行时环境变量。
- 如需扩展后端 API 地址或注入构建时配置，可：
  1. 使用 Vite 的 `import.meta.env` 机制，在构建阶段通过 `.env.production` 注入；
  2. 在运行时通过 Nginx 下发 `window.__APP_CONFIG__`，配合应用启动脚本读取。

---

## 生产部署建议

1. **CDN 加速**
   - 将 `dist` 目录上传至 CDN（如 Cloudflare、阿里云 CDN），并设置回源到 Nginx，降低静态资源延迟。

2. **启用 HTTPS**
   - 使用 Let’s Encrypt 或商业证书，确保站点默认通过 HTTPS 服务，防止 API Key 等敏感信息在传输过程中泄露。

3. **安全响应头**
   - Content-Security-Policy（CSP）：限制 iframe 与外链脚本的来源，例如：
     ```nginx
     add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.openai.com";
     ```
   - X-Frame-Options：防止点击劫持，可设置为 `SAMEORIGIN`。
   - X-Content-Type-Options：设置为 `nosniff`，避免 MIME 类型混淆。

4. **健康检测与日志**
   - 结合容器编排平台（Docker Compose、Kubernetes）配置健康检查，确保 Nginx 进程运行正常。
   - 监控访问日志与错误日志，及时发现 CORS 或静态资源 404 问题。

5. **定期更新**
   - 关注 GitHub Actions 生成的镜像标签，使用 `latest` 或指定版本（例如 `v1.0.0`）进行滚动升级。

通过上述配置，可在保证性能、安全与可维护性的前提下稳定部署 ranbo-play。
