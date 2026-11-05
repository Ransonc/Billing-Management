// 核心业务计算模块
// 集中管理成本、利润、提成、欠款等计算逻辑
// 确保所有业务入口使用相同公式

// ============ 药品销售计算 ============

// 计算药品销售的总金额
export function calculateDrugSaleTotal(quantity: number, unitPrice: number): number {
  return Number((quantity * unitPrice).toFixed(2));
}

// 计算药品销售的毛利润
export function calculateDrugSaleGrossProfit(
  saleAmount: number,
  purchaseCost: number
): number {
  return Number((saleAmount - purchaseCost).toFixed(2));
}

// ============ 欠款计算 ============

// 创建欠款单时初始化
export function initDebt(
  totalAmount: number,
  paidAmount = 0
): { totalAmount: number; paidAmount: number; remainingAmount: number; status: string } {
  const remaining = Number((totalAmount - paidAmount).toFixed(2));
  return {
    totalAmount: Number(totalAmount.toFixed(2)),
    paidAmount: Number(paidAmount.toFixed(2)),
    remainingAmount: remaining,
    status: remaining <= 0 ? 'settled' : paidAmount > 0 ? 'partial' : 'pending',
  };
}

// 回款后更新欠款状态
export function applyDebtPayment(
  debt: { totalAmount: number; paidAmount: number },
  paymentAmount: number
): { paidAmount: number; remainingAmount: number; status: string } {
  const newPaid = Number((debt.paidAmount + paymentAmount).toFixed(2));
  const remaining = Number((debt.totalAmount - newPaid).toFixed(2));
  return {
    paidAmount: newPaid,
    remainingAmount: Math.max(0, remaining),
    status: remaining <= 0 ? 'settled' : newPaid > 0 ? 'partial' : 'pending',
  };
}

// ============ 库存计算 ============

// 药品采购入库
export function applyPurchase(
  currentStock: number,
  purchaseQty: number
): number {
  return currentStock + purchaseQty;
}

// 药品销售出库(带校验)
export function applySale(
  currentStock: number,
  saleQty: number
): { newStock: number; ok: boolean; reason?: string } {
  if (saleQty <= 0) {
    return { newStock: currentStock, ok: false, reason: '销售数量必须大于0' };
  }
  if (currentStock < saleQty) {
    return { newStock: currentStock, ok: false, reason: '库存不足' };
  }
  return { newStock: currentStock - saleQty, ok: true };
}

// ============ 员工提成计算 ============

// 根据销售额和提成比例计算提成
export function calculateCommission(
  salesAmount: number,
  commissionRate: number
): number {
  if (salesAmount <= 0 || commissionRate <= 0) return 0;
  return Number((salesAmount * (commissionRate / 100)).toFixed(2));
}

// 阶梯提成(预留扩展)
export function calculateTieredCommission(
  salesAmount: number,
  tiers: Array<{ minAmount: number; maxAmount?: number; rate: number }>
): number {
  let commission = 0;
  for (const tier of tiers) {
    const tierMin = tier.minAmount;
    const tierMax = tier.maxAmount ?? Infinity;
    const tierableAmount = Math.min(Math.max(0, salesAmount - tierMin), tierMax - tierMin);
    if (tierableAmount > 0) {
      commission += calculateCommission(tierableAmount, tier.rate);
    }
  }
  return commission;
}

// ============ 养殖周期结算 ============

export interface CycleSummary {
  totalInput: number;       // 总投入(鱼苗+饲料+药品+其他)
  totalRevenue: number;     // 总出售收入
  grossProfit: number;      // 毛利润
  deathRate: number;        // 死亡率
  avgWeight: number | null; // 平均出售重量
  feedCostPerKg: number | null; // 每斤饲料成本
}

export function calculateCycleSummary(params: {
  stockingCost: number;
  feedCost: number;
  drugCost: number;
  otherCost: number;
  totalSaleRevenue: number;
  totalStockQuantity: number;
  totalSaleQuantity: number;
  totalSaleWeight: number;
}): CycleSummary {
  const totalInput = params.stockingCost + params.feedCost + params.drugCost + params.otherCost;
  const grossProfit = params.totalSaleRevenue - totalInput;
  const deathRate = params.totalStockQuantity > 0
    ? Number((((params.totalStockQuantity - params.totalSaleQuantity) / params.totalStockQuantity) * 100).toFixed(1))
    : 0;
  const avgWeight = params.totalSaleQuantity > 0
    ? Number((params.totalSaleWeight / params.totalSaleQuantity).toFixed(2))
    : null;
  const feedCostPerKg = params.totalSaleWeight > 0
    ? Number((params.feedCost / params.totalSaleWeight).toFixed(2))
    : null;

  return { totalInput, totalRevenue: params.totalSaleRevenue, grossProfit, deathRate, avgWeight, feedCostPerKg };
}

// ============ 财务利润链 ============

export interface ProfitChain {
  salesRevenue: number;    // 销售收入
  costOfGoods: number;      // 商品成本(药品采购)
  grossProfit: number;      // 毛利润 = 销售收入 - 商品成本
  commission: number;       // 员工提成
  fixedExpenses: number;    // 固定/经营支出
  netProfit: number;        // 净利润 = 毛利润 - 提成 - 固定支出
}

export function calculateProfitChain(params: {
  salesRevenue: number;
  costOfGoods: number;
  commission: number;
  fixedExpenses: number;
}): ProfitChain {
  const grossProfit = params.salesRevenue - params.costOfGoods;
  const netProfit = grossProfit - params.commission - params.fixedExpenses;
  return {
    ...params,
    grossProfit: Number(grossProfit.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
  };
}

// ============ 客户消费异常检测 ============

export interface ConsumptionChange {
  customerId: string;
  customerName: string;
  currentAmount: number;
  previousAmount: number;
  changeRate: number;  // 正数增长,负数下降
  isAbnormal: boolean;
}

export function detectConsumptionAnomaly(
  currentAmount: number,
  previousAmount: number,
  thresholdPercent = 30
): { changeRate: number; isAbnormal: boolean } {
  if (previousAmount === 0 && currentAmount === 0) {
    return { changeRate: 0, isAbnormal: false };
  }
  if (previousAmount === 0) {
    return { changeRate: 100, isAbnormal: true }; // 从无到有也算异常
  }
  const changeRate = Number((((currentAmount - previousAmount) / previousAmount) * 100).toFixed(1));
  return {
    changeRate,
    isAbnormal: Math.abs(changeRate) >= thresholdPercent,
  };
}

// ============ 水质异常判断 ============

export interface WaterQualityCheck {
  indicator: string;
  value: number;
  isAbnormal: boolean;
  level: 'normal' | 'warning' | 'danger';
  message: string;
}

export function checkWaterQuality(
  indicator: string,
  value: number,
  threshold: { minValue: number; maxValue: number; warningMin?: number; warningMax?: number }
): WaterQualityCheck {
  const { minValue, maxValue, warningMin, warningMax } = threshold;

  if (value < minValue || value > maxValue) {
    return {
      indicator,
      value,
      isAbnormal: true,
      level: 'danger',
      message: `${indicator} 异常:当前 ${value},正常范围 ${minValue}~${maxValue}`,
    };
  }

  const wMin = warningMin ?? minValue + (maxValue - minValue) * 0.1;
  const wMax = warningMax ?? maxValue - (maxValue - minValue) * 0.1;

  if (value < wMin || value > wMax) {
    return {
      indicator,
      value,
      isAbnormal: true,
      level: 'warning',
      message: `${indicator} 注意:接近异常边界`,
    };
  }

  return {
    indicator,
    value,
    isAbnormal: false,
    level: 'normal',
    message: `${indicator} 正常`,
  };
}
