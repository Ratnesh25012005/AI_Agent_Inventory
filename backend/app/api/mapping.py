from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService
from app.ingestion.schema_mapper import CANONICAL_FIELDS

router = APIRouter(prefix="/datasets", tags=["Schema Mapping"])


class MappingUpdateRequest(BaseModel):
    mappings: List[Dict[str, Any]]


@router.get("/{dataset_id}/mapping")
async def get_schema_mappings(
    dataset_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    # Collect all mappings across files
    all_mappings = []
    for f in dataset.get("files", []):
        for m in f.get("mappings", []):
            item = dict(m)
            item["file_id"] = f["id"]
            item["filename"] = f["filename"]
            all_mappings.append(item)

    canonical_options = [
        {"field": k, "description": v["description"]}
        for k, v in CANONICAL_FIELDS.items()
    ]

    return {
        "dataset_id": dataset_id,
        "mappings": all_mappings,
        "canonical_fields": canonical_options
    }


@router.post("/{dataset_id}/mapping/confirm")
async def confirm_schema_mappings(
    dataset_id: str,
    payload: MappingUpdateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    # Update metadata with confirmed mappings
    dataset["status"] = "mapped"
    dataset["confirmed_mappings"] = payload.mappings
    DatasetService._save_meta(dataset_id, dataset)

    return {
        "dataset_id": dataset_id,
        "status": "mapped",
        "confirmed_mappings_count": len(payload.mappings)
    }
