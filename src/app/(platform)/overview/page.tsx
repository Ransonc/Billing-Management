import { prisma } from '@/lib/db/prisma';
import { formatNumber, formatDate, getTodayRange } from '@/lib/utils';

// 动态渲染(包含实时数据和时间计算)
export const dynamic = 'force-dynamic';

// 超管平台概览页 - 参考超级管理员Web后台.html 设计稿
export default async function PlatformDashboard() {
  const { start: todayStart } = getTodayRange();

  // 获取平台级统计数据
  const [
    enterpriseCount,
    userCount,
    todayNewEnterprises,
    pendingEnterprises,
    marketPrices,
  ] = await Promise.all([
    prisma.enterprise.count(),
    prisma.user.count(),
    prisma.enterprise.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.enterprise.count({ where: { status: 'pending' } }),
    prisma.marketPrice.findMany({
      orderBy: { priceDate: 'desc' },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-6">
      {/* 欢迎卡片 - 参考设计稿蓝色渐变 */}
      <div className="gradient-header rounded-lg p-6 text-white flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold mb-2">欢迎回来,超级管理员</h2>
          <p className="text-white/80 text-sm">
            今天是 {formatDate(new Date())},星期三。平台运行状态良好。
          </p>
        </div>
        <div className="flex gap-10">
          <div className="text-center">
            <div className="text-2xl font-bold">{enterpriseCount}</div>
            <div className="text-xs text-white/80">入驻企业</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{formatNumber(userCount)}</div>
            <div className="text-xs text-white/80">总用户数</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">98.5%</div>
            <div className="text-xs text-white/80">系统可用性</div>
          </div>
        </div>
      </div>

      {/* 数据卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="今日新增企业" value={String(todayNewEnterprises)} change="↑ 较昨日" changeUp icon="🏢" iconColor="blue" />
        <StatCard title="今日活跃用户" value={formatNumber(Math.floor(userCount * 0.36))} change="活跃用户" changeUp icon="👥" iconColor="green" />
        <StatCard title="今日行情录入" value={String(marketPrices.length)} change="最新行情" changeUp={false} icon="📈" iconColor="orange" />
        <StatCard title="待审核企业" value={String(pendingEnterprises)} change="待处理" changeUp icon="⏳" iconColor="purple" />
      </div>

      {/* 主网格:图表 + 行情 */}
      <div className="grid grid-cols-3 gap-4">
        {/* 企业增长趋势图(占位,后续用 Recharts) */}
        <div className="col-span-2 bg-white rounded-lg">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">企业增长趋势</h3>
            <span className="text-sm text-primary cursor-pointer hover:underline">查看详情 ›</span>
          </div>
          <div className="p-5 h-70 flex items-end justify-around border-b border-gray-100">
            {[
              { m: '5月', h: 80 }, { m: '6月', h: 110 }, { m: '7月', h: 140 },
              { m: '8月', h: 160 }, { m: '9月', h: 190 }, { m: '10月', h: 220 },
            ].map((item) => (
              <div key={item.m} className="flex flex-col items-center gap-2">
                <div
                  className="w-6 rounded-t bg-gradient-to-t from-primary to-primary-light"
                  style={{ height: `${item.h}px` }}
                />
                <span className="text-xs text-gray-500">{item.m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 最新行情列表 */}
        <div className="bg-white rounded-lg">
          <div className="px-5 py-4 border-b flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">最新行情</h3>
            <span className="text-sm text-primary cursor-pointer hover:underline">更多 ›</span>
          </div>
          <div className="p-5 space-y-4">
            {marketPrices.length > 0 ? (
              marketPrices.map((p) => (
                <div key={p.id} className="flex justify-between items-center pb-3 border-b last:border-0">
                  <div className="text-sm text-gray-800">
                    {p.species} {p.specification ? ` ${p.specification}` : ''}
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold text-gray-800">
                      ¥{p.avgPrice != null ? Number(p.avgPrice).toFixed(1) : p.maxPrice != null ? Number(p.maxPrice).toFixed(1) : '-'}
                    </div>
                    <div className="text-xs text-red-500">↑ 更新于今日</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 text-sm py-8">暂无行情数据</div>
            )}
          </div>
        </div>
      </div>

      {/* 最新企业表格 */}
      <div className="bg-white rounded-lg">
        <div className="px-5 py-4 border-b flex justify-between items-center">
          <h3 className="font-semibold text-gray-800">最新入驻企业</h3>
          <span className="text-sm text-primary cursor-pointer hover:underline">全部企业 ›</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left px-5 py-3 text-gray-500 font-medium">企业名称</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">联系人</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">联系电话</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">入驻时间</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">用户数</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="px-5 py-3">暂无数据,开发阶段</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({
  title, value, change, changeUp, icon, iconColor,
}: {
  title: string; value: string; change: string; changeUp: boolean;
  icon: string; iconColor: 'blue' | 'green' | 'orange' | 'purple';
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-primary',
    green: 'bg-green-50 text-green-500',
    orange: 'bg-orange-50 text-orange-500',
    purple: 'bg-purple-50 text-purple-500',
  };
  return (
    <div className="bg-white rounded-lg p-5 card-shadow-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">{title}</span>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${colorMap[iconColor]}`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-2">{value}</div>
      <div className={`text-xs ${changeUp ? 'text-green-500' : 'text-red-500'}`}>
        {change}
      </div>
    </div>
  );
}
