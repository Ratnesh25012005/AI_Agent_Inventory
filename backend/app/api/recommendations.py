from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.db.repositories.inventory_repository import InventoryRepository

router = APIRouter(prefix="", tags=["Recommendations & Approvals"])


class DecisionPayload(BaseModel):
    action: str = "APPROVE"  # APPROVE, REJECT, MODIFY
    approved_quantity: Optional[float] = None
    reason: Optional[str] = None


@router.get("/datasets/{dataset_id}/replenishment")
async def get_replenishment_recommendations(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_replenishment_recommendations()


@router.get("/datasets/{dataset_id}/action-queue")
async def get_action_queue(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_action_queue()


@router.post("/recommendations/{recommendation_id}/decide")
async def decide_recommendation(
    recommendation_id: str,
    payload: DecisionPayload,
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    # Find recommendation
    recs = repo.get_replenishment_recommendations()
    target = next((r for r in recs if r.get("id") == recommendation_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    qty = payload.approved_quantity if payload.approved_quantity is not None else target.get("recommended_order", 0)

    repo.record_action(
        recommendation_id=recommendation_id,
        sku=target.get("sku"),
        product_name=target.get("product_name"),
        action=payload.action.upper(),
        original_quantity=target.get("recommended_order"),
        approved_quantity=qty,
        reason=payload.reason or f"Action {payload.action.upper()} recorded by {current_user.full_name}"
    )

    return {
        "status": "success",
        "action": payload.action.upper(),
        "recommendation_id": recommendation_id,
        "approved_quantity": qty
    }
