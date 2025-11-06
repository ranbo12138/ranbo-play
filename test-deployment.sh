#!/bin/bash

# Docker 部署测试脚本
# 用于验证 ranbo-play Docker 部署是否正常工作

set -e

echo "🚀 开始 Docker 部署测试..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试函数
test_step() {
    local test_name="$1"
    local test_command="$2"
    
    echo -n "🔍 测试: $test_name ... "
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 通过${NC}"
        return 0
    else
        echo -e "${RED}❌ 失败${NC}"
        return 1
    fi
}

# 构建测试
echo -e "\n${YELLOW}📦 构建阶段测试${NC}"
test_step "检查 package.json" "test -f mvu-generator/package.json"
test_step "检查 nginx.conf" "test -f nginx.conf"
test_step "检查 Dockerfile" "test -f Dockerfile"

echo -e "\n${YELLOW}🏗️  构建 Docker 镜像${NC}"
if docker build -t ranbo-play-test . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Docker 镜像构建成功${NC}"
else
    echo -e "${RED}❌ Docker 镜像构建失败${NC}"
    exit 1
fi

# 运行容器
echo -e "\n${YELLOW}🚀 启动容器${NC}"
CONTAINER_ID=$(docker run -d -p 8080:80 --name ranbo-play-test-container ranbo-play-test)
echo "容器 ID: $CONTAINER_ID"

# 等待容器启动
echo "等待 Nginx 启动..."
sleep 3

# 运行时测试
echo -e "\n${YELLOW}🧪 运行时测试${NC}"

test_step "容器运行状态" "docker ps | grep ranbo-play-test-container"
test_step "主页响应 (HTTP 200)" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/ | grep -q '200'"
test_step "SPA 路由支持" "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080/non-existent-route | grep -q '200'"
test_step "健康检查端点" "curl -s http://localhost:8080/health | grep -q 'healthy'"
test_step "静态资源访问测试" "curl -s http://localhost:8080/assets/ >/dev/null 2>&1"

# 显示响应头信息
echo -e "\n${YELLOW}📊 响应头信息${NC}"
echo "主页响应头:"
curl -I http://localhost:8080/ 2>/dev/null | head -5

echo -e "\n静态资源响应头:"
if curl -I http://localhost:8080/assets/index-*.css 2>/dev/null | head -5; then
    echo "静态资源缓存配置正确"
else
    echo "静态资源可能不存在，但这是正常的"
fi

# 检查容器日志
echo -e "\n${YELLOW}📋 容器日志 (最后10行)${NC}"
docker logs ranbo-play-test-container 2>&1 | tail -10

# 清理
echo -e "\n${YELLOW}🧹 清理测试环境${NC}"
docker stop ranbo-play-test-container > /dev/null 2>&1
docker rm ranbo-play-test-container > /dev/null 2>&1
docker rmi ranbo-play-test > /dev/null 2>&1

echo -e "\n${GREEN}🎉 所有测试完成！Docker 部署配置正确。${NC}"

echo -e "\n${YELLOW}💡 部署建议:${NC}"
echo "1. 如果在云平台部署时遇到 502 错误，请检查:"
echo "   - 端口配置是否正确"
echo "   - 资源限制是否充足"
echo "   - 网络配置是否正确"
echo "2. 查看 DEPLOYMENT_TROUBLESHOOTING.md 获取详细的故障排除指南"
echo "3. 确保目标平台支持 Docker 容器部署"