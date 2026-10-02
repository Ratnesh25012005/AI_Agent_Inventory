from typing import List, Dict, Any
from fastapi import APIRouter, Depends, Query
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.db.repositories.inventory_repository import InventoryRepository

router = APIRouter(prefix="/datasets", tags=["Forecasts"])


@router.get("/{dataset_id}/forecasts")
async def get_forecasts(
    dataset_id: str,
    horizon: str = Query("24h", pattern="^(24h|48h|7d)$"),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    items = repo.get_forecasts(horizon=horizon)
    total_units = sum(float(i.get("predicted_demand", 0)) for i in items)

    return {
        "dataset_id": dataset_id,
        "horizon": horizon,
        "total_forecast_units": round(total_units, 1),
        "items": items
    }
