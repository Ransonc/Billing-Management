// 前后端共享的 TypeScript 类型定义

import type { Role } from '@/lib/constants';

// ============ 认证 ============

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  enterpriseId?: string | null;
  phone?: string | null;
}

// ============ 通用响应 ============

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ============ 业务实体 ============

export interface Enterprise {
  id: string;
  name: string;
  contactName?: string | null;
  contactPhone?: string | null;
  status: 'active' | 'pending' | 'inactive';
  subscription: 'free' | 'basic' | 'premium';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  enterpriseId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  status: 'active' | 'inactive';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  // 关联统计
  _count?: {
    fishPonds?: number;
    debts?: number;
  };
  _meta?: {
    totalDebt?: number;
    recentConsumption?: number;
  };
}

export interface FishPond {
  id: string;
  enterpriseId: string;
  customerId?: string | null;
  name: string;
  area?: number | null;
  waterDepth?: number | null;
  fishSpecies?: string | null;
  stockDate?: string | null;
  stockQuantity?: number | null;
  stockWeight?: number | null;
  status: 'active' | 'inactive' | 'sold_out';
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string } | null;
}

export interface DrugInventory {
  id: string;
  enterpriseId: string;
  name: string;
  specification?: string | null;
  unit: string;
  supplier?: string | null;
  purchasePrice?: number | null;
  salePrice?: number | null;
  stockQuantity: number;
  safetyStock: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface DrugSale {
  id: string;
  enterpriseId: string;
  drugId: string;
  customerId?: string | null;
  fishPondId?: string | null;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  saleDate: string;
  notes?: string | null;
  createdAt: string;
  drug?: { id: string; name: string; unit: string } | null;
  customer?: { id: string; name: string } | null;
}

export interface Debt {
  id: string;
  enterpriseId: string;
  customerId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'pending' | 'partial' | 'settled';
  signImageUrl?: string | null;
  signDate?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: { id: string; name: string } | null;
  payments?: DebtPayment[];
}

export interface DebtPayment {
  id: string;
  debtId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string | null;
  notes?: string | null;
  createdAt: string;
}

export interface WaterQualityRecord {
  id: string;
  enterpriseId: string;
  fishPondId?: string | null;
  recordDate: string;
  temperature?: number | null;
  ph?: number | null;
  dissolvedOxygen?: number | null;
  ammonia?: number | null;
  nitrite?: number | null;
  source?: string | null;
  abnormal: boolean;
  abnormalDetails?: string | null;
  createdAt: string;
  fishPond?: { id: string; name: string } | null;
}

export interface Attendance {
  id: string;
  enterpriseId: string;
  userId: string;
  checkInTime: string;
  checkOutTime?: string | null;
  checkInAddr?: string | null;
  checkOutAddr?: string | null;
  status: 'normal' | 'late' | 'early' | 'missing';
  date: string;
}

export interface CustomerVisit {
  id: string;
  enterpriseId: string;
  userId: string;
  customerId: string;
  startTime: string;
  endTime?: string | null;
  purpose: string;
  result?: string | null;
  followUp?: string | null;
  nextFollowUp?: string | null;
  customer?: { id: string; name: string } | null;
}

export interface FieldTrack {
  id: string;
  enterpriseId: string;
  userId: string;
  startTime: string;
  endTime?: string | null;
  duration?: number | null;
  status: 'active' | 'ended';
  createdAt: string;
}

export interface FinanceRecord {
  id: string;
  enterpriseId: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description?: string | null;
  recordDate: string;
  createdAt: string;
}

export interface MarketPrice {
  id: string;
  species: string;
  specification?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  avgPrice?: number | null;
  priceDate: string;
  source?: string | null;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  phone?: string | null;
  name: string;
  role: Role;
  enterpriseId?: string | null;
  isActive: boolean;
  createdAt: string;
  enterprise?: { id: string; name: string } | null;
}

export interface FishStocking {
  id: string;
  fishPondId: string;
  fishSpecies: string;
  quantity: number;
  weight?: number | null;
  unitPrice?: number | null;
  totalCost?: number | null;
  stockDate: string;
  notes?: string | null;
}

export interface DailyDeath {
  id: string;
  fishPondId: string;
  deathDate: string;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
}

export interface FeedRecord {
  id: string;
  fishPondId: string;
  brand: string;
  model?: string | null;
  bags: number;
  unitPrice?: number | null;
  totalCost?: number | null;
  feedDate: string;
  notes?: string | null;
}

export interface DrugRecord {
  id: string;
  fishPondId: string;
  drugName: string;
  drugId?: string | null;
  quantity: number;
  cost?: number | null;
  startDate: string;
  endDate?: string | null;
  periodDays?: number | null;
  reason?: string | null;
  notes?: string | null;
}

export interface SaleRecord {
  id: string;
  fishPondId: string;
  fishSpecies: string;
  quantity: number;
  weight: number;
  unitPrice: number;
  totalAmount: number;
  saleDate: string;
  buyerName?: string | null;
  notes?: string | null;
}

export interface DrugPurchase {
  id: string;
  drugId: string;
  supplier: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  purchaseDate: string;
  notes?: string | null;
  drug?: { id: string; name: string } | null;
}

export interface CommissionRecord {
  id: string;
  userId: string;
  periodMonth: string;
  salesAmount: number;
  commissionRate?: number | null;
  commissionAmount: number;
  status: 'pending' | 'confirmed' | 'paid';
  createdAt: string;
  userName?: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  enterpriseId?: string | null;
  action: string;
  module: string;
  targetId?: string | null;
  targetType?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

// ============ 经营驾驶舱数据 ============

export interface DashboardStats {
  todaySales: number;
  monthSales: number;
  monthGrossProfit: number;
  monthNetProfit: number;
  pendingDebt: number;
  debtCustomerCount: number;
  lowStockDrugs: number;
  abnormalWaterQuality: number;
  abnormalCustomers: number;
  // 员工概览
  employeeCheckedIn: number;
  employeeTotal: number;
  fieldWorkers: number;
  todayVisits: number;
  // 趋势
  salesTrend: { current: number; change: number };
  profitTrend: { current: number; change: number };
}

export interface PlatformStats {
  totalEnterprises: number;
  totalUsers: number;
  totalCustomers: number;
  totalFishPonds: number;
  pendingEnterprises: number;
  todayNewEnterprises: number;
  todayActiveUsers: number;
  // 行情
  latestPrices: MarketPrice[];
}
