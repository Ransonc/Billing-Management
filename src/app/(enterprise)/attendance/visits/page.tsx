'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useApi, api } from '@/hooks/use-api';
import { useGeolocation } from '@/hooks/use-geolocation';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { Customer, CustomerVisit } from '@/types';

interface VisitRow extends CustomerVisit {
  userName?: string;
}

export default function VisitsPage() {
  const { call, loading } = useApi();
  const { locate, locating } = useGeolocation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [visits, setVisits] = useState<VisitRow[]>([]);
  const [form, setForm] = useState({ customerId: '', purpose: '' });
  const [ending, setEnding] = useState<Record<string, { result: string; followUp: string; nextFollowUp: string }>>({});

  const load = useCallback(() => {
    api
      .get<{ items: VisitRow[] }>('/api/visits')
      .then((r) => setVisits(r.data?.items || []));
  }, []);

  useEffect(() => {
    api.get<{ items: Customer[] }>('/api/customers?all=1').then((r) => setCustomers(r.data?.items || []));
    load();
  }, [load]);

  async function startVisit(e: React.FormEvent) {
    e.preventDefault();
    const loc = await locate();
    const result = await call(
      () =>
        api.post('/api/visits', {
          customerId: form.customerId,
          purpose: form.purpose,
          lat: loc?.lat ?? null,
          lng: loc?.lng ?? null,
        }),
      { showSuccess: true, successMsg: '拜访已开始' }
    );
    if (result) {
      setForm({ customerId: '', purpose: '' });
      load();
    }
  }

  async function endVisit(id: string) {
    const data = ending[id] || { result: '', followUp: '', nextFollowUp: '' };
    if (!data.result) {
      alert('请填写拜访结果');
      return;
    }
    const result = await call(() => api.patch(`/api/visits/${id}`, data), {
      showSuccess: true,
      successMsg: '拜访已结束',
    });
    if (result) load();
  }

  return (
    <div>
      <Link href="/attendance" className="text-sm text-gray-500 hover:text-gray-700">
        ← 返回考勤
      </Link>
      <h1 className="text-2xl font-bold text-gray-800 mt-2 mb-6">客户拜访</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>开始拜访{locating ? '(定位中...)' : ''}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={startVisit} className="grid grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label>客户 *</Label>
              <select
                required
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={form.customerId}
                onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
              >
                <option value="">请选择客户</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="purpose">拜访目的 *</Label>
              <Input
                id="purpose"
                required
                placeholder="如:用药指导、回款催收、水质回访"
                value={form.purpose}
                onChange={(e) => setForm((f) => ({ ...f, purpose: e.target.value }))}
              />
            </div>
            <Button type="submit" disabled={loading || locating}>
              开始拜访
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {visits.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-gray-400">暂无拜访记录</CardContent>
          </Card>
        )}
        {visits.map((v) => {
          const active = !v.endTime;
          const endForm = ending[v.id] || { result: '', followUp: '', nextFollowUp: '' };
          return (
            <Card key={v.id} className={active ? 'border-green-300' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-800">
                      {v.customer?.name || '-'}
                      {active && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded border bg-green-50 text-green-600 border-green-200">
                          进行中
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {v.userName} · {formatDateTime(v.startTime)}
                      {v.endTime ? ` ~ ${formatDateTime(v.endTime)}` : ''}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">目的: {v.purpose}</div>
                    {v.result && <div className="text-sm text-gray-600 mt-1">结果: {v.result}</div>}
                    {v.followUp && <div className="text-sm text-gray-500 mt-1">跟进: {v.followUp}</div>}
                    {v.nextFollowUp && (
                      <div className="text-xs text-primary mt-1">
                        下次跟进: {formatDate(v.nextFollowUp)}
                      </div>
                    )}
                  </div>
                </div>
                {active && (
                  <div className="mt-4 grid grid-cols-3 gap-3 items-start border-t pt-3">
                    <div className="space-y-1">
                      <Label className="text-xs">拜访结果 *</Label>
                      <Input
                        value={endForm.result}
                        onChange={(e) =>
                          setEnding((s) => ({ ...s, [v.id]: { ...endForm, result: e.target.value } }))
                        }
                        placeholder="沟通情况、达成事项"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">跟进事项</Label>
                      <Textarea
                        rows={1}
                        value={endForm.followUp}
                        onChange={(e) =>
                          setEnding((s) => ({ ...s, [v.id]: { ...endForm, followUp: e.target.value } }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">下次跟进日期</Label>
                      <div className="flex gap-2">
                        <Input
                          type="date"
                          value={endForm.nextFollowUp}
                          onChange={(e) =>
                            setEnding((s) => ({ ...s, [v.id]: { ...endForm, nextFollowUp: e.target.value } }))
                          }
                        />
                        <Button size="sm" onClick={() => endVisit(v.id)} disabled={loading}>
                          结束
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
