import math
from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class ReplenishmentCalculation(BaseModel):
    sku: str
    product_name: str
    current_stock: float
    predicted_demand: float
    safety_stock: float
    lead_time_demand: float
    incoming_stock: float
    recommended_order: float
    pack_size: int = 1
    min_order_quantity: int = 1
    priority_level: str
    reason: str


def compute_replenishment(
    sku: str,
    product_name: str,
    current_inventory: float,
    daily_forecast: float,
    lead_time_days: float = 2.0,
    incoming_stock: float = 0.0,
    demand_std_dev: float = 0.0,
    min_order_quantity: int = 1,
    pack_size: int = 1,
    service_level_z: float = 1.65  # 95% cycle service level
) -> ReplenishmentCalculation:
    """
    Deterministic inventory replenishment optimization calculation.
    
    Formula:
    1. Lead Time Demand (LTD) = daily_forecast * lead_time_days
    2. Safety Stock (SS) = z * sqrt(lead_time_days) * demand_std_dev
       (or rule-of-thumb: 0.5 * LTD if std_dev is 0)
    3. Target Net Stock = LTD + SS
    4. Gross Need = Target Net Stock - current_inventory - incoming_stock
    5. Apply MOQ & Pack Size rounding
    """
    ltd = max(0.0, daily_forecast * lead_time_days)
    
    if demand_std_dev > 0:
        safety_stock = round(service_level_z * math.sqrt(lead_time_days) * demand_std_dev, 2)
    else:
        safety_stock = round(max(5.0, 0.4 * ltd), 2)

    gross_need = (ltd + safety_stock) - (current_inventory + incoming_stock)

    if gross_need <= 0:
        recommended_order = 0.0
        priority_level = "LOW"
        reason = f"Current inventory ({current_inventory:.0f}) and pipeline ({incoming_stock:.0f}) safely exceed projected lead-time demand ({ltd:.1f}) + safety stock ({safety_stock:.1f})."
    else:
        # Enforce MOQ and Pack Size
        raw_order = max(gross_need, float(min_order_quantity))
        if pack_size > 1:
            recommended_order = math.ceil(raw_order / pack_size) * pack_size
        else:
            recommended_order = math.ceil(raw_order)

        # Priority calculation
        stock_coverage_days = current_inventory / max(daily_forecast, 0.1)
        if stock_coverage_days < (lead_time_days * 0.5):
            priority_level = "CRITICAL"
            reason = f"Projected demand ({daily_forecast:.1f}/day) causes stockout in {stock_coverage_days*24:.1f} hours before delivery ({lead_time_days}d lead time). Order {recommended_order:.0f} units immediately."
        elif stock_coverage_days <= lead_time_days:
            priority_level = "HIGH"
            reason = f"Inventory will be exhausted during supplier lead time ({lead_time_days} days). Replenishment of {recommended_order:.0f} units required."
        elif stock_coverage_days <= (lead_time_days + (safety_stock / max(daily_forecast, 0.1))):
            priority_level = "MEDIUM"
            reason = f"Inventory entering safety stock buffer. Order {recommended_order:.0f} units to maintain service level target."
        else:
            priority_level = "LOW"
            reason = f"Proactive replenishment of {recommended_order:.0f} units to balance inventory target."

    return ReplenishmentCalculation(
        sku=sku,
        product_name=product_name,
        current_stock=current_inventory,
        predicted_demand=daily_forecast,
        safety_stock=safety_stock,
        lead_time_demand=round(ltd, 2),
        incoming_stock=incoming_stock,
        recommended_order=recommended_order,
        pack_size=pack_size,
        min_order_quantity=min_order_quantity,
        priority_level=priority_level,
        reason=reason
    )
