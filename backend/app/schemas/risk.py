from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime, date


class StockoutRiskOut(BaseModel):
    id: Optional[str] = None
    sku: str
    product_name: str
    store_code: str = "MAIN"
    risk_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    stockout_probability: float
    estimated_hours_until_stockout: Optional[float] = None
    current_inventory: float
    predicted_demand: float
    incoming_inventory: float = 0.0
    lead_time_days: Optional[float] = 2.0


class AnomalyItemOut(BaseModel):
    id: Optional[str] = None
    sku: str
    product_name: str
    store_code: str = "MAIN"
    anomaly_type: str  # UNUSUAL_MOVEMENT, PHANTOM_INVENTORY, SPIKE, DRIFT
    anomaly_score: float
    severity: str  # CRITICAL, HIGH, MEDIUM, LOW
    reason: str
    details: Dict[str, Any] = {}
    detected_at: Optional[datetime] = None


class ExpiryRiskOut(BaseModel):
    id: Optional[str] = None
    sku: str
    product_name: str
    current_stock: float
    expiry_date: Optional[str] = None
    days_until_expiry: Optional[int] = None
    predicted_demand_before_expiry: Optional[float] = None
    units_at_risk: float
    risk_level: str
    recommended_action: str


class OverstockRiskOut(BaseModel):
    id: Optional[str] = None
    sku: str
    product_name: str
    current_inventory: float
    avg_daily_demand: float
    days_of_inventory: float
    excess_quantity: float
    holding_cost_impact: Optional[float] = 0.0
    severity: str
    recommendation: str
