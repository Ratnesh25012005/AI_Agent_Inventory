import os
import shutil
import uuid
from pathlib import Path
from typing import Dict, List, Any, Optional
import pandas as pd
from app.core.config import settings
from app.core.logging import logger
from app.ingestion.schema_mapper import map_column, infer_dataset_role, normalize_col_name
from app.ingestion.validator import compute_data_quality, detect_capabilities
from app.processing.duckdb_engine import get_dataset_engine
from app.db.repositories.inventory_repository import InventoryRepository


class DatasetService:
    """
    Core dataset lifecycle management:
    - Create dataset
    - Store uploaded files securely (user_id/dataset_id/filename)
    - Profile files and automatically detect schema columns
    - Run full analytical pipeline (DuckDB -> Features -> ML -> Replenishment -> Priority Queue)
    """

    @staticmethod
    def create_dataset(user_id: str, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        dataset_id = str(uuid.uuid4())
        dataset_dir = settings.DATA_RAW_DIR / user_id / dataset_id
        dataset_dir.mkdir(parents=True, exist_ok=True)
        (settings.DATA_PROCESSED_DIR / dataset_id).mkdir(parents=True, exist_ok=True)

        meta = {
            "id": dataset_id,
            "user_id": user_id,
            "name": name,
            "description": description or "Dark store inventory dataset",
            "status": "created",
            "quality_score": None,
            "row_counts": {},
            "capabilities": [],
            "files": []
        }
        DatasetService._save_meta(dataset_id, meta)
        return meta

    @staticmethod
    def _get_meta_path(dataset_id: str) -> Path:
        return settings.DATA_PROCESSED_DIR / dataset_id / "metadata.json"

    @staticmethod
    def _save_meta(dataset_id: str, data: Dict[str, Any]):
        p = DatasetService._get_meta_path(dataset_id)
        p.parent.mkdir(parents=True, exist_ok=True)
        import json
        p.write_text(json.dumps(data, indent=2, default=str))

    @staticmethod
    def get_dataset(dataset_id: str) -> Optional[Dict[str, Any]]:
        p = DatasetService._get_meta_path(dataset_id)
        if not p.exists():
            return None
        import json
        return json.loads(p.read_text())

    @staticmethod
    def list_datasets(user_id: str) -> List[Dict[str, Any]]:
        datasets = []
        if settings.DATA_PROCESSED_DIR.exists():
            for d in settings.DATA_PROCESSED_DIR.iterdir():
                if d.is_dir():
                    meta_p = d / "metadata.json"
                    if meta_p.exists():
                        try:
                            import json
                            data = json.loads(meta_p.read_text())
                            # Strict user isolation check
                            if str(data.get("user_id")) == str(user_id):
                                datasets.append(data)
                        except Exception:
                            pass
        return sorted(datasets, key=lambda x: x.get("created_at", ""), reverse=True)

    @staticmethod
    def save_uploaded_file(
        user_id: str,
        dataset_id: str,
        filename: str,
        content_bytes: bytes
    ) -> Dict[str, Any]:
        """
        Stores file in secure user_id/dataset_id path preventing traversal.
        Profiles columns, infers role, and maps initial schema.
        """
        # Sanitize filename
        safe_name = os.path.basename(filename)
        dest_dir = settings.DATA_RAW_DIR / user_id / dataset_id
        dest_dir.mkdir(parents=True, exist_ok=True)
        target_path = dest_dir / safe_name
        target_path.write_bytes(content_bytes)

        # Profile columns using pandas/duckdb chunk
        ext = target_path.suffix.lower()
        if ext == ".csv":
            df_sample = pd.read_csv(target_path, nrows=50)
            # count lines quickly
            with open(target_path, "rb") as f:
                row_count = sum(1 for _ in f) - 1
        elif ext in (".xlsx", ".xls"):
            df_sample = pd.read_excel(target_path, nrows=50)
            row_count = len(df_sample)
        elif ext in (".parquet", ".pq"):
            df_sample = pd.read_parquet(target_path)
            row_count = len(df_sample)
        else:
            df_sample = pd.DataFrame()
            row_count = 0

        cols = list(df_sample.columns)
        role = infer_dataset_role(safe_name, cols)

        mappings = []
        for c in cols:
            canonical, conf = map_column(c)
            mappings.append({
                "source_column": c,
                "canonical_field": canonical,
                "confidence": conf,
                "data_type": str(df_sample[c].dtype) if c in df_sample else "string",
                "is_confirmed": False
            })

        file_id = str(uuid.uuid4())
        file_info = {
            "id": file_id,
            "dataset_id": dataset_id,
            "filename": safe_name,
            "file_type": ext.lstrip("."),
            "file_size_bytes": len(content_bytes),
            "detected_role": role,
            "column_count": len(cols),
            "row_count": max(row_count, len(df_sample)),
            "sample_columns": cols,
            "mappings": mappings
        }

        # Update dataset metadata
        meta = DatasetService.get_dataset(dataset_id)
        if meta:
            meta.setdefault("files", []).append(file_info)
            meta["status"] = "uploaded"
            meta["row_counts"][role] = file_info["row_count"]
            DatasetService._save_meta(dataset_id, meta)

        return file_info
