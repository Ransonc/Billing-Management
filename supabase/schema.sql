-- 水产养殖经营管理平台 - PostgreSQL 建表脚本
-- 按依赖顺序排列（FK 依赖的表先创建）

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============ 平台基础表（无 FK 依赖） ============

CREATE TABLE enterprises (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name         TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    status       TEXT NOT NULL DEFAULT 'active',
    subscription TEXT NOT NULL DEFAULT 'free',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE role_permissions (
    id        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    role      TEXT NOT NULL,
    module    TEXT NOT NULL,
    can_read  BOOLEAN NOT NULL DEFAULT false,
    can_create BOOLEAN NOT NULL DEFAULT false,
    can_update BOOLEAN NOT NULL DEFAULT false,
    can_delete BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (role, module)
);

CREATE TABLE water_quality_thresholds (
    id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    indicator   TEXT NOT NULL,
    min_value   NUMERIC(18,4) NOT NULL,
    max_value   NUMERIC(18,4) NOT NULL,
    warning_min NUMERIC(18,4),
    warning_max NUMERIC(18,4),
    description TEXT,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE commission_rules (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT REFERENCES enterprises(id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    drug_id      TEXT,
    min_amount   NUMERIC(18,4),
    max_amount   NUMERIC(18,4),
    rate         NUMERIC(18,4) NOT NULL,
    is_default   BOOLEAN NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commission_rules_enterprise ON commission_rules(enterprise_id);

CREATE TABLE market_prices (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    species        TEXT NOT NULL,
    specification  TEXT,
    min_price      NUMERIC(18,4),
    max_price      NUMERIC(18,4),
    avg_price      NUMERIC(18,4),
    price_date     TIMESTAMPTZ NOT NULL,
    source         TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_market_prices_species ON market_prices(species);
CREATE INDEX idx_market_prices_price_date ON market_prices(price_date);

CREATE TABLE market_subscriptions (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id      TEXT NOT NULL UNIQUE,
    enterprise_id TEXT REFERENCES enterprises(id) ON DELETE SET NULL,
    plan         TEXT NOT NULL,
    start_date   TIMESTAMPTZ NOT NULL,
    end_date     TIMESTAMPTZ NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
    id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id      TEXT,
    user_email   TEXT,
    enterprise_id TEXT,
    action       TEXT NOT NULL,
    module       TEXT NOT NULL,
    target_id    TEXT,
    target_type  TEXT,
    old_value    JSONB,
    new_value    JSONB,
    ip_address   TEXT,
    user_agent   TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_logs_enterprise ON audit_logs(enterprise_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============ 用户与租户用户 ============

CREATE TABLE users (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email         TEXT NOT NULL UNIQUE,
    phone         TEXT,
    name          TEXT NOT NULL,
    role          TEXT NOT NULL,
    enterprise_id TEXT REFERENCES enterprises(id) ON DELETE SET NULL,
    employee_id   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_enterprise ON users(enterprise_id);
CREATE INDEX idx_users_role ON users(role);

-- ============ 客户与鱼塘 ============

CREATE TABLE customers (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    phone         TEXT,
    address       TEXT,
    contact_person TEXT,
    status        TEXT NOT NULL DEFAULT 'active',
    notes         TEXT,
    created_by_id TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customers_enterprise ON customers(enterprise_id);

CREATE TABLE fish_ponds (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    customer_id   TEXT REFERENCES customers(id) ON DELETE SET NULL,
    name          TEXT NOT NULL,
    area          NUMERIC(18,4),
    water_depth   NUMERIC(18,4),
    fish_species  TEXT,
    stock_date    TIMESTAMPTZ,
    stock_quantity INTEGER,
    stock_weight  NUMERIC(18,4),
    status        TEXT NOT NULL DEFAULT 'active',
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fish_ponds_enterprise ON fish_ponds(enterprise_id);
CREATE INDEX idx_fish_ponds_customer ON fish_ponds(customer_id);

CREATE TABLE fish_stockings (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id  TEXT NOT NULL REFERENCES fish_ponds(id) ON DELETE CASCADE,
    fish_species  TEXT NOT NULL,
    quantity      INTEGER NOT NULL,
    weight        NUMERIC(18,4),
    unit_price    NUMERIC(18,4),
    total_cost    NUMERIC(18,4),
    stock_date    TIMESTAMPTZ NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fish_stockings_enterprise ON fish_stockings(enterprise_id);
CREATE INDEX idx_fish_stockings_pond ON fish_stockings(fish_pond_id);

-- ============ 养殖台账 ============

CREATE TABLE daily_deaths (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id  TEXT NOT NULL REFERENCES fish_ponds(id) ON DELETE CASCADE,
    death_date    TIMESTAMPTZ NOT NULL,
    quantity      INTEGER NOT NULL,
    reason        TEXT,
    notes         TEXT,
    attachment_url TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_daily_deaths_enterprise ON daily_deaths(enterprise_id);
CREATE INDEX idx_daily_deaths_pond ON daily_deaths(fish_pond_id);
CREATE INDEX idx_daily_deaths_date ON daily_deaths(death_date);

CREATE TABLE feed_records (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id  TEXT NOT NULL REFERENCES fish_ponds(id) ON DELETE CASCADE,
    brand         TEXT NOT NULL,
    model         TEXT,
    bags          INTEGER NOT NULL,
    unit_price    NUMERIC(18,4),
    total_cost    NUMERIC(18,4),
    feed_date     TIMESTAMPTZ NOT NULL,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_feed_records_enterprise ON feed_records(enterprise_id);
CREATE INDEX idx_feed_records_pond ON feed_records(fish_pond_id);

CREATE TABLE drug_records (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id  TEXT NOT NULL REFERENCES fish_ponds(id) ON DELETE CASCADE,
    drug_name     TEXT NOT NULL,
    drug_id       TEXT,
    quantity      NUMERIC(18,4) NOT NULL,
    cost          NUMERIC(18,4),
    start_date    TIMESTAMPTZ NOT NULL,
    end_date      TIMESTAMPTZ,
    period_days   INTEGER,
    reason        TEXT,
    operator_id   TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drug_records_enterprise ON drug_records(enterprise_id);
CREATE INDEX idx_drug_records_pond ON drug_records(fish_pond_id);

CREATE TABLE sale_records (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id  TEXT NOT NULL REFERENCES fish_ponds(id) ON DELETE CASCADE,
    fish_species  TEXT NOT NULL,
    quantity      INTEGER NOT NULL,
    weight        NUMERIC(18,4) NOT NULL,
    unit_price    NUMERIC(18,4) NOT NULL,
    total_amount  NUMERIC(18,4) NOT NULL,
    sale_date     TIMESTAMPTZ NOT NULL,
    buyer_name    TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sale_records_enterprise ON sale_records(enterprise_id);
CREATE INDEX idx_sale_records_pond ON sale_records(fish_pond_id);
CREATE INDEX idx_sale_records_date ON sale_records(sale_date);

-- ============ 药品进销存 ============

CREATE TABLE drug_inventories (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id  TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    specification  TEXT,
    unit           TEXT NOT NULL,
    supplier       TEXT,
    purchase_price NUMERIC(18,4),
    sale_price     NUMERIC(18,4),
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    safety_stock   INTEGER NOT NULL DEFAULT 0,
    status         TEXT NOT NULL DEFAULT 'active',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drug_inventories_enterprise ON drug_inventories(enterprise_id);

CREATE TABLE drug_purchases (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    drug_id       TEXT NOT NULL REFERENCES drug_inventories(id) ON DELETE CASCADE,
    supplier      TEXT NOT NULL,
    quantity      INTEGER NOT NULL,
    unit_price    NUMERIC(18,4) NOT NULL,
    total_cost    NUMERIC(18,4) NOT NULL,
    purchase_date TIMESTAMPTZ NOT NULL,
    operator_id   TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drug_purchases_enterprise ON drug_purchases(enterprise_id);

CREATE TABLE drug_sales (
    id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id  TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    drug_id        TEXT NOT NULL REFERENCES drug_inventories(id) ON DELETE CASCADE,
    customer_id    TEXT REFERENCES customers(id) ON DELETE SET NULL,
    fish_pond_id   TEXT REFERENCES fish_ponds(id) ON DELETE SET NULL,
    quantity       INTEGER NOT NULL,
    unit_price     NUMERIC(18,4) NOT NULL,
    total_amount   NUMERIC(18,4) NOT NULL,
    paid_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
    debt_amount    NUMERIC(18,4) NOT NULL DEFAULT 0,
    payment_status TEXT NOT NULL DEFAULT 'unpaid',
    sale_date      TIMESTAMPTZ NOT NULL,
    operator_id    TEXT,
    notes          TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_drug_sales_enterprise ON drug_sales(enterprise_id);
CREATE INDEX idx_drug_sales_customer ON drug_sales(customer_id);
CREATE INDEX idx_drug_sales_date ON drug_sales(sale_date);

-- ============ 欠款与回款 ============

CREATE TABLE debts (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id    TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    customer_id      TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    total_amount     NUMERIC(18,4) NOT NULL,
    paid_amount      NUMERIC(18,4) NOT NULL DEFAULT 0,
    remaining_amount NUMERIC(18,4) NOT NULL,
    status           TEXT NOT NULL DEFAULT 'pending',
    sign_image_url   TEXT,
    sign_date        TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_debts_enterprise ON debts(enterprise_id);
CREATE INDEX idx_debts_customer ON debts(customer_id);

CREATE TABLE debt_payments (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    debt_id       TEXT NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount        NUMERIC(18,4) NOT NULL,
    payment_date  TIMESTAMPTZ NOT NULL,
    payment_method TEXT,
    operator_id   TEXT,
    notes         TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_debt_payments_enterprise ON debt_payments(enterprise_id);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);

-- ============ 水质检测 ============

CREATE TABLE water_quality_records (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id    TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    fish_pond_id     TEXT REFERENCES fish_ponds(id) ON DELETE SET NULL,
    record_date      TIMESTAMPTZ NOT NULL,
    temperature      NUMERIC(18,4),
    ph               NUMERIC(18,4),
    dissolved_oxygen NUMERIC(18,4),
    ammonia          NUMERIC(18,4),
    nitrite          NUMERIC(18,4),
    source           TEXT,
    abnormal         BOOLEAN NOT NULL DEFAULT false,
    abnormal_details TEXT,
    operator_id      TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_wqr_enterprise ON water_quality_records(enterprise_id);
CREATE INDEX idx_wqr_pond ON water_quality_records(fish_pond_id);
CREATE INDEX idx_wqr_date ON water_quality_records(record_date);

-- ============ 员工考勤外勤 ============

CREATE TABLE attendances (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL,
    check_in_time TIMESTAMPTZ NOT NULL,
    check_out_time TIMESTAMPTZ,
    check_in_lat  NUMERIC(18,4),
    check_in_lng  NUMERIC(18,4),
    check_in_addr TEXT,
    check_out_lat NUMERIC(18,4),
    check_out_lng NUMERIC(18,4),
    check_out_addr TEXT,
    status        TEXT NOT NULL DEFAULT 'normal',
    date          TIMESTAMPTZ NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_attendances_enterprise ON attendances(enterprise_id);
CREATE INDEX idx_attendances_user ON attendances(user_id);
CREATE INDEX idx_attendances_date ON attendances(date);

CREATE TABLE field_tracks (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL,
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ,
    duration      INTEGER,
    status        TEXT NOT NULL DEFAULT 'active',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_field_tracks_enterprise ON field_tracks(enterprise_id);
CREATE INDEX idx_field_tracks_user ON field_tracks(user_id);

CREATE TABLE field_track_points (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    field_track_id TEXT NOT NULL REFERENCES field_tracks(id) ON DELETE CASCADE,
    latitude      NUMERIC(18,4) NOT NULL,
    longitude     NUMERIC(18,4) NOT NULL,
    timestamp     TIMESTAMPTZ NOT NULL,
    accuracy      NUMERIC(18,4)
);
CREATE INDEX idx_ftp_track ON field_track_points(field_track_id);

CREATE TABLE customer_visits (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id       TEXT NOT NULL,
    customer_id   TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    start_time    TIMESTAMPTZ NOT NULL,
    end_time      TIMESTAMPTZ,
    purpose       TEXT NOT NULL,
    result        TEXT,
    follow_up     TEXT,
    next_follow_up TIMESTAMPTZ,
    latitude      NUMERIC(18,4),
    longitude     NUMERIC(18,4),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_customer_visits_enterprise ON customer_visits(enterprise_id);
CREATE INDEX idx_customer_visits_user ON customer_visits(user_id);
CREATE INDEX idx_customer_visits_customer ON customer_visits(customer_id);

-- ============ 员工提成 ============

CREATE TABLE commission_records (
    id               TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id    TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    user_id          TEXT NOT NULL,
    period_month     TEXT NOT NULL,
    sales_amount     NUMERIC(18,4) NOT NULL DEFAULT 0,
    commission_rate  NUMERIC(18,4),
    commission_amount NUMERIC(18,4) NOT NULL DEFAULT 0,
    status           TEXT NOT NULL DEFAULT 'pending',
    confirmed_at     TIMESTAMPTZ,
    paid_at          TIMESTAMPTZ,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (enterprise_id, user_id, period_month)
);
CREATE INDEX idx_commission_records_enterprise ON commission_records(enterprise_id);
CREATE INDEX idx_commission_records_user ON commission_records(user_id);
CREATE INDEX idx_commission_records_period ON commission_records(period_month);

-- ============ 财务 ============

CREATE TABLE finance_records (
    id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    enterprise_id TEXT NOT NULL REFERENCES enterprises(id) ON DELETE CASCADE,
    type          TEXT NOT NULL,
    category      TEXT NOT NULL,
    amount        NUMERIC(18,4) NOT NULL,
    description   TEXT,
    record_date   TIMESTAMPTZ NOT NULL,
    related_id    TEXT,
    related_type  TEXT,
    operator_id   TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_finance_records_enterprise ON finance_records(enterprise_id);
CREATE INDEX idx_finance_records_type ON finance_records(type);
CREATE INDEX idx_finance_records_category ON finance_records(category);
CREATE INDEX idx_finance_records_date ON finance_records(record_date);

-- ============ 暴露给 Data API 的权限 ============

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
