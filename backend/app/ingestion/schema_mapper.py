import re
from typing import Dict, List, Tuple, Any

CANONICAL_FIELDS = {
    "sku": {
        "description": "Unique product SKU or identifier",
        "aliases": ["sku", "item_code", "product_code", "product_id", "item_id", "code", "barcode", "upc"],
        "required_for": ["inventory", "sales", "products"]
    },
    "product_name": {
        "description": "Product display name / title",
        "aliases": ["product_name", "item_name", "title", "description", "product_title", "name", "item_desc"],
        "required_for": ["products"]
    },
    "category": {
        "description": "Product department or merchandise category",
        "aliases": ["category", "cat", "department", "dept", "product_category", "group", "family"],
        "required_for": []
    },
    "store_id": {
        "description": "Store or dark store location code",
        "aliases": ["store_id", "store_code", "store", "dark_store", "location", "facility_id", "branch"],
        "required_for": []
    },
    "warehouse_id": {
        "description": "Warehouse or fulfillment center code",
        "aliases": ["warehouse_id", "warehouse", "wh_code", "hub", "dc_code", "fulfillment_center"],
        "required_for": []
    },
    "timestamp": {
        "description": "Date and time of transaction or record",
        "aliases": ["timestamp", "date", "created_at", "order_date", "sale_date", "movement_date", "datetime", "time"],
        "required_for": ["sales", "inventory_movements"]
    },
    "current_inventory": {
        "description": "Current on-hand or available physical inventory count",
        "aliases": ["current_inventory", "stock_on_hand", "on_hand", "available_qty", "qty_on_hand", "inventory", "stock", "quantity_available"],
        "required_for": ["inventory"]
    },
    "available_inventory": {
        "description": "Inventory physically available for order fulfillment",
        "aliases": ["available_inventory", "usable_stock", "free_stock", "allocatable_qty"],
        "required_for": []
    },
    "reserved_inventory": {
        "description": "Inventory reserved for open customer orders",
        "aliases": ["reserved_inventory", "allocated_qty", "reserved_stock", "held_inventory"],
        "required_for": []
    },
    "incoming_inventory": {
        "description": "Quantity currently in transit or on open purchase orders",
        "aliases": ["incoming_inventory", "in_transit", "on_order", "po_quantity", "incoming_stock", "pipeline_stock"],
        "required_for": []
    },
    "sales_quantity": {
        "description": "Units sold in transaction",
        "aliases": ["sales_quantity", "qty_sold", "units_sold", "quantity", "sold_qty", "items_sold", "sale_units"],
        "required_for": ["sales"]
    },
    "sales_value": {
        "description": "Monetary value of sales transaction",
        "aliases": ["sales_value", "total_price", "revenue", "order_amount", "amount", "sale_amount"],
        "required_for": []
    },
    "unit_price": {
        "description": "Retail price per product unit",
        "aliases": ["unit_price", "retail_price", "selling_price", "mrp", "price"],
        "required_for": []
    },
    "cost": {
        "description": "Cost or procurement price per unit",
        "aliases": ["cost", "cost_price", "unit_cost", "purchase_price", "cogs"],
        "required_for": []
    },
    "supplier_id": {
        "description": "Supplier or vendor unique code",
        "aliases": ["supplier_id", "supplier_code", "vendor_id", "vendor_code", "supplier", "vendor"],
        "required_for": ["suppliers"]
    },
    "supplier_name": {
        "description": "Supplier or vendor company name",
        "aliases": ["supplier_name", "vendor_name", "distributor", "company_name"],
        "required_for": []
    },
    "lead_time": {
        "description": "Replenishment lead time from supplier in days",
        "aliases": ["lead_time", "lead_time_days", "delivery_days", "supplier_lead_time", "fulfillment_days"],
        "required_for": []
    },
    "expiry_date": {
        "description": "Batch expiration or best-before date",
        "aliases": ["expiry_date", "expiration_date", "exp_date", "best_before", "shelf_life_date"],
        "required_for": []
    },
    "inventory_movement_type": {
        "description": "Type of stock movement (sale, return, restock, damage, loss)",
        "aliases": ["inventory_movement_type", "movement_type", "transaction_type", "type", "reason_code"],
        "required_for": ["inventory_movements"]
    },
    "daily_demand": {
        "description": "Average daily sales demand or forecasted burn rate",
        "aliases": ["daily_demand", "demand", "avg_daily_demand", "daily_sales", "burn_rate", "sales_per_day"],
        "required_for": []
    },
    "expected_inventory": {
        "description": "Expected book stock or ERP physical balance count",
        "aliases": ["expected_inventory", "book_inventory", "book_stock", "system_inventory", "system_stock", "expected_stock"],
        "required_for": []
    },
    "min_order_quantity": {
        "description": "Supplier minimum order quantity constraint (MOQ)",
        "aliases": ["min_order_quantity", "moq", "minimum_order_quantity", "min_order", "min_order_qty"],
        "required_for": []
    },
    "pack_size": {
        "description": "Packaging case pack size multiplier",
        "aliases": ["pack_size", "case_size", "pack_qty", "package_size", "pack"],
        "required_for": []
    }
}


def normalize_col_name(col: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", col.strip().lower())
    return cleaned.strip("_")


def map_column(source_col: str, sample_values: List[Any] = None) -> Tuple[str, str]:
    """
    Intelligently maps an uploaded column name to the canonical schema.
    Returns (canonical_field, confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNMAPPED').
    """
    norm = normalize_col_name(source_col)

    # 1. Exact match with canonical field
    if norm in CANONICAL_FIELDS:
        return norm, "HIGH"

    # 2. Check aliases
    for canonical, meta in CANONICAL_FIELDS.items():
        if norm in meta["aliases"]:
            return canonical, "HIGH"

    # 3. Partial / substring heuristic matching
    for canonical, meta in CANONICAL_FIELDS.items():
        for alias in meta["aliases"]:
            if (len(alias) > 3 and alias in norm) or (len(norm) > 3 and norm in alias):
                return canonical, "MEDIUM"

    return "unmapped", "LOW"


def infer_dataset_role(filename: str, columns: List[str]) -> str:
    """
    Infers the role of the dataset file:
    'inventory', 'sales', 'products', 'suppliers', 'purchase_orders', 'inventory_movements', 'unknown'
    """
    name_lower = filename.lower()
    cols_norm = [normalize_col_name(c) for c in columns]

    if "inventory_movement" in name_lower or "movement" in name_lower:
        return "inventory_movements"
    if "sale" in name_lower or "transaction" in name_lower:
        return "sales"
    if "inventory" in name_lower or "stock" in name_lower:
        return "inventory"
    if "product" in name_lower or "item" in name_lower:
        return "products"
    if "supplier" in name_lower or "vendor" in name_lower:
        return "suppliers"
    if "purchase" in name_lower or "po" in name_lower or "order" in name_lower:
        return "purchase_orders"

    # Fallback to column composition
    if any(c in cols_norm for c in ["sales_quantity", "qty_sold", "units_sold"]):
        return "sales"
    if any(c in cols_norm for c in ["stock_on_hand", "available_qty", "current_inventory"]):
        return "inventory"
    if any(c in cols_norm for c in ["lead_time", "vendor_name", "supplier_name"]):
        return "suppliers"
    if any(c in cols_norm for c in ["expiry_date", "shelf_life", "category"]):
        return "products"

    return "unknown"
