import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';
import { ROLES } from '@/lib/constants';

const ACTION_LABELS: Record<string, string> = {
  create: '新增',
  update: '修改',
  delete: '删除',
  login: '登录',
  export: '导出',
  import: '导入',
  subscribe: '订阅',
};

const MODULE_LABELS: Record<string, string> = {
  enterprise: '企业',
  user: '用户',
  customer: '客户',
  fish_pond: '鱼塘',
  drug: '药品',
  drug_purchase: '药品采购',
  drug_sale: '药品销售',
  debt: '欠款',
  finance: '财务',
  commission: '提成',
  attendance: '考勤',
  water_quality: '水质检测',
  market_price: '批发行情',
  audit_log: '审计日志',
};

// 审计日志查询:超管可看全平台(支持 enterpriseId 过滤),老板限本企业
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    if (ctx.role === ROLES.CUSTOMER || ctx.role === ROLES.EMPLOYEE) {
      return errorResponse('无权查看审计日志', 403);
    }

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page') || 1);
    const pageSize = Math.min(Number(searchParams.get('pageSize') || 20), 100);
    const moduleFilter = searchParams.get('module') || undefined;
    const action = searchParams.get('action') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: Record<string, unknown> = {};

    if (ctx.role === ROLES.SUPER_ADMIN) {
      const enterpriseId = searchParams.get('enterpriseId');
      if (enterpriseId) where.enterpriseId = enterpriseId;
    } else {
      // owner:强制本企业
      Object.assign(where, buildEnterpriseWhere(ctx));
    }
    if (moduleFilter) where.module = moduleFilter;
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {
        ...(startDate ? { gte: new Date(startDate + 'T00:00:00') } : {}),
        ...(endDate ? { lte: new Date(endDate + 'T23:59:59') } : {}),
      };
    }

    const [total, items] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return jsonResponse({
      items: items.map((item) => ({
        ...item,
        actionLabel: ACTION_LABELS[item.action] || item.action,
        moduleLabel: MODULE_LABELS[item.module] || item.module,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '审计日志加载失败', 500);
  }
}
