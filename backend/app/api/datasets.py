from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.schemas.dataset import DatasetCreate, DatasetOut
from app.services.dataset_service import DatasetService
from app.core.config import settings, ROOT_DIR
import pandas as pd

router = APIRouter(prefix="/datasets", tags=["Datasets"])

# Resolve the demo CSV path: root-level file takes priority, data/sample as fallback
_DEMO_CSV_CANDIDATES = [
    ROOT_DIR / "darkstore_inventory_demo.csv",
    settings.DATA_SAMPLE_DIR / "darkstore_inventory_demo.csv",
]
DEMO_CSV_PATH = next((p for p in _DEMO_CSV_CANDIDATES if p.exists()), None)


@router.post("", response_model=Dict[str, Any])
async def create_dataset(
    payload: DatasetCreate,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.create_dataset(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description
    )
    return dataset


@router.get("", response_model=List[Dict[str, Any]])
async def list_datasets(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    return DatasetService.list_datasets(user_id=current_user.id)


@router.get("/{dataset_id}", response_model=Dict[str, Any])
async def get_dataset(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    # Server-side authorization check (Section 57)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)
    return dataset


@router.post("/sample", response_model=Dict[str, Any])
async def create_sample_dataset(
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    from app.services.analysis_service import AnalysisService
    from app.core.config import ROOT_DIR

    ds = DatasetService.create_dataset(
        user_id=current_user.id,
        name="DarkStore Sample (Quick-Commerce)",
        description="Sample FMCG dark store inventory with demand forecasts and replenishment"
    )
    stress_csv = ROOT_DIR / "data" / "test_scenario" / "unified_inventory_stress_test.csv"
    if stress_csv.exists():
        DatasetService.save_uploaded_file(
            user_id=current_user.id,
            dataset_id=ds["id"],
            filename="unified_inventory.csv",
            content_bytes=stress_csv.read_bytes()
        )
        AnalysisService.run_pipeline(dataset_id=ds["id"], user_id=current_user.id)
    return ds
