'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/hooks/use-api';
import { formatDateTime } from '@/lib/utils';
import type { Customer, CustomerVisit } from '@/types';

// 员工移动端 - 客户拜访(开始签到 / 结束填写结果)
export default function EmployeeVisitsPage() {
  const [visits, setVisits] = useState<CustomerVisit[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [ending, setEnding] = useState<CustomerVisit | null>(null);
  const [result, setResult] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get<{ items: CustomerVisit[] }>('/api/visits?today=1').then((r) => setVisits(r.data?.items || [])).catch(() => undefined);
    api.get<{ items: Customer[] }>('/api/customers?page=1&pageSize=200').then((r) => setCustomers(r.data?.items || [])).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function startVisit() {
    if (!customerId || !purpose.trim()) {
      alert('请选择客户并填写拜访目的');
      return;
    }
    setBusy(true);
    try {
      await api.post('/api/visits', { customerId, purpose: purpose.trim() });
      setPurpose('');
      load();
    } catch {
      // 统一提示
    } finally {
      setBusy(false);
    }
  }

  async function finishVisit() {
    if (!ending) return;
    setBusy(true);
    try {
      await api.patch(`/api/visits/${ending.id}`, {
        result: result.trim() || null,
        followUp: followUp.trim() || null,
        nextFollowUp: nextFollowUp || null,
      });
      setEnding(null);
      setResult('');
      setFollowUp('');
      setNextFollowUp('');
      load();
    } catch {
      // 统一提示
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold">客户拜访</div>
      </div>

      {/* 开始拜访 */}
      <div className="p-4">
        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <div className="font-semibold text-gray-800 text-sm">开始拜访签到</div>
          <select
            className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">选择客户</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.address ? ` · ${c.address}` : ''}
              </option>
            ))}
          </select>
          <input
            className="w-full h-10 rounded-lg border border-input bg-white px-3 text-sm"
            placeholder="拜访目的(如:水质回访 / 用药指导)"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
          />
          <Button className="w-full" disabled={busy} onClick={startVisit}>
            签到并开始拜访
          </Button>
        </div>
      </div>

      {/* 今日拜访 */}
      <div className="px-4 pb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="font-semibold text-gray-800 text-sm mb-2">今日拜访记录</div>
          {visits.length === 0 && <div className="py-6 text-center text-gray-400 text-sm">暂无记录</div>}
          <div className="space-y-3">
            {visits.map((v) => (
              <div key={v.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex justify-between items-start">
                  <div className="text-sm font-medium text-gray-800">
                    {v.customer?.name || '客户'}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      v.endTime ? 'bg-gray-100 text-gray-500' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {v.endTime ? '已结束' : '进行中'}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{v.purpose}</div>
                <div className="text-xs text-gray-400 mt-1">
                  {formatDateTime(v.startTime)}
                  {v.endTime ? ` ~ ${formatDateTime(v.endTime)}` : ''}
                </div>
                {!v.endTime && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 w-full h-8 text-xs"
                    onClick={() => setEnding(v)}
                  >
                    结束拜访并填写结果
                  </Button>
                )}
                {v.endTime && v.result && <div className="text-xs text-gray-600 mt-2">结果:{v.result}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 结束拜访弹层 */}
      {ending && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end justify-center" onClick={() => setEnding(null)}>
          <div
            className="w-full max-w-[480px] bg-white rounded-t-3xl p-5 space-y-3 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-semibold text-gray-800">结束拜访 · {ending.customer?.name}</div>
            <textarea
              className="w-full rounded-lg border border-input p-3 text-sm"
              rows={3}
              placeholder="拜访结果"
              value={result}
              onChange={(e) => setResult(e.target.value)}
            />
            <textarea
              className="w-full rounded-lg border border-input p-3 text-sm"
              rows={2}
              placeholder="后续跟进事项"
              value={followUp}
              onChange={(e) => setFollowUp(e.target.value)}
            />
            <div>
              <div className="text-xs text-gray-500 mb-1">下次跟进时间(可选)</div>
              <input
                type="date"
                className="w-full h-10 rounded-lg border border-input px-3 text-sm"
                value={nextFollowUp}
                onChange={(e) => setNextFollowUp(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" disabled={busy} onClick={finishVisit}>
                完成
              </Button>
              <Button variant="outline" onClick={() => setEnding(null)}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
