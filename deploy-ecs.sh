#!/bin/bash
# ====================================================================
# 水产养殖平台 - ECS 一键部署脚本
# 目标: Alibaba Cloud Linux 3 (RHEL 8+ 内核)
# 执行方式: 阿里云控制台 → 远程连接 (VNC) → 粘贴执行
# ====================================================================

set -e

echo "========================================="
echo "  水产养殖平台 - ECS 部署开始"
echo "========================================="

# ---------- 0. 基础更新 ----------
echo "[0/8] 更新系统..."
dnf update -y

# ---------- 1. 安装 Node.js 20 ----------
echo "[1/8] 安装 Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
node -v && npm -v

# ---------- 2. 安装 Nginx ----------
echo "[2/8] 安装 Nginx..."
dnf install -y nginx
systemctl enable nginx
systemctl start nginx

# ---------- 3. 安装 PostgreSQL 16 ----------
echo "[3/8] 安装 PostgreSQL 16..."
dnf install -y postgresql16-server postgresql16-contrib

# 初始化数据库
/usr/pgsql-16/bin/postgresql-16-setup initdb

# 适配 2G 内存机器 - 修改 postgresql.conf
PGCONF=/var/lib/pgsql/16/data/postgresql.conf
cat >> $PGCONF << 'PGCONF_EOF'

# --- 低内存机器调优 (2GB RAM) ---
shared_buffers = 128MB
effective_cache_size = 512MB
work_mem = 2MB
maintenance_work_mem = 64MB
max_connections = 50
PGCONF_EOF

# 允许密码登录 (本地)
PG_HBA=/var/lib/pgsql/16/data/pg_hba.conf
sed -i 's/^host.*all.*all.*ident/host    all             all             127.0.0.1\/32            scram-sha-256/' $PG_HBA
sed -i 's/^local.*all.*all.*peer/local   all             all                                     trust/' $PG_HBA

systemctl enable postgresql-16
systemctl start postgresql-16

# ---------- 4. 创建数据库和用户 ----------
echo "[4/8] 创建数据库..."
su - postgres -c "psql -c \"CREATE DATABASE aquaculture OWNER dbuser;\"" 2>/dev/null || true
su - postgres -c "psql -c \"CREATE USER dbuser WITH PASSWORD 'Chen1230';\"" 2>/dev/null || true
su - postgres -c "psql -c \"GRANT ALL PRIVILEGES ON DATABASE aquaculture TO dbuser;\""
su - postgres -c "psql -d aquaculture -c \"GRANT ALL ON SCHEMA public TO dbuser;\""

# ---------- 5. 安装 PM2 ----------
echo "[5/8] 安装 PM2..."
npm install -g pm2

# ---------- 6. 开放防火墙端口 ----------
echo "[6/8] 开放防火墙端口..."
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload || true  # firewall 没开也没关系

echo "========================================="
echo "  基础环境安装完成!"
echo "========================================="
echo ""
echo "已安装:"
echo "  - Node.js: $(node -v)"
echo "  - Nginx:   $(nginx -v 2>&1)"
echo "  - PostgreSQL: $(su - postgres -c 'psql --version')"
echo "  - PM2:     $(pm2 -v)"
echo ""
echo "数据库信息:"
echo "  数据库名: aquaculture"
echo "  用户名:   dbuser"
echo "  密码:     Chen1230"
echo ""
echo "下一步: 上传项目代码并构建"
echo "========================================="
