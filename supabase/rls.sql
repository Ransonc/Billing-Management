-- ============================================================
-- 水产养殖经营管理平台 - PostgreSQL RLS 策略
-- 所有业务表通过 enterprise_id 实现行级安全隔离
-- 注意:使用前需在 Supabase SQL Editor 执行
-- ============================================================

-- 启用 RLS (需对每张业务表执行)
-- ALTER TABLE xxx ENABLE ROW LEVEL SECURITY;

-- ============ 辅助函数 ============

-- 获取当前用户的 enterprise_id(从 jwt claims 或 users 表)
CREATE OR REPLACE FUNCTION public.current_enterprise_id() RETURNS TEXT AS $$
BEGIN
  -- 优先从 JWT 中获取
  RETURN NULLIF(current_setting('app.enterprise_id', true), '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 获取当前用户角色
CREATE OR REPLACE FUNCTION public.current_role() RETURNS TEXT AS $$
BEGIN
  RETURN NULLIF(current_setting('app.role', true), '');
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============ RLS 策略模板 ============

-- 超管可访问所有数据
-- 企业用户只能访问自己企业的数据

-- Enterprise 表
ALTER TABLE enterprises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "enterprises_select" ON enterprises FOR SELECT USING (
  public.current_role() = 'super_admin' OR id = public.current_enterprise_id()
);
CREATE POLICY "enterprises_insert" ON enterprises FOR INSERT WITH CHECK (
  public.current_role() = 'super_admin'
);
CREATE POLICY "enterprises_update" ON enterprises FOR UPDATE USING (
  public.current_role() = 'super_admin' OR id = public.current_enterprise_id()
);

-- User 表
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON users FOR SELECT USING (
  public.current_role() = 'super_admin'
  OR enterprise_id = public.current_enterprise_id()
);
CREATE POLICY "users_insert" ON users FOR INSERT WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);
CREATE POLICY "users_update" ON users FOR UPDATE USING (
  public.current_role() = 'super_admin'
  OR enterprise_id = public.current_enterprise_id()
);

-- ============ 业务表:统一模式 ============
-- 所有带 enterprise_id 的业务表都遵循相同隔离规则

-- Customer
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customers_all" ON customers FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- FishPond
ALTER TABLE fish_ponds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fish_ponds_all" ON fish_ponds FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- FishStocking
ALTER TABLE fish_stockings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fish_stockings_all" ON fish_stockings FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DailyDeath
ALTER TABLE daily_deaths ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_deaths_all" ON daily_deaths FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- FeedRecord
ALTER TABLE feed_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "feed_records_all" ON feed_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DrugRecord
ALTER TABLE drug_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drug_records_all" ON drug_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- SaleRecord
ALTER TABLE sale_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sale_records_all" ON sale_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DrugInventory
ALTER TABLE drug_inventories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drug_inventories_all" ON drug_inventories FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DrugPurchase
ALTER TABLE drug_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drug_purchases_all" ON drug_purchases FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DrugSale
ALTER TABLE drug_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "drug_sales_all" ON drug_sales FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- Debt
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debts_all" ON debts FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- DebtPayment
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "debt_payments_all" ON debt_payments FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- WaterQualityRecord
ALTER TABLE water_quality_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "water_quality_records_all" ON water_quality_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- Attendance
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attendances_all" ON attendances FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- FieldTrack
ALTER TABLE field_tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "field_tracks_all" ON field_tracks FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- CustomerVisit
ALTER TABLE customer_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_visits_all" ON customer_visits FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- CommissionRecord
ALTER TABLE commission_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commission_records_all" ON commission_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- FinanceRecord
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_records_all" ON finance_records FOR ALL USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
) WITH CHECK (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);

-- ============ 平台级表(不隔离企业) ============

-- MarketPrice: 行情数据对所有认证用户可读
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_prices_select" ON market_prices FOR SELECT USING (true);
CREATE POLICY "market_prices_write" ON market_prices FOR INSERT WITH CHECK (
  public.current_role() = 'super_admin'
);
CREATE POLICY "market_prices_update" ON market_prices FOR UPDATE USING (
  public.current_role() = 'super_admin'
);

-- WaterQualityThreshold: 超管可读可写,企业只读
ALTER TABLE water_quality_thresholds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wqt_select" ON water_quality_thresholds FOR SELECT USING (true);
CREATE POLICY "wqt_write" ON water_quality_thresholds FOR ALL USING (
  public.current_role() = 'super_admin'
) WITH CHECK (
  public.current_role() = 'super_admin'
);

-- RolePermission: 仅超管
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "role_permissions_all" ON role_permissions FOR ALL USING (
  public.current_role() = 'super_admin'
) WITH CHECK (
  public.current_role() = 'super_admin'
);

-- AuditLog: 企业用户可看自己企业的,超管看全部
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT USING (
  public.current_role() = 'super_admin' OR enterprise_id = public.current_enterprise_id()
);
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (true);
