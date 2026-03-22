import pytest
from fastapi.testclient import TestClient
from main import app
from unittest.mock import patch, MagicMock

client = TestClient(app)

@pytest.fixture
def mock_email_service():
    with patch("app.api.feedback.EmailService") as mock:
        yield mock

def test_submit_feedback_success(mock_email_service):
    # Setup mock
    mock_instance = mock_email_service.return_value
    mock_instance.send_feedback.return_value = True

    # Test request
    response = client.post(
        "/api/v1/feedback",
        json={"message": "Great site!", "url": "http://localhost:3000/mla/stalin"}
    )

    # Assertions
    assert response.status_code == 200
    assert response.json() == {"message": "Feedback submitted successfully."}
    mock_instance.send_feedback.assert_called_once_with(
        message="Great site!",
        url="http://localhost:3000/mla/stalin"
    )

def test_submit_feedback_failure(mock_email_service):
    # Setup mock
    mock_instance = mock_email_service.return_value
    mock_instance.send_feedback.return_value = False

    # Test request
    response = client.post(
        "/api/v1/feedback",
        json={"message": "Error report", "url": "http://localhost:3000/"}
    )

    # Assertions
    assert response.status_code == 500
    assert response.json()["detail"] == "Failed to send feedback."

def test_submit_feedback_invalid_request():
    # Test request with missing URL
    response = client.post(
        "/api/v1/feedback",
        json={"message": "Incomplete request"}
    )

    # Assertions
    assert response.status_code == 422 # Validation Error

@patch("app.services.email_service.boto3.client")
@patch("app.services.email_service.smtplib.SMTP")
def test_email_service_send_feedback(mock_smtp, mock_boto):
    from app.services.email_service import EmailService
    
    # Mock Secrets Manager
    mock_sm = MagicMock()
    mock_boto.return_value = mock_sm
    mock_sm.get_secret_value.return_value = {
        "SecretString": '{"username": "test@gmail.com", "password": "app-password"}'
    }

    # Mock SMTP
    mock_server = MagicMock()
    mock_smtp.return_value = mock_server

    # Test Service
    service = EmailService()
    success = service.send_feedback("Test message", "http://test.com")

    # Assertions
    assert success is True
    mock_sm.get_secret_value.assert_called_once()
    mock_smtp.assert_called_with("smtp.gmail.com", 587)
    mock_server.login.assert_called_once_with("test@gmail.com", "app-password")
    mock_server.sendmail.assert_called_once_with("test@gmail.com", "ptsntamil1@gmail.com", mock_server.sendmail.call_args[0][2])
