-- 001_initial_schema.sql
-- AI Inventory Intelligence Platform Schema
-- Supports multi-tenant user isolation, datasets, schema mappings, canonical inventory data, ML predictions, and audit history.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users / Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    business_type TEXT DEFAULT 'Dark Store',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Datasets
CREATE TABLE IF NOT EXISTS public.datasets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'created', -- 'created', 'uploaded', 'mapped', 'processing', 'analyzed', 'error'
    quality_score NUMERIC(5,2),
    row_counts JSONB DEFAULT '{}'::jsonb,
    capabilities JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dataset Files
CREATE TABLE IF NOT EXISTS public.dataset_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL, -- 'csv', 'xlsx', 'parquet'
    file_size_bytes BIGINT,
    storage_path TEXT,
    detected_role TEXT, -- 'inventory', 'sales', 'products', 'suppliers', 'purchase_orders', 'inventory_movements'
    column_count INT,
    row_count BIGINT,
    sample_columns JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Schema Mappings
CREATE TABLE IF NOT EXISTS public.schema_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    file_id UUID REFERENCES public.dataset_files(id) ON DELETE SET NULL,
    user_id UUID NOT NULL,
    source_column TEXT NOT NULL,
    canonical_field TEXT NOT NULL,
    confidence TEXT DEFAULT 'HIGH', -- 'HIGH', 'MEDIUM', 'LOW'
    is_confirmed BOOLEAN DEFAULT false,
    data_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Data Quality Reports
CREATE TABLE IF NOT EXISTS public.data_quality_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    overall_score NUMERIC(5,2) NOT NULL,
    summary TEXT,
    checks JSONB NOT NULL DEFAULT '[]'::jsonb,
    warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    errors JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Canonical Products
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    unit_price NUMERIC(12,2),
    cost_price NUMERIC(12,2),
    supplier_id TEXT,
    shelf_life_days INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_product_sku UNIQUE (dataset_id, sku)
);

-- 7. Stores / Locations
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    store_code TEXT NOT NULL,
    store_name TEXT,
    location_type TEXT DEFAULT 'dark_store',
    city TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_store_code UNIQUE (dataset_id, store_code)
);

-- 8. Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    supplier_code TEXT NOT NULL,
    supplier_name TEXT NOT NULL,
    lead_time_days NUMERIC(6,2) DEFAULT 2.0,
    reliability_score NUMERIC(5,2) DEFAULT 0.95,
    min_order_quantity INT DEFAULT 1,
    pack_size INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_supplier_code UNIQUE (dataset_id, supplier_code)
);

-- 9. Canonical Current Inventory
CREATE TABLE IF NOT EXISTS public.inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    store_code TEXT NOT NULL DEFAULT 'MAIN',
    current_inventory NUMERIC(12,2) NOT NULL DEFAULT 0,
    available_inventory NUMERIC(12,2) DEFAULT 0,
    reserved_inventory NUMERIC(12,2) DEFAULT 0,
    incoming_inventory NUMERIC(12,2) DEFAULT 0,
    days_of_inventory NUMERIC(8,2),
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_inventory_sku_store UNIQUE (dataset_id, sku, store_code)
);

-- 10. Forecasts (Demand Forecasting via LightGBM)
CREATE TABLE IF NOT EXISTS public.forecasts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    store_code TEXT NOT NULL DEFAULT 'MAIN',
    horizon TEXT NOT NULL, -- '24h', '48h', '7d'
    predicted_demand NUMERIC(12,2) NOT NULL,
    lower_bound NUMERIC(12,2),
    upper_bound NUMERIC(12,2),
    confidence_score NUMERIC(5,2),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Stockout Predictions
CREATE TABLE IF NOT EXISTS public.stockout_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    store_code TEXT NOT NULL DEFAULT 'MAIN',
    stockout_probability NUMERIC(5,2),
    estimated_hours_until_stockout NUMERIC(8,2),
    risk_level TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    current_inventory NUMERIC(12,2) NOT NULL,
    predicted_demand NUMERIC(12,2) NOT NULL,
    incoming_inventory NUMERIC(12,2) DEFAULT 0,
    lead_time_days NUMERIC(6,2),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Inventory Anomalies (Isolation Forest & Phantom Stock)
CREATE TABLE IF NOT EXISTS public.inventory_anomalies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    store_code TEXT NOT NULL DEFAULT 'MAIN',
    anomaly_type TEXT NOT NULL, -- 'UNUSUAL_MOVEMENT', 'PHANTOM_INVENTORY', 'SPIKE', 'NEGATIVE_DRIFT'
    anomaly_score NUMERIC(6,4),
    severity TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    reason TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Expiry Risks
CREATE TABLE IF NOT EXISTS public.expiry_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    current_stock NUMERIC(12,2) NOT NULL,
    expiry_date DATE,
    days_until_expiry INT,
    predicted_demand_before_expiry NUMERIC(12,2),
    units_at_risk NUMERIC(12,2),
    risk_level TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    recommended_action TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Overstock Risks
CREATE TABLE IF NOT EXISTS public.overstock_risks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT,
    current_inventory NUMERIC(12,2) NOT NULL,
    avg_daily_demand NUMERIC(12,2) NOT NULL,
    days_of_inventory NUMERIC(8,2) NOT NULL,
    excess_quantity NUMERIC(12,2),
    holding_cost_impact NUMERIC(12,2),
    severity TEXT NOT NULL, -- 'HIGH', 'MEDIUM', 'LOW'
    recommendation TEXT,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Replenishment Recommendations (Deterministic Optimization Engine)
CREATE TABLE IF NOT EXISTS public.replenishment_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    category TEXT,
    store_code TEXT NOT NULL DEFAULT 'MAIN',
    current_stock NUMERIC(12,2) NOT NULL,
    predicted_demand NUMERIC(12,2) NOT NULL,
    safety_stock NUMERIC(12,2) NOT NULL,
    lead_time_demand NUMERIC(12,2) NOT NULL,
    incoming_stock NUMERIC(12,2) NOT NULL DEFAULT 0,
    recommended_order NUMERIC(12,2) NOT NULL,
    supplier_name TEXT,
    supplier_code TEXT,
    lead_time_days NUMERIC(6,2),
    min_order_quantity INT DEFAULT 1,
    pack_size INT DEFAULT 1,
    priority_rank INT NOT NULL,
    priority_level TEXT NOT NULL, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Action Queue (Ranked prioritized action list)
CREATE TABLE IF NOT EXISTS public.action_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    recommendation_id UUID REFERENCES public.replenishment_recommendations(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'ORDER', 'CYCLE_COUNT', 'MARKDOWN', 'EXPIRY_DISPATCH', 'TRANSFER'
    recommended_quantity NUMERIC(12,2),
    priority_rank INT NOT NULL,
    priority_level TEXT NOT NULL,
    deadline_hours NUMERIC(8,2),
    title TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'COMPLETED', 'DISMISSED'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Action History / Audit Log
CREATE TABLE IF NOT EXISTS public.action_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID NOT NULL REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    recommendation_id UUID REFERENCES public.replenishment_recommendations(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- 'APPROVE', 'REJECT', 'MODIFY', 'DISMISS'
    sku TEXT NOT NULL,
    product_name TEXT,
    original_quantity NUMERIC(12,2),
    approved_quantity NUMERIC(12,2),
    reason TEXT,
    performed_by TEXT DEFAULT 'Human Operator',
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Copilot Conversations & Messages
CREATE TABLE IF NOT EXISTS public.copilot_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role TEXT NOT NULL, -- 'user', 'assistant', 'tool'
    content TEXT NOT NULL,
    tool_calls JSONB DEFAULT '[]'::jsonb,
    tool_results JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dataset_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schema_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_quality_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stockout_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expiry_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overstock_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replenishment_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

-- Standard RLS Policies: users can only see & operate on their own user_id
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN (
            'profiles', 'datasets', 'dataset_files', 'schema_mappings', 'data_quality_reports',
            'products', 'stores', 'suppliers', 'inventory', 'forecasts',
            'stockout_predictions', 'inventory_anomalies', 'expiry_risks', 'overstock_risks',
            'replenishment_recommendations', 'action_queue', 'action_history', 'copilot_messages'
          )
    LOOP
        EXECUTE format('
            DROP POLICY IF EXISTS %I_user_isolation_policy ON public.%I;
            CREATE POLICY %I_user_isolation_policy ON public.%I
                FOR ALL
                USING (user_id = auth.uid() OR auth.role() = ''service_role'')
                WITH CHECK (user_id = auth.uid() OR auth.role() = ''service_role'');
        ', tbl, tbl, tbl, tbl);
    END LOOP;
END $$;

-- Indexes for high-speed analytical queries
CREATE INDEX IF NOT EXISTS idx_datasets_user ON public.datasets(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_dataset_sku ON public.inventory(dataset_id, sku);
CREATE INDEX IF NOT EXISTS idx_recommendations_dataset ON public.replenishment_recommendations(dataset_id, priority_rank);
CREATE INDEX IF NOT EXISTS idx_stockout_dataset ON public.stockout_predictions(dataset_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_anomalies_dataset ON public.inventory_anomalies(dataset_id, severity);
CREATE INDEX IF NOT EXISTS idx_action_queue_dataset ON public.action_queue(dataset_id, priority_rank);
CREATE INDEX IF NOT EXISTS idx_action_history_dataset ON public.action_history(dataset_id, timestamp DESC);
