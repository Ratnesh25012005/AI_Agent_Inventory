from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class ForecastItemOut(BaseModel):
    sku: str
    product_name: str
    store_code: str = "MAIN"
    horizon: str  # 24h, 48h, 7d
    predicted_demand: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None
    confidence_score: Optional[float] = 0.95
    historical_avg_daily: Optional[float] = None
    trend_direction: Optional[str] = "STABLE"  # UP, DOWN, STABLE
    generated_at: Optional[datetime] = None


class ForecastResponseOut(BaseModel):
    dataset_id: str
    horizon: str
    total_forecast_units: float
    items: List[ForecastItemOut]
