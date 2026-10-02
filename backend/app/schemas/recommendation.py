from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class ReplenishmentRecommendationOut(BaseModel):
    id: str
    dataset_id: str
    sku: str
    product_name: str
    category: Optional[str] = "General"
    store_code: str = "MAIN"
    current_stock: float
    predicted_demand: float
    safety_stock: float
    lead_time_demand: float
    incoming_stock: float = 0.0
    recommended_order: float
    supplier_name: Optional[str] = None
    supplier_code: Optional[str] = None
    lead_time_days: Optional[float] = 2.0
    min_order_quantity: int = 1
    pack_size: int = 1
    priority_rank: int
    priority_level: str  # CRITICAL, HIGH, MEDIUM, LOW
    reason: str
    status: str = "PENDING"  # PENDING, APPROVED, REJECTED
    generated_at: Optional[datetime] = None


class ActionDecisionRequest(BaseModel):
    action: str = "APPROVE"  # APPROVE, REJECT, MODIFY
    approved_quantity: Optional[float] = None
    reason: Optional[str] = None


class ActionQueueItemOut(BaseModel):
    id: str
    recommendation_id: Optional[str] = None
    sku: str
    product_name: str
    action_type: str  # ORDER, CYCLE_COUNT, MARKDOWN, EXPIRY_DISPATCH
    recommended_quantity: float
    priority_rank: int
    priority_level: str
    deadline_hours: Optional[float] = None
    title: str
    reason: str
    status: str = "OPEN"


class ActionHistoryItemOut(BaseModel):
    id: str
    dataset_id: str
    recommendation_id: Optional[str] = None
    action: str
    sku: str
    product_name: Optional[str] = None
    original_quantity: Optional[float] = None
    approved_quantity: Optional[float] = None
    reason: Optional[str] = None
    performed_by: Optional[str] = "Human Operator"
    timestamp: datetime
