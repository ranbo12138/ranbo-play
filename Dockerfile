# 多阶段构建 Dockerfile - 用于部署 ranbo-play React/Vite SPA 应用
# Stage 1: 构建阶段 - 使用 Node.js 构建前端应用
FROM node:20-alpine AS builder

# 构建参数 - 用于元数据标签
ARG VERSION=1.0.0
ARG BUILD_TIMESTAMP

# 设置工作目录
WORKDIR /app

# 确保 node_modules/.bin 在 PATH 中
ENV PATH=/app/node_modules/.bin:$PATH

# 复制 package.json 和 package-lock.json 文件
# 利用 Docker 层缓存，只有当依赖变化时才重新安装
COPY mvu-generator/package*.json ./

# 安装项目依赖并清理缓存以减小镜像大小
RUN npm ci && npm cache clean --force

# 复制源代码到容器中
COPY mvu-generator/ ./

# 构建生产版本 - 生成 dist 目录
RUN npm run build

# Stage 2: 运行阶段 - 使用 Nginx 提供静态文件服务
FROM nginx:alpine AS runtime

# 构建参数 - 用于元数据标签
ARG VERSION=1.0.0
ARG BUILD_TIMESTAMP

# 移除 Nginx 默认配置文件
RUN rm /etc/nginx/conf.d/default.conf

# 复制自定义 Nginx 配置文件
# 配置文件路径: /etc/nginx/conf.d/nginx.conf
COPY nginx.conf /etc/nginx/conf.d/

# 从构建阶段复制构建产物到 Nginx 静态文件目录
# 关键路径映射: /app/dist -> /usr/share/nginx/html
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建 Nginx 临时目录并设置正确的权限
# 确保nginx用户有权限写入缓存和日志目录
RUN mkdir -p /var/cache/nginx/client_temp \
    /var/cache/nginx/proxy_temp \
    /var/cache/nginx/fastcgi_temp \
    /var/cache/nginx/uwsgi_temp \
    /var/cache/nginx/scgi_temp && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 以 root 用户运行容器（Nginx 会自动降权）
# 这是必需的，因为 Nginx 需要管理 PID 文件和绑定特权端口（80）

# 添加容器元数据标签
LABEL org.opencontainers.title="ranbo-play" \
      org.opencontainers.description="MVU 状态栏生成器 - React/Vite SPA 应用" \
      org.opencontainers.version=${VERSION} \
      org.opencontainers.created=${BUILD_TIMESTAMP} \
      org.opencontainers.source="https://github.com/your-org/ranbo-play"

# 暴露 80 端口
EXPOSE 80

# 启动 Nginx 服务器
# -g "daemon off;" 确保 Nginx 在前台运行，容器不会退出
CMD ["nginx", "-g", "daemon off;"]