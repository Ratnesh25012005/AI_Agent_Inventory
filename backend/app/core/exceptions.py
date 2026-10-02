from typing import Any, Optional
from fastapi import HTTPException, status


class InventoryAIException(HTTPException):
    def __init__(
        self,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail: str = "An internal inventory engine error occurred.",
        error_code: Optional[str] = None
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code or "INTERNAL_ERROR"


class UnauthorizedException(InventoryAIException):
    def __init__(self, detail: str = "Invalid or expired authentication credentials."):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, detail=detail, error_code="UNAUTHORIZED")


class DatasetNotFoundException(InventoryAIException):
    def __init__(self, dataset_id: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{dataset_id}' not found or access denied.",
            error_code="DATASET_NOT_FOUND"
        )


class DatasetAccessDeniedException(InventoryAIException):
    def __init__(self, dataset_id: str):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"You do not have permission to access dataset '{dataset_id}'.",
            error_code="ACCESS_DENIED"
        )


class SchemaMappingRequiredException(InventoryAIException):
    def __init__(self, detail: str = "Schema confirmation required before processing."):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, detail=detail, error_code="MAPPING_REQUIRED")
