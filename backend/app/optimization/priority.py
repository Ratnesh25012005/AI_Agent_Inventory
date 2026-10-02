from typing import List, Dict, Any
from app.schemas.recommendation import ReplenishmentRecommendationOut, ActionQueueItemOut


def rank_action_queue(
    recommendations: List[Dict[str, Any]],
    anomalies: List[Dict[str, Any]] = [],
    expiry_risks: List[Dict[str, Any]] = [],
    overstocks: List[Dict[str, Any]] = []
) -> List[Dict[str, Any]]:
    """
    Ranks cross-functional inventory actions into the unified AI Action Queue.
    Combines urgent orders, anomaly audits, expiry dispatches, and overstock reductions.
    """
    queue: List[Dict[str, Any]] = []

    # 1. Orders
    for r in recommendations:
        if r.get("recommended_order", 0) > 0:
            p_level = r.get("priority_level", "MEDIUM")
            deadline = 4.0 if p_level == "CRITICAL" else (12.0 if p_level == "HIGH" else 24.0)
            queue.append({
                "recommendation_id": r.get("id"),
                "sku": r.get("sku"),
                "product_name": r.get("product_name"),
                "action_type": "ORDER",
                "recommended_quantity": r.get("recommended_order"),
                "priority_level": p_level,
                "priority_rank": 1 if p_level == "CRITICAL" else (2 if p_level == "HIGH" else 3),
                "deadline_hours": deadline,
                "title": f"Place Purchase Order: {r.get('product_name')} ({r.get('recommended_order'):.0f} units)",
                "reason": r.get("reason"),
                "status": "OPEN"
            })

    # 2. Expiry Risks
    for ex in expiry_risks:
        if ex.get("units_at_risk", 0) > 0 and ex.get("risk_level") in ("CRITICAL", "HIGH"):
            queue.append({
                "sku": ex.get("sku"),
                "product_name": ex.get("product_name"),
                "action_type": "EXPIRY_DISPATCH",
                "recommended_quantity": ex.get("units_at_risk"),
                "priority_level": ex.get("risk_level"),
                "priority_rank": 1 if ex.get("risk_level") == "CRITICAL" else 2,
                "deadline_hours": 6.0,
                "title": f"Prioritize Picking / Markdown: {ex.get('product_name')}",
                "reason": ex.get("recommended_action") or "Units expiring before forecasted demand window.",
                "status": "OPEN"
            })

    # 3. Phantom / Anomalies
    for an in anomalies:
        if an.get("severity") in ("CRITICAL", "HIGH"):
            queue.append({
                "sku": an.get("sku"),
                "product_name": an.get("product_name"),
                "action_type": "CYCLE_COUNT",
                "recommended_quantity": 0,
                "priority_level": an.get("severity"),
                "priority_rank": 2,
                "deadline_hours": 8.0,
                "title": f"Physical Cycle Count Required: {an.get('product_name')}",
                "reason": f"Anomaly detected: {an.get('reason')}",
                "status": "OPEN"
            })

    # Sort queue by priority rank (1: Critical, 2: High, 3: Medium, 4: Low)
    priority_order = {"CRITICAL": 1, "HIGH": 2, "MEDIUM": 3, "LOW": 4}
    queue.sort(key=lambda x: priority_order.get(x["priority_level"], 99))

    # Re-assign sequential rank index
    for idx, item in enumerate(queue, 1):
        item["priority_rank"] = idx

    return queue
