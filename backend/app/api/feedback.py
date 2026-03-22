from fastapi import APIRouter, HTTPException
from app.models.feedback import FeedbackRequest
from app.services.email_service import EmailService

router = APIRouter(prefix="/api/v1/feedback", tags=["Feedback"])

@router.post("")
def submit_feedback(request: FeedbackRequest):
    """
    Submits user feedback and sends it via email.
    """
    email_service = EmailService()
    success = email_service.send_feedback(message=request.message, url=request.url)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to send feedback.")
    
    return {"message": "Feedback submitted successfully."}
