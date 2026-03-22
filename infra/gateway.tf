# API Gateway (HTTP API)
resource "aws_apigatewayv2_api" "backend_api" {
  name          = "${var.lambda_function_name}-api"
  protocol_type = "HTTP"
  
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers = ["content-type", "authorization"]
    max_age       = 300
  }
}

# Gateway Stage
resource "aws_apigatewayv2_stage" "backend_stage" {
  api_id      = aws_apigatewayv2_api.backend_api.id
  name        = "$default"
  auto_deploy = true
}

# Gateway Integration with Lambda
resource "aws_apigatewayv2_integration" "backend_integration" {
  api_id           = aws_apigatewayv2_api.backend_api.id
  integration_type = "AWS_PROXY"

  integration_uri    = aws_lambda_function.backend.invoke_arn
  payload_format_version = "2.0"
}

# All routes proxy to Lambda
resource "aws_apigatewayv2_route" "backend_route" {
  api_id    = aws_apigatewayv2_api.backend_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend_integration.id}"
}

# Default route for root
resource "aws_apigatewayv2_route" "root_route" {
  api_id    = aws_apigatewayv2_api.backend_api.id
  route_key = "ANY /"
  target    = "integrations/${aws_apigatewayv2_integration.backend_integration.id}"
}

# Permission for Gateway to invoke Lambda
resource "aws_lambda_permission" "api_gw" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"

  source_arn = "${aws_apigatewayv2_api.backend_api.execution_arn}/*/*"
}
