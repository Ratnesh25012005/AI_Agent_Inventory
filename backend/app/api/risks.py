from typing import List, Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.db.repositories.inventory_repository import InventoryRepository

router = APIRouter(prefix="/datasets", tags=["Risks & Anomalies"])


@router.get("/{dataset_id}/stockout-risks")
async def get_stockout_risks(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_stockout_risks()


@router.get("/{dataset_id}/anomalies")
async def get_anomalies(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_anomalies()


@router.get("/{dataset_id}/inventory")
async def get_inventory_items(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    items = repo.get_inventory()
    total_val = sum(float(i.get("current_inventory", 0)) * float(i.get("unit_price", 0)) for i in items)
    total_units = sum(float(i.get("current_inventory", 0)) for i in items)

    return {
        "dataset_id": dataset_id,
        "total_skus": len(items),
        "total_inventory_units": round(total_units, 1),
        "total_inventory_value": round(total_val, 2),
        "items": items
    }


@router.get("/{dataset_id}/products/{sku}")
async def get_product_detail(
    dataset_id: str,
    sku: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    repo = InventoryRepository(dataset_id)
    return repo.get_product_detail(sku)
