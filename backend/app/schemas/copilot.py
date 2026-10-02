from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import datetime


class CopilotChatRequest(BaseModel):
    dataset_id: str
    message: str
    conversation_history: List[Dict[str, Any]] = []


class ToolCallRecord(BaseModel):
    tool_name: str
    arguments: Dict[str, Any]
    result: Any


class CopilotChatResponse(BaseModel):
    dataset_id: str
    response: str
    tool_calls: List[ToolCallRecord] = []
    suggested_questions: List[str] = []
