from typing import Optional
from pydantic import BaseModel, Field

class FeedbackRequest(BaseModel):
    """
    Data model for receiving user feedback from the frontend.
    """
    message: str = Field(..., description="The user's feedback message.")
    url: str = Field(..., description="The URL of the page from which feedback was submitted.")
    name: Optional[str] = Field(None, description="The user's name (optional).")
    email: Optional[str] = Field(None, description="The user's email address (optional).")
    subject: Optional[str] = Field(None, description="Custom subject for the feedback email (optional).")
