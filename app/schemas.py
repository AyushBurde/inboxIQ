from pydantic import BaseModel
from typing import Optional

class MessageCreate(BaseModel):
    source: str
    sender: str
    subject: str
    body: str

class MessageResponse(BaseModel):
    id: int
    source: str
    sender: str
    subject: str
    body: str
    summary: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[str] = None
    action_required: Optional[str] = None
    metadata_json: Optional[str] = None

    class Config:
        from_attributes = True