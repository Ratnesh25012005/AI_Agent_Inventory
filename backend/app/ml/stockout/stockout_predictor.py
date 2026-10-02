from typing import List, Dict, Any


def compute_stockout_risks(
    inventory_items: List[Dict[str, Any]],
    lead_time_default: float = 2.0
) -> List[Dict[str, Any]]:
    """
    Computes stockout probabilities, estimated hours to stockout, and risk levels.
    """
    risks = []
    for item in inventory_items:
        sku = item.get("sku")
        p_name = item.get("product_name", sku)
        stock = float(item.get("current_inventory", 0.0))
        daily_demand = float(item.get("predicted_demand", item.get("avg_daily_demand", 0.0)))
        incoming = float(item.get("incoming_inventory", 0.0))
        lead_time = float(item.get("lead_time_days", lead_time_default))

        hourly_burn = daily_demand / 24.0 if daily_demand > 0 else 0.0

        if hourly_burn > 0:
            hours_left = stock / hourly_burn
        else:
            hours_left = 999.0

        lead_time_hours = lead_time * 24.0

        # Calculate probability and risk level
        if stock <= 0:
            risk_level = "CRITICAL"
            prob = 1.0
            hours_left = 0.0
        elif hours_left <= (lead_time_hours * 0.5):
            risk_level = "CRITICAL"
            prob = 0.95
        elif hours_left <= lead_time_hours:
            risk_level = "HIGH"
            prob = 0.80
        elif hours_left <= (lead_time_hours * 2.0):
            risk_level = "MEDIUM"
            prob = 0.45
        else:
            risk_level = "LOW"
            prob = 0.10

        risks.append({
            "sku": sku,
            "product_name": p_name,
            "store_code": item.get("store_code", "MAIN"),
            "risk_level": risk_level,
            "stockout_probability": prob,
            "estimated_hours_until_stockout": round(hours_left, 1),
            "current_inventory": stock,
            "predicted_demand": daily_demand,
            "incoming_inventory": incoming,
            "lead_time_days": lead_time
        })

    # Sort critical first
    level_order = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
    risks.sort(key=lambda x: (level_order.get(x["risk_level"], 99), x["estimated_hours_until_stockout"]))
    return risks
