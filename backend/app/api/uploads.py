from typing import List, Dict, Any
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.services.dataset_service import DatasetService

router = APIRouter(prefix="/datasets", tags=["File Uploads"])

MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit per file


@router.post("/{dataset_id}/upload")
async def upload_files_to_dataset(
    dataset_id: str,
    files: List[UploadFile] = File(...),
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(dataset_id)
    if not dataset:
        raise DatasetNotFoundException(dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    uploaded_results = []
    allowed_exts = {".csv", ".xlsx", ".xls", ".parquet", ".pq"}

    for file in files:
        fname = file.filename or "uploaded_data.csv"
        ext = "." + fname.split(".")[-1].lower() if "." in fname else ""
        if ext not in allowed_exts:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Supported: CSV, XLSX, Parquet"
            )

        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File '{fname}' exceeds the maximum allowed size of 100MB."
            )

        file_meta = DatasetService.save_uploaded_file(
            user_id=current_user.id,
            dataset_id=dataset_id,
            filename=fname,
            content_bytes=content
        )
        uploaded_results.append(file_meta)

    return {
        "dataset_id": dataset_id,
        "files_uploaded": len(uploaded_results),
        "files": uploaded_results
    }
