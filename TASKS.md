// ====================================================================
// TASKS.md - 第一阶段开发任务清单
// ====================================================================
//
// 使用说明:
//   1. 本清单供 Codex 和 AI Agent 直接执行,每个 Task 粒度为"一个
//      页面/一个接口/一个独立功能单元"。
//   2. 每个 Task 明确了:文件路径、输入/输出、参考的 Prisma 表、
//      关联的设计稿位置。
//   3. Codex 可按 Task # 顺序逐个完成,不需要读取全局上下文。
//   4. 遇到复杂计算或跨模块逻辑,先查 src/server/permissions/ 和
//      src/server/calculations/ 里的已有函数,不要重复造轮子。
//   5. 写完代码后至少跑一遍 `npm run lint`,确保无报错。
//
// 技术栈锁定:
//   Next.js 16 App Router + TypeScript + Tailwind v4
//   Prisma 8 + Supabase PostgreSQL + RLS
//   Zod + react-hook-form + TanStack Query + Recharts
//
// 运行命令:
//   npm run dev           本地开发
//   npm run build         生产构建(构建前先 npx prisma generate)
//   npm run lint          代码检查
//   npx prisma generate   重新生成 Prisma Client
//   npx prisma migrate dev --name xxx  数据库迁移
//
// 目录约定:
//   src/app/(platform)/   超管 Web 后台
//   src/app/(enterprise)/ 企业内部 Web(老板+员工)
//   src/app/(mobile)/     移动端响应式页面
//   src/app/api/          Route Handlers 后端接口
//   src/server/           纯服务端逻辑(不在 components 里)
//   src/lib/              前后端共用工具
//   prisma/schema.prisma  数据库定义
//   supabase/rls.sql      RLS 策略(Supabase SQL Editor 执行)
//
// ====================================================================

// ====================================================================
// PHASE 1: 核心业务数字化 (MVP)
// ====================================================================

// --------------------------------------------------------------------
// Task #1 - 登录对接 Supabase Auth
// --------------------------------------------------------------------
// 目标: 替换 login/page.tsx 里的 mock 实现,接真 Supabase
// 文件: src/app/login/page.tsx, src/middleware.ts
// 参考: src/lib/auth/supabase.ts
// 验收: 邮箱+密码可登录,刷新后 session 不丢,未登录访问受保护路由跳 /login

// --------------------------------------------------------------------
// Task #2 - 平台概览 API 接口
// --------------------------------------------------------------------
// 目标: 把 platform/dashboard/page.tsx 里的硬编码统计改成真实查询
// 文件: src/app/api/platform/stats/route.ts, src/app/(platform)/dashboard/page.tsx
// 涉及表: enterprises, users, market_prices
// 验收: 超管登录后看到真实数据

// --------------------------------------------------------------------
// Task #3 - 企业管理 (超管)
// --------------------------------------------------------------------
// 目标: 企业 CRUD + 审核激活 + 订阅管理
// 文件:
//   src/app/(platform)/enterprises/page.tsx
//   src/app/(platform)/enterprises/new/page.tsx
//   src/app/(platform)/enterprises/[id]/page.tsx
//   src/app/api/enterprises/route.ts
//   src/app/api/enterprises/[id]/route.ts
// 涉及表: enterprises, users
// 验收: 超管可增删改查企业,可审核 pending → active

// --------------------------------------------------------------------
// Task #4 - 用户管理 (超管)
// --------------------------------------------------------------------
// 目标: 用户 CRUD + 角色分配 + 关联企业
// 文件:
//   src/app/(platform)/users/page.tsx
//   src/app/api/users/route.ts
// 涉及表: users, enterprises
// 验收: 超管可创建/编辑/禁用用户,分配四种角色

// --------------------------------------------------------------------
// Task #5 - 客户管理 (企业端)
// --------------------------------------------------------------------
// 目标: 客户 CRUD + 搜索 + 分页 + 客户详情页(含鱼塘列表、消费、欠款)
// 文件:
//   src/app/(enterprise)/customers/page.tsx
//   src/app/(enterprise)/customers/new/page.tsx
//   src/app/(enterprise)/customers/[id]/page.tsx
//   src/app/api/customers/route.ts
//   src/app/api/customers/[id]/route.ts
// 涉及表: customers, fish_ponds, debts
// 验收: 老板/员工可增删改查客户,企业间数据隔离,支持按名称/手机号搜索

// --------------------------------------------------------------------
// Task #6 - 鱼塘管理
// --------------------------------------------------------------------
// 目标: 鱼塘 CRUD + 关联客户 + 鱼塘详情页(投放/损耗/饲料/用药/出售/水质时间线)
// 文件:
//   src/app/(enterprise)/fish-ponds/page.tsx
//   src/app/(enterprise)/fish-ponds/new/page.tsx
//   src/app/(enterprise)/fish-ponds/[id]/page.tsx
//   src/app/api/fish-ponds/route.ts
// 涉及表: fish_ponds, fish_stockings, daily_deaths, feed_records, drug_records, sale_records, water_quality_records
// 验收: 完整鱼塘档案管理,支持时间线查看所有养殖活动

// --------------------------------------------------------------------
// Task #7 - 鱼类投放
// --------------------------------------------------------------------
// 目标: 在鱼塘详情中记录投放(鱼种、数量、重量、成本)
// 文件: src/app/(enterprise)/fish-ponds/[id]/stock/page.tsx, src/app/api/fish-ponds/[id]/stock/route.ts
// 涉及表: fish_stockings
// 验收: 可记录多次投放,自动计算投放总成本

// --------------------------------------------------------------------
// Task #8 - 每日损耗
// --------------------------------------------------------------------
// 目标: 每日死鱼数量录入 + 死亡原因 + 死亡率自动计算
// 文件: src/app/(enterprise)/fish-ponds/[id]/deaths/page.tsx, src/app/api/fish-ponds/[id]/deaths/route.ts
// 涉及表: daily_deaths
// 验收: 可按日期录入,鱼塘详情显示累计死亡 + 死亡率

// --------------------------------------------------------------------
// Task #9 - 饲料管理
// --------------------------------------------------------------------
// 目标: 饲料使用记录
// 文件: src/app/(enterprise)/fish-ponds/[id]/feed/page.tsx, src/app/api/fish-ponds/[id]/feed/route.ts
// 涉及表: feed_records
// 验收: 记录品牌/型号/包数/单价/总价/日期

// --------------------------------------------------------------------
// Task #10 - 用药管理
// --------------------------------------------------------------------
// 目标: 用药记录,支持按周期录入(一次记录多天用药)
// 文件: src/app/(enterprise)/fish-ponds/[id]/drugs/page.tsx, src/app/api/fish-ponds/[id]/drugs/route.ts
// 涉及表: drug_records
// 验收: 支持开始/结束日期或周期天数

// --------------------------------------------------------------------
// Task #11 - 分批出售 + 养殖周期结算
// --------------------------------------------------------------------
// 目标: 出售记录(可多次) + 周期自动结算(投入/产出/利润/死亡率)
// 文件:
//   src/app/(enterprise)/fish-ponds/[id]/sales/page.tsx
//   src/app/(enterprise)/fish-ponds/[id]/settlement/page.tsx
//   src/app/api/fish-ponds/[id]/sales/route.ts
// 涉及表: sale_records + src/server/calculations/index.ts#calculateCycleSummary
// 验收: 同一鱼塘可多次出售,周期结算页自动汇总

// --------------------------------------------------------------------
// Task #12 - 药品库存
// --------------------------------------------------------------------
// 目标: 药品基础资料 CRUD + 库存数量 + 安全库存预警
// 文件:
//   src/app/(enterprise)/drugs/page.tsx
//   src/app/(enterprise)/drugs/new/page.tsx
//   src/app/api/drugs/route.ts
// 涉及表: drug_inventories
// 验收: 库存低于 safetyStock 时仪表盘显示预警

// --------------------------------------------------------------------
// Task #13 - 药品采购
// --------------------------------------------------------------------
// 目标: 采购入库(自动增加库存)
// 文件: src/app/(enterprise)/drugs/purchase/page.tsx, src/app/api/drugs/purchase/route.ts
// 涉及表: drug_purchases, drug_inventories(联动)
// 验收: 采购保存后库存数量自动增加,采购价可更新药品成本价

// --------------------------------------------------------------------
// Task #14 - 药品销售
// --------------------------------------------------------------------
// 目标: 销售出库(自动扣库存) + 关联客户 + 支持欠款
// 文件:
//   src/app/(enterprise)/sales/page.tsx
//   src/app/(enterprise)/sales/new/page.tsx
//   src/app/api/drugs/sale/route.ts
// 涉及表: drug_sales, drug_inventories(联动库存), src/server/calculations/index.ts#applySale
// 验收: 销售时库存充足性校验,自动标记付款状态(unpaid/partial/paid)

// --------------------------------------------------------------------
// Task #15 - 欠款与回款
// --------------------------------------------------------------------
// 目标: 欠款单生成 + 电子签名 + 分批回款 + 自动更新剩余金额
// 文件:
//   src/app/(enterprise)/debts/page.tsx
//   src/app/(enterprise)/debts/[id]/page.tsx
//   src/app/api/debts/route.ts
//   src/app/api/debts/[id]/payments/route.ts
// 涉及表: debts, debt_payments, src/server/calculations/index.ts#initDebt/applyDebtPayment
// 验收: 销售未付清自动生成欠款,支持电子签名留档,回款后 remainingAmount 自动更新

// --------------------------------------------------------------------
// Task #16 - 水质检测
// --------------------------------------------------------------------
// 目标: 水质数据录入(手动) + 异常自动判断 + 历史趋势图
// 文件:
//   src/app/(enterprise)/fish-ponds/[id]/water-quality/page.tsx
//   src/app/(enterprise)/reports/water-quality/page.tsx
//   src/app/api/water-quality/route.ts
// 涉及表: water_quality_records, water_quality_thresholds
// 验收: 根据阈值自动标记正常/异常,Recharts 趋势图展示历史记录

// --------------------------------------------------------------------
// Task #17 - 考勤打卡
// --------------------------------------------------------------------
// 目标: 上班/下班打卡 + GPS 定位 + 打卡状态
// 文件: src/app/(enterprise)/attendance/page.tsx, src/app/api/attendance/route.ts
// 涉及表: attendances
// 验收: 员工打卡记录时间和地址,标记 normal/late/missing

// --------------------------------------------------------------------
// Task #18 - 外勤轨迹 + 客户拜访
// --------------------------------------------------------------------
// 目标: 外勤开始/结束 + GPS 轨迹点采集 + 客户拜访记录
// 文件:
//   src/app/(enterprise)/attendance/field-track/page.tsx
//   src/app/(enterprise)/attendance/visits/page.tsx
//   src/app/api/field-tracks/route.ts
//   src/app/api/visits/route.ts
// 涉及表: field_tracks, field_track_points, customer_visits
// 验收: 外勤状态管理,拜访记录关联客户

// --------------------------------------------------------------------
// Task #19 - 员工提成计算
// --------------------------------------------------------------------
// 目标: 月度提成自动计算(基于销售额和提成比例)
// 文件:
//   src/app/(enterprise)/employees/commission/page.tsx
//   src/app/api/commission/route.ts
// 涉及表: commission_records, commission_rules
// 公式: src/server/calculations/index.ts#calculateCommission
// 验收: 选择月份自动汇总员工销售额,按规则表计算提成

// --------------------------------------------------------------------
// Task #20 - 财务管理 + 利润报表
// --------------------------------------------------------------------
// 目标: 收入/支出录入 + 日/周/月/年维度利润链报表
// 文件:
//   src/app/(enterprise)/finance/page.tsx
//   src/app/(enterprise)/finance/new/page.tsx
//   src/app/(enterprise)/reports/profit/page.tsx
//   src/app/api/finance/route.ts
// 涉及表: finance_records
// 公式: src/server/calculations/index.ts#calculateProfitChain
// 验收: 自动形成 销售收入→商品成本→毛利润→提成/支出→净利润 链

// --------------------------------------------------------------------
// Task #21 - 老板经营驾驶舱 Web 版数据接入
// --------------------------------------------------------------------
// 目标: 把 enterprise/dashboard/page.tsx 里的 mock 数据换成真实查询
// 文件: src/app/api/(enterprise)/dashboard/stats/route.ts, src/app/(enterprise)/dashboard/page.tsx
// 涉及表: 跨表聚合(销售、欠款、库存、考勤……)
// 验收: 四个核心数据卡 + 经营提醒 + 员工概览全部显示实时数据

// --------------------------------------------------------------------
// Task #22 - 老板移动端驾驶舱
// --------------------------------------------------------------------
// 目标: 参考老板移动端驾驶舱.html 设计稿,实现移动端响应式页面
// 文件: src/app/(mobile)/owner/page.tsx
// 复用: enterprise/dashboard 的数据查询,但 UI 换成 375px 移动端版
// 验收: 手机访问 /mobile/owner 看到和 design HTML 一致的布局

// --------------------------------------------------------------------
// Task #23 - 员工移动端
// --------------------------------------------------------------------
// 目标: 员工专属移动端页面(客户拜访签到、销售录入、考勤)
// 文件: src/app/(mobile)/employee/page.tsx + 相关子页
// 验收: 员工角色登录后跳转到员工移动端

// --------------------------------------------------------------------
// Task #24 - 客户移动端
// --------------------------------------------------------------------
// 目标: 客户视角的鱼塘档案、检测、用药、出售
// 文件: src/app/(mobile)/client/page.tsx + 相关子页
// 验收: 客户角色登录后只能看自己名下的数据

// --------------------------------------------------------------------
// Task #25 - 水产品批发行情录入 (超管)
// --------------------------------------------------------------------
// 目标: 超管每日录入行情(品种、规格、价格范围、日期)
// 文件: src/app/(platform)/market-prices/page.tsx, src/app/api/market-prices/route.ts
// 涉及表: market_prices
// 验收: 行情列表支持按品种筛选,超管可增改

// --------------------------------------------------------------------
// Task #26 - 行情趋势图 + 订阅入口
// --------------------------------------------------------------------
// 目标: 行情历史趋势(7/30/90/180日)+ 订阅购买入口(后续接支付)
// 文件:
//   src/app/(platform)/market-prices/[species]/page.tsx
//   src/app/(enterprise)/market-prices/page.tsx
//   src/app/api/market-prices/history/route.ts
// 涉及表: market_prices, market_subscriptions
// 验收: Recharts 折线图展示多时间范围趋势

// --------------------------------------------------------------------
// Task #27 - Excel 数据导入
// --------------------------------------------------------------------
// 目标: 客户/药品/历史销售/欠款 的批量 Excel 导入
// 文件: src/app/(enterprise)/import/page.tsx, src/app/api/import/route.ts
// 验收: 上传 xlsx → 后端解析 → 预览确认 → 批量入库

// --------------------------------------------------------------------
// Task #28 - 操作日志查询
// --------------------------------------------------------------------
// 目标: 超管/老板可查询操作日志(操作人、时间、动作、模块)
// 文件: src/app/(platform)/audit-logs/page.tsx, src/app/api/audit-logs/route.ts
// 涉及表: audit_logs
// 验收: 支持按时间范围、操作人、模块筛选

// --------------------------------------------------------------------
// Task #29 - shadcn/ui 完整组件库初始化
// --------------------------------------------------------------------
// 目标: 跑 npx shadcn@latest init + 添加 Button/Input/Card/Table/Dialog/Toast 等
// 文件: 组件写入 src/components/ui/
// 验收: 至少包含 Button, Input, Card, Table, Badge, Dialog, Toast, Form
// 备注: 这是 Codex 可以快速搞定的批量任务,建议最先做

// --------------------------------------------------------------------
// Task #30 - 全局错误处理 + Toast 通知
// --------------------------------------------------------------------
// 目标: API 错误统一返回 { success: false, error: 'xxx' },前端全局 Toast
// 文件: src/lib/utils/api.ts, src/components/ui/toast-provider.tsx, src/hooks/use-toast.ts
// 验收: 任何页面/API 错误都有统一格式,用户端弹出 Toast 提示

// ====================================================================
// PHASE 2: 经营分析 (TODO)
// ====================================================================
// 客户消费异常分析 + 维护流程 | 库存预警增强 | 员工绩效分析
// 鱼塘经营分析 | 药品销售分析 | 利润趋势 | 行情订阅收费
// 微信公众号通知

// ====================================================================
// PHASE 3: AI 智能化 (TODO)
// ====================================================================
// AI 显微镜 | 病原辅助识别 | 专业知识库 | 规则引擎
// AI 语音/图片录入 | AI 经营助手 | 客户流失风险
// ====================================================================
