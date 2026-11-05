// 系统常量定义

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  OWNER: 'owner',
  EMPLOYEE: 'employee',
  CUSTOMER: 'customer',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: '超级管理员',
  owner: '老板',
  employee: '员工',
  customer: '客户',
};

// 企业状态
export const ENTERPRISE_STATUS = {
  ACTIVE: 'active',
  PENDING: 'pending',
  INACTIVE: 'inactive',
} as const;

// 鱼塘状态
export const FISH_POND_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SOLD_OUT: 'sold_out',
} as const;

// 药品销售付款状态
export const PAYMENT_STATUS = {
  UNPAID: 'unpaid',
  PARTIAL: 'partial',
  PAID: 'paid',
} as const;

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: '未付款',
  partial: '部分付款',
  paid: '已付清',
};

// 欠款状态
export const DEBT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  SETTLED: 'settled',
} as const;

// 考勤状态
export const ATTENDANCE_STATUS = {
  NORMAL: 'normal',
  LATE: 'late',
  EARLY: 'early',
  MISSING: 'missing',
} as const;

// 财务类型
export const FINANCE_TYPE = {
  INCOME: 'income',
  EXPENSE: 'expense',
} as const;

// 财务分类
export const FINANCE_CATEGORIES = {
  SALES: 'sales',
  DRUG_PURCHASE: 'drug_purchase',
  SALARY: 'salary',
  RENT: 'rent',
  WATER_ELECTRIC: 'water_electric',
  COMMISSION: 'commission',
  LOGISTICS: 'logistics',
  TRAVEL: 'travel',
  ENTERTAINMENT: 'entertainment',
  SOFTWARE_DEVICE: 'software_device',
  AFTER_SALES: 'after_sales',
  OTHER: 'other',
} as const;

export const FINANCE_CATEGORY_LABELS: Record<string, string> = {
  sales: '销售收入',
  drug_purchase: '药品采购',
  salary: '员工工资',
  rent: '房租',
  water_electric: '水电',
  commission: '员工提成',
  logistics: '物流',
  travel: '差旅',
  entertainment: '招待',
  software_device: '软件/设备',
  after_sales: '售后及其他',
  other: '其他',
};

// 水质指标
export const WATER_QUALITY_INDICATORS = {
  TEMPERATURE: 'temperature',
  PH: 'ph',
  DISSOLVED_OXYGEN: 'dissolved_oxygen',
  AMMONIA: 'ammonia',
  NITRITE: 'nitrite',
} as const;

export const WATER_QUALITY_INDICATOR_LABELS: Record<string, string> = {
  temperature: '水温(℃)',
  ph: 'pH值',
  dissolved_oxygen: '溶解氧(mg/L)',
  ammonia: '氨氮(mg/L)',
  nitrite: '亚硝酸盐(mg/L)',
};

// 鱼塘状态标签
export const FISH_POND_STATUS_LABELS: Record<string, string> = {
  active: '养殖中',
  inactive: '已停用',
  sold_out: '已清塘',
};

// 客户状态标签
export const CUSTOMER_STATUS_LABELS: Record<string, string> = {
  active: '合作中',
  inactive: '已停用',
};

// 常见养殖/批发品种建议项(fishSpecies / marketPrice.species 为自由文本,此处仅作录入建议)
export const FISH_SPECIES_OPTIONS = [
  '草鱼',
  '鲫鱼',
  '鲤鱼',
  '鲢鱼',
  '鳙鱼',
  '罗非鱼',
  '加州鲈',
  '黑鱼',
  '黄颡鱼',
  '鳊鱼',
  '小龙虾',
  '南美白对虾',
  '大闸蟹',
  '其他',
];

// 死鱼原因分类
export const DEATH_REASONS = {
  DISEASE: 'disease',
  OXYGEN_LACK: 'oxygen_lack',
  WATER_QUALITY: 'water_quality',
  WEATHER: 'weather',
  OPERATION: 'operation',
  OTHER: 'other',
} as const;

export const DEATH_REASON_LABELS: Record<string, string> = {
  disease: '病害',
  oxygen_lack: '缺氧浮头',
  water_quality: '水质恶化',
  weather: '天气应激',
  operation: '操作不当',
  other: '其他',
};

// 回款方式
export const PAYMENT_METHODS = {
  CASH: 'cash',
  BANK: 'bank',
  WECHAT: 'wechat',
  ALIPAY: 'alipay',
} as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: '现金',
  bank: '银行转账',
  wechat: '微信',
  alipay: '支付宝',
};

// 提成分录状态
export const COMMISSION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
} as const;

export const COMMISSION_STATUS_LABELS: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  paid: '已发放',
};

// 默认提成比例(%)
export const DEFAULT_COMMISSION_RATE = 5;

// 水质默认阈值(阈值表未配置时兜底)
// 指标: [危险下限, 危险上限]
export const DEFAULT_WATER_THRESHOLDS: Record<string, { min: number; max: number }> = {
  temperature: { min: 15, max: 32 },
  ph: { min: 6.5, max: 9.0 },
  dissolved_oxygen: { min: 4, max: 12 },
  ammonia: { min: 0, max: 0.6 },
  nitrite: { min: 0, max: 0.2 },
};

// 行情趋势可选时间范围(天)
export const MARKET_TREND_RANGES = [7, 30, 90, 180] as const;

// 平台颜色主题(参考设计稿)
export const THEME_COLORS = {
  primary: {
    DEFAULT: '#1e88e5',
    dark: '#1565c0',
    light: '#64b5f6',
  },
  success: '#4caf50',
  warning: '#ff9800',
  danger: '#f44336',
  yellow: '#fdd835',
  sidebar: '#001529',
};

// 页面模块名称(用于权限配置)
export const MODULES = {
  DASHBOARD: 'dashboard',
  CUSTOMER: 'customer',
  FISH_POND: 'fish_pond',
  DRUG: 'drug',
  SALE: 'sale',
  DEBT: 'debt',
  FINANCE: 'finance',
  ATTENDANCE: 'attendance',
  FIELD_TRACK: 'field_track',
  CUSTOMER_VISIT: 'customer_visit',
  COMMISSION: 'commission',
  WATER_QUALITY: 'water_quality',
  MARKET_PRICE: 'market_price',
  ENTERPRISE: 'enterprise',
  USER: 'user',
  AUDIT_LOG: 'audit_log',
  SYSTEM_CONFIG: 'system_config',
} as const;
