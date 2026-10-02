from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class ProductOut(BaseModel):
    sku: str
    product_name: str
    category: Optional[str] = "General"
    unit_price: Optional[float] = 0.0
    cost_price: Optional[float] = 0.0
    supplier_id: Optional[str] = None
    shelf_life_days: Optional[int] = None


class InventoryItemOut(BaseModel):
    sku: str
    product_name: str
    category: Optional[str] = "General"
    store_code: str = "MAIN"
    current_inventory: float
    available_inventory: float
    reserved_inventory: float = 0.0
    incoming_inventory: float = 0.0
    days_of_inventory: Optional[float] = None
    unit_price: Optional[float] = 0.0
    total_value: Optional[float] = 0.0


class InventoryOverviewOut(BaseModel):
    total_skus: int
    total_inventory_units: float
    total_inventory_value: float
    critical_stockout_count: int
    overstock_count: int
    anomaly_count: int
    expiry_risk_count: int
    pending_actions_count: int
    categories: List[Dict[str, Any]] = []
