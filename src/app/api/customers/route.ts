import { prisma } from '@/lib/db/prisma';
import { requireAuth, buildEnterpriseWhere } from '@/server/permissions';
import { errorResponse, jsonResponse } from '@/lib/utils/api';

// 客户列表(企业内隔离)
export async function GET(request: Request) {
  try {
    const ctx = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get('page')) || 1;
    const pageSize = Number(searchParams.get('pageSize')) || 20;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {
      ...buildEnterpriseWhere(ctx),
    };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { contactPerson: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: { select: { fishPonds: true, debts: true } },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return jsonResponse({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '获取客户列表失败', 500);
  }
}

// 创建客户
export async function POST(request: Request) {
  try {
    const ctx = await requireAuth();
    const body = await request.json();

    if (!body.name) {
      return errorResponse('客户名称不能为空');
    }

    const customer = await prisma.customer.create({
      data: {
        enterpriseId: ctx.enterpriseId!,
        name: body.name,
        phone: body.phone || null,
        address: body.address || null,
        contactPerson: body.contactPerson || null,
        status: body.status || 'active',
        notes: body.notes || null,
        createdById: ctx.userId,
      },
    });

    return jsonResponse(customer);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : '创建客户失败', 500);
  }
}
