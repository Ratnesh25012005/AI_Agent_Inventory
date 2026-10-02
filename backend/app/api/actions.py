from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.db.repositories.inventory_repository import InventoryRepository

router = APIRouter(prefix="", tags=["Action History & Audit"])


@router.get("/datasets/{dataset_id}/action-history")
async def get_dataset_action_history(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_action_history()
