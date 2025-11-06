# Docker 部署故障排除指南

## 502 错误诊断和解决方案

### 概述
本文档提供了 ranbo-play 应用在 Docker 环境中部署时遇到 502 SERVICE_UNAVAILABLE 错误的完整诊断和解决方案。

### 已验证的配置状态
✅ **Dockerfile**: 多阶段构建配置正确，构建成功  
✅ **nginx.conf**: Nginx 配置语法正确，包含完整的 SPA 路由支持  
✅ **容器启动**: 容器可以正常启动，Nginx 无错误日志  
✅ **HTTP 响应**: 本地测试返回 200 OK，SPA 路由工作正常  
✅ **静态资源**: 缓存配置正确，Gzip 压缩启用  
✅ **健康检查**: `/health` 端点正常响应  

### 可能的 502 错误原因及解决方案

#### 1. 部署平台特定问题 (Zeabur/其他云平台)

**症状**: 在本地工作正常，但在云平台出现 502 错误

**解决方案**:
```bash
# 检查平台特定的配置要求
# 1. 确认端口配置是否正确 (通常为 80 或自定义端口)
# 2. 检查平台是否有特殊的健康检查要求
# 3. 验证平台是否需要特定的环境变量
```

#### 2. 资源限制问题

**症状**: 容器启动后立即出现 502 错误

**诊断**:
```bash
# 检查容器资源使用情况
docker stats <container_id>

# 查看容器日志
docker logs <container_id>

# 检查内存限制
docker inspect <container_id> | grep Memory
```

**解决方案**:
- 增加 CPU 和内存限制
- 优化构建过程以减少镜像大小
- 使用更轻量的基础镜像

#### 3. 网络配置问题

**症状**: 容器运行但无法访问

**诊断**:
```bash
# 检查端口映射
docker port <container_id>

# 检查网络连接
docker network ls
docker network inspect <network_name>
```

**解决方案**:
- 确认端口映射正确: `docker run -p 80:80 ...`
- 检查防火墙设置
- 验证负载均衡器配置

#### 4. Nginx 配置问题

**症状**: Nginx 启动失败或配置错误

**诊断**:
```bash
# 测试 Nginx 配置语法
docker exec <container_id> nginx -t

# 查看 Nginx 错误日志
docker exec <container_id> cat /var/log/nginx/error.log
```

**解决方案**:
- 验证 `nginx.conf` 语法正确性
- 确认文件路径配置正确
- 检查权限设置

### 验证清单

#### 构建阶段验证
- [ ] `npm run build` 在本地成功执行
- [ ] `dist` 目录包含 `index.html` 和 `assets` 目录
- [ ] Docker 镜像构建无错误: `docker build -t test .`

#### 运行时验证
- [ ] 容器成功启动: `docker run -d -p 8080:80 test`
- [ ] 主页返回 200: `curl -I http://localhost:8080/`
- [ ] SPA 路由工作: `curl -I http://localhost:8080/non-existent`
- [ ] 健康检查正常: `curl http://localhost:8080/health`
- [ ] 静态资源缓存正确: `curl -I http://localhost:8080/assets/*.css`

#### 日志检查
- [ ] 容器启动日志无错误: `docker logs <container_id>`
- [ ] Nginx 工作进程正常启动
- [ ] 无权限相关错误

### 常见修复命令

#### 本地测试
```bash
# 构建镜像
docker build -t ranbo-play .

# 运行容器
docker run -d -p 8080:80 --name ranbo-test ranbo-play

# 测试响应
curl -I http://localhost:8080/
curl http://localhost:8080/health

# 查看日志
docker logs ranbo-test

# 清理
docker stop ranbo-test
docker rm ranbo-test
```

#### 生产部署
```bash
# 构建生产镜像
docker build -t ranbo-play:latest .

# 推送到仓库
docker tag ranbo-play:latest your-registry/ranbo-play:latest
docker push your-registry/ranbo-play:latest

# 运行生产容器
docker run -d \
  --name ranbo-play \
  -p 80:80 \
  --restart unless-stopped \
  your-registry/ranbo-play:latest
```

### 配置文件关键点

#### Dockerfile 关键配置
```dockerfile
# 关键路径映射
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx 配置文件位置
COPY nginx.conf /etc/nginx/conf.d/

# 权限设置
chown -R nginx:nginx /usr/share/nginx/html
```

#### nginx.conf 关键配置
```nginx
# SPA 路由支持 - 最关键的配置
location / {
    try_files $uri $uri/ /index.html;
}

# 静态资源缓存
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# 健康检查
location /health {
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### 联系支持
如果以上解决方案都无法解决 502 错误，请收集以下信息：

1. 完整的错误日志
2. 部署平台信息 (Zeabur, AWS, GCP 等)
3. 容器资源限制配置
4. 网络配置详情
5. `docker logs` 和 `docker inspect` 输出

### 版本信息
- Node.js: 20-alpine
- Nginx: alpine (最新稳定版)
- React: 19.1.1
- Vite: 7.1.7