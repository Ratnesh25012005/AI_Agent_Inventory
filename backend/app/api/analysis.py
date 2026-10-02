from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.services.analysis_service import AnalysisService

router = APIRouter(prefix="/datasets", tags=["Analytics Execution"])


class AnalyzeRequest(BaseModel):
    confirmed_mappings: Optional[list] = None


@router.post("/{dataset_id}/analyze")
async def trigger_analysis(
    dataset_id: str,
    payload: Optional[AnalyzeRequest] = None,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    mappings = payload.confirmed_mappings if payload and payload.confirmed_mappings else dataset.get("confirmed_mappings")

    result = AnalysisService.run_pipeline(
        dataset_id=dataset_id,
        user_id=current_user.id,
        confirmed_mappings=mappings
    )
    return result
