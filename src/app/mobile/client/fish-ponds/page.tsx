'use client';

import { useState } from 'react';
import { useClientData } from '@/hooks/use-client-data';
import { formatDate, formatCurrency } from '@/lib/utils';

// 客户移动端 - 我的鱼塘(投苗 / 检测 / 用药 / 出售明细)
export default function ClientFishPondsPage() {
  const { data, loading } = useClientData();
  const [openId, setOpenId] = useState<string | null>(null);

  if (loading) return <div className="py-20 text-center text-gray-400 text-sm">加载中...</div>;
  if (!data) return <div className="py-20 text-center text-gray-400 text-sm">暂无数据</div>;

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">我的鱼塘</div>
        <div className="text-white/80 text-xs mt-1">共 {data.ponds.length} 口</div>
      </div>
      <div className="p-4 space-y-3">
        {data.ponds.map((p) => {
          const open = openId === p.id;
          const latestStocking = p.fishStockings[0];
          return (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button
                type="button"
                className="w-full p-4 text-left"
                onClick={() => setOpenId(open ? null : p.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.fishSpecies || '未设品种'}
                      {p.area ? ` · ${p.area}亩` : ''}
                    </div>
                  </div>
                  <span className="text-gray-300">{open ? '∧' : '∨'}</span>
                </div>
              </button>

              {open && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-50 pt-3">
                  <Section title="🐟 最近投苗">
                    {latestStocking ? (
                      <div className="text-sm text-gray-700">
                        {formatDate(latestStocking.stockDate)} 投放{' '}
                        {latestStocking.fishSpecies}{' '}
                        {latestStocking.quantity} 尾
                        {latestStocking.weight ? ` / ${latestStocking.weight}斤` : ''}
                      </div>
                    ) : (
                      <Empty />
                    )}
                  </Section>

                  <Section title="💧 近期水质检测">
                    {p.waterQualities.length === 0 ? (
                      <Empty />
                    ) : (
                      p.waterQualities.slice(0, 3).map((w) => (
                        <div key={w.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">{formatDate(w.recordDate)}</span>
                          <span className={w.abnormal ? 'text-red-500' : 'text-green-600'}>
                            {w.abnormal ? w.abnormalDetails || '异常' : '指标正常'}
                          </span>
                        </div>
                      ))
                    )}
                  </Section>

                  <Section title="💊 近期用药">
                    {p.drugRecords.length === 0 ? (
                      <Empty />
                    ) : (
                      p.drugRecords.slice(0, 3).map((d) => (
                        <div key={d.id} className="text-sm text-gray-700 py-1">
                          {formatDate(d.startDate)} {d.drugName} × {d.quantity}
                          {d.reason ? ` · ${d.reason}` : ''}
                        </div>
                      ))
                    )}
                  </Section>

                  <Section title="🐠 近期出鱼">
                    {p.saleRecords.length === 0 ? (
                      <Empty />
                    ) : (
                      p.saleRecords.slice(0, 3).map((s) => (
                        <div key={s.id} className="flex justify-between text-sm py-1">
                          <span className="text-gray-600">
                            {formatDate(s.saleDate)} {s.weight}斤
                          </span>
                          <span className="text-gray-800 font-medium">
                            {formatCurrency(s.totalAmount)}
                          </span>
                        </div>
                      ))
                    )}
                  </Section>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 mb-1">{title}</div>
      {children}
    </div>
  );
}

function Empty() {
  return <div className="text-xs text-gray-400">暂无记录</div>;
}
