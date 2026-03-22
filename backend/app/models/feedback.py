from pydantic import BaseModel, Field

class FeedbackRequest(BaseModel):
    """
    Data model for receiving user feedback from the frontend.
    """
    message: str = Field(..., description="The user's feedback message.")
    url: str = Field(..., description="The URL of the page from which feedback was submitted.")
