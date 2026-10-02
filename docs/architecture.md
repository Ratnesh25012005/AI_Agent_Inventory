# AI Inventory Decision Engine — Architecture

## 1. High-Level System Overview
The **AI Inventory Decision Engine** acts as an intelligence and decision layer on top of existing quick-commerce WMS/ERP platforms. It transforms raw inventory and sales data into explainable replenishment decisions and proactive stockout prevention.

```
                         USER
                          │
                          ▼
                  NEXT.JS FRONTEND (Port 3000)
                          │
                          ▼
                  FASTAPI API (Port 8000)
                          │
                          ▼
                 AI COPILOT / GEMINI
                          │
                          ▼
                   SUPERVISOR AGENT
                          │
             ┌────────────┼────────────┐
             ▼            ▼            ▼
        DATA AGENT   RISK AGENT   FORECAST & OPTIMIZATION AGENT
             │            │            │
             └────────────┼────────────┘
                          │
                          ▼
                  ANALYTICAL TOOLS
                          │
         ┌────────────────┼────────────────┐
         ▼                ▼                ▼
      DuckDB           ML Models       Optimization
     /PyArrow         LightGBM        /Business Rules
         │                │                │
         └────────────────┼────────────────┘
                          │
                          ▼
                  SUPABASE POSTGRESQL
                          │
                          ▼
                   ACTION HISTORY
```

## 2. Universal Data Ingestion & Canonical Schema
Any uploaded dataset (CSV, Excel, Parquet) with arbitrary naming (e.g. `item_code`, `available_qty`, `qty_sold`, `delivery_days`) is mapped to the platform's canonical schema:
- `sku`: Product SKU identifier
- `current_inventory`: Real-time on-hand stock
- `sales_quantity`: Historical transaction volume
- `lead_time`: Replenishment transit lead time in days
- `incoming_inventory`: Purchase orders in transit
- `expiry_date`: Best-before timestamps

## 3. Large Data Processing
- **DuckDB & PyArrow**: In-process SQL engine executing out-of-core aggregations without loading massive tables into Python RAM.
- **Parquet**: Columnar format used for disk-backed intermediate features.

## 4. Machine Learning & Optimization
- **Demand Forecasting**: LightGBM models producing 24h, 48h, and 7-day future demand curves.
- **Anomaly & Phantom Stock Detection**: Isolation Forest outlier detection paired with physical balance verification (`expected = opening + receipts - sales`).
- **Deterministic Replenishment Engine**:
  $$\text{Recommended Order} = \max(0, \text{Lead-Time Demand} + \text{Safety Stock} - \text{Usable Stock} - \text{Incoming Pipeline})$$
  Rounded by Supplier Minimum Order Quantity (MOQ) and Pack Sizes.

## 5. Security & Isolation
- **Row-Level Security (RLS)**: Enforced in Supabase PostgreSQL; users can never see another tenant's data.
- **Strict Server-Side Key Isolation**: `GEMINI_API_KEY` and `SUPABASE_SECRET_KEY` are strictly server-side and never exposed to the browser.
