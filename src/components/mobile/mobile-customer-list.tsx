'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/hooks/use-api';
import { CUSTOMER_STATUS_LABELS } from '@/lib/constants';
import type { Customer } from '@/types';

// 移动端客户列表(老板/员工共用,点击跳 Web 详情)
export function MobileCustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    api
      .get<{ items: Customer[] }>('/api/customers?page=1&pageSize=200')
      .then((r) => setCustomers(r.data?.items || []))
      .catch(() => undefined);
  }, []);

  const filtered = customers.filter(
    (c) =>
      !keyword ||
      c.name.includes(keyword) ||
      (c.phone || '').includes(keyword) ||
      (c.address || '').includes(keyword)
  );

  return (
    <div>
      <div className="gradient-header px-5 pt-10 pb-5 text-white">
        <div className="text-lg font-bold mb-3">我的客户</div>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="搜索客户姓名 / 电话 / 养殖场"
          className="w-full h-10 rounded-full bg-white/95 px-4 text-sm text-gray-700 outline-none"
        />
      </div>
      <div className="p-4 space-y-3">
        {filtered.length === 0 && <div className="py-16 text-center text-gray-400 text-sm">暂无客户</div>}
        {filtered.map((c) => (
          <Link key={c.id} href={`/customers/${c.id}`} className="block bg-white rounded-2xl shadow-sm p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-gray-800">{c.name}</div>
                <div className="text-xs text-gray-500 mt-1">{c.phone || '未留电话'}</div>
                {c.address && <div className="text-xs text-gray-500 mt-0.5">📍 {c.address}</div>}
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  c.status === 'active' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}
              >
                {CUSTOMER_STATUS_LABELS[c.status] || c.status}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
