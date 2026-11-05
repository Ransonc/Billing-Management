'use client';

import Link from 'next/link';
import { useClientData } from '@/hooks/use-client-data';
import { formatDate } from '@/lib/utils';

// 客户(养殖户)移动端首页:我的鱼塘 + 最新水质状态
export default function ClientMobileHome() {
  const { data, loading } = useClientData();

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">加载中...</div>;
  if (!data) {
    return <div className="py-20 text-center text-gray-400 text-sm px-8">数据加载失败或账号未绑定客户档案</div>;
  }

  const abnormalCount = data.ponds.filter((p) => p.waterQualities[0]?.abnormal).length;

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-14 text-white">
        <div className="text-white/80 text-sm">您好</div>
        <div className="text-2xl font-bold mt-1">{data.customer.name}</div>
        <div className="text-white/80 text-xs mt-2">
          共 {data.ponds.length} 口鱼塘正在管理
        </div>
      </div>

      <div className="px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-sm p-4 grid grid-cols-3 text-center divide-x divide-gray-100">
          <div>
            <div className="text-lg font-bold text-blue-600">{data.ponds.length}</div>
            <div className="text-xs text-gray-500 mt-1">我的鱼塘</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-500">{abnormalCount}</div>
            <div className="text-xs text-gray-500 mt-1">最新检测异常</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {data.ponds.reduce((s, p) => s + p.saleRecords.length, 0)}
            </div>
            <div className="text-xs text-gray-500 mt-1">近期出鱼</div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 mb-4 space-y-3">
        <div className="flex gap-3">
          <Link
            href="/mobile/client/water"
            className="flex-1 bg-white rounded-2xl shadow-sm p-4 text-center"
          >
            <div className="text-2xl">💧</div>
            <div className="text-xs text-gray-600 mt-1">水质检测</div>
          </Link>
          <Link
            href="/mobile/client/drugs"
            className="flex-1 bg-white rounded-2xl shadow-sm p-4 text-center"
          >
            <div className="text-2xl">💊</div>
            <div className="text-xs text-gray-600 mt-1">用药记录</div>
          </Link>
        </div>

        <div className="font-semibold text-gray-800 text-sm pt-1">鱼塘最新动态</div>
        {data.ponds.length === 0 && (
          <div className="py-10 text-center text-gray-400 text-sm bg-white rounded-2xl">暂无名下鱼塘</div>
        )}
        {data.ponds.map((p) => {
          const latest = p.waterQualities[0];
          return (
            <Link
              key={p.id}
              href="/mobile/client/fish-ponds"
              className="block bg-white rounded-2xl shadow-sm p-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-semibold text-gray-800">{p.name}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {p.fishSpecies || '未设品种'}
                    {p.area ? ` · ${p.area}亩` : ''}
                  </div>
                </div>
                {latest ? (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      latest.abnormal ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {latest.abnormal ? '水质异常' : '水质正常'}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                    暂无检测
                  </span>
                )}
              </div>
              {latest && (
                <div className="text-xs text-gray-400 mt-2">
                  最近检测:{formatDate(latest.recordDate)}
                  {latest.abnormal && latest.abnormalDetails ? ` · ${latest.abnormalDetails}` : ''}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
