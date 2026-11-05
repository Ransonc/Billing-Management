import { prisma } from '@/lib/db/prisma';
import { requireSuperAdmin } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 获取企业列表(支持搜索、分页、状态筛选)
export async function GET(request: Request) {
  try {
    await requireSuperAdmin();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactPhone: { contains: search } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.enterprise.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { users: true, customers: true } },
        },
      }),
      prisma.enterprise.count({ where }),
    ]);

    return jsonResponse({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取企业列表失败', 500);
  }
}

// 创建企业
export async function POST(request: Request) {
  try {
    await requireSuperAdmin();
    const body = await request.json();

    if (!body.name) {
      return errorResponse('企业名称不能为空');
    }

    const enterprise = await prisma.enterprise.create({
      data: {
        name: body.name,
        contactName: body.contactName || null,
        contactPhone: body.contactPhone || null,
        status: body.status || 'pending',
        subscription: body.subscription || 'free',
      },
    });

    return jsonResponse(enterprise);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '创建企业失败', 500);
  }
}
