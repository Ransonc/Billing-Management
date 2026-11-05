import type { ReactNode } from 'react';

// 状态标签 - 统一的样式映射
const STATUS_STYLES: Record<string, string> = {
  active: 'bg-green-50 text-green-600 border-green-200',
  pending: 'bg-orange-50 text-orange-600 border-orange-200',
  inactive: 'bg-gray-100 text-gray-500 border-gray-200',
  settled: 'bg-green-50 text-green-600 border-green-200',
  partial: 'bg-blue-50 text-blue-600 border-blue-200',
  unpaid: 'bg-red-50 text-red-600 border-red-200',
  paid: 'bg-green-50 text-green-600 border-green-200',
  normal: 'bg-green-50 text-green-600 border-green-200',
  late: 'bg-orange-50 text-orange-600 border-orange-200',
  missing: 'bg-red-50 text-red-600 border-red-200',
  early: 'bg-yellow-50 text-yellow-700 border-yellow-200',
};

const STATUS_LABELS: Record<string, string> = {
  active: '已激活',
  pending: '待审核',
  inactive: '未激活',
  settled: '已结清',
  partial: '部分还款',
  unpaid: '未付款',
  paid: '已付清',
  normal: '正常',
  late: '迟到',
  missing: '缺失',
  early: '早退',
};

export function StatusBadge({
  status,
  label,
}: {
  status: string;
  label?: string;
}) {
  const style = STATUS_STYLES[status] || STATUS_STYLES.inactive;
  const text = label || STATUS_LABELS[status] || status;
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${style}`}>
      {text}
    </span>
  );
}

// 带图标的提醒徽章
export function AlertBadge({
  type,
  children,
}: {
  type: 'success' | 'warning' | 'danger' | 'info';
  children: ReactNode;
}) {
  const colors = {
    success: 'text-green-600',
    warning: 'text-orange-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
  };
  return <span className={`text-sm font-medium ${colors[type]}`}>{children}</span>;
}
