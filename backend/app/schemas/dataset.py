from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime


class DatasetCreate(BaseModel):
    name: str = Field(..., description="Name of the dark store / warehouse dataset")
    description: Optional[str] = None
    business_type: Optional[str] = "Dark Store"


class DatasetFileOut(BaseModel):
    id: str
    dataset_id: str
    filename: str
    file_type: str
    file_size_bytes: Optional[int] = None
    detected_role: Optional[str] = None
    column_count: Optional[int] = None
    row_count: Optional[int] = None
    sample_columns: List[str] = []
    created_at: Optional[datetime] = None


class SchemaMappingItem(BaseModel):
    source_column: str
    canonical_field: str
    confidence: str = "HIGH" # HIGH, MEDIUM, LOW
    data_type: Optional[str] = "string"
    is_confirmed: bool = False


class SchemaMappingConfirmRequest(BaseModel):
    mappings: List[SchemaMappingItem]


class DataQualityReportOut(BaseModel):
    overall_score: float
    summary: str
    checks: List[Dict[str, Any]] = []
    warnings: List[str] = []
    errors: List[str] = []


class DatasetOut(BaseModel):
    id: str
    user_id: str
    name: str
    description: Optional[str] = None
    status: str
    quality_score: Optional[float] = None
    row_counts: Dict[str, Any] = {}
    capabilities: List[str] = []
    files: List[DatasetFileOut] = []
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
