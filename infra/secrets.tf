resource "aws_secretsmanager_secret" "feedback_credentials" {
  name        = "${var.project_name}-feedback-credentials-${var.environment}"
  description = "Gmail credentials for the feedback system"
  
  tags = {
    Project = var.project_name
    Env     = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "feedback_credentials_version" {
  secret_id = aws_secretsmanager_secret.feedback_credentials.id
  secret_string = jsonencode({
    username = "placeholder@gmail.com"
    password = "placeholder-app-password"
  })
}
