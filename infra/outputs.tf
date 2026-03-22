output "api_endpoint" {
  description = "The URL of the API Gateway endpoint"
  value       = aws_apigatewayv2_api.backend_api.api_endpoint
}

output "lambda_function_arn" {
  description = "The ARN of the Lambda function"
  value       = aws_lambda_function.backend.arn
}
