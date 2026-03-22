variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-south-2"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "KnowYourMLA"
}

variable "environment" {
  description = "Environment name (e.g., prod, dev)"
  type        = string
  default     = "prod"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "knowyourmla-backend"
}
