from typing import Dict, Any
from fastapi import APIRouter, Depends
from app.core.security import get_current_user, AuthenticatedUser, verify_dataset_ownership
from app.core.exceptions import DatasetNotFoundException
from app.schemas.copilot import CopilotChatRequest, CopilotChatResponse
from app.services.dataset_service import DatasetService
from app.services.gemini_service import GeminiCopilotService

router = APIRouter(prefix="/agent", tags=["AI Copilot"])
copilot_service = GeminiCopilotService()


@router.post("/chat", response_model=CopilotChatResponse)
async def chat_with_copilot(
    payload: CopilotChatRequest,
    current_user: AuthenticatedUser = Depends(get_current_user)
):
    dataset = DatasetService.get_dataset(payload.dataset_id)
    if not dataset:
        raise DatasetNotFoundException(payload.dataset_id)
    verify_dataset_ownership(dataset.get("user_id", ""), current_user)

    result = await copilot_service.chat(
        dataset_id=payload.dataset_id,
        message=payload.message,
        conversation_history=payload.conversation_history
    )
    return CopilotChatResponse(**result)
