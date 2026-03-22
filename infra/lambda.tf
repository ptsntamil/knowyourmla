# IAM Role for Lambda
resource "aws_iam_role" "lambda_exec" {
  name = "${var.lambda_function_name}-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Sid    = ""
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      }
    ]
  })
}

# Attach Basic Execution Role for CloudWatch Logs
resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Attach DynamoDB Access Policy (Read/Write)
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "${var.lambda_function_name}-dynamodb-policy"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchWriteItem",
          "dynamodb:BatchGetItem"
        ]
        Effect = "Allow"
        Resource = [
          "arn:aws:dynamodb:${var.aws_region}:*:table/tn_political_data",
          "arn:aws:dynamodb:${var.aws_region}:*:table/tn_political_data/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_candidates",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_candidates/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_persons",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_persons/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_constituencies",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_constituencies/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_political_parties",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_political_parties/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_states",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_states/index/*",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_districts",
          "arn:aws:dynamodb:${var.aws_region}:*:table/knowyourmla_districts/index/*"
        ]
      },
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect = "Allow"
        Resource = [
          aws_secretsmanager_secret.feedback_credentials.arn
        ]
      }
    ]
  })
}

# Package Lambda (FastAPI app)
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/package"
  output_path = "${path.module}/backend.zip"
}

# Lambda Function
resource "aws_lambda_function" "backend" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = var.lambda_function_name
  role             = aws_iam_role.lambda_exec.arn
  handler          = "main.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime          = "python3.13"
  timeout          = 30
  memory_size      = 256

  environment {
    variables = {
      ENV                = var.environment
      FEEDBACK_SECRET_ID = aws_secretsmanager_secret.feedback_credentials.name
    }
  }

  tags = {
    Project = var.project_name
    Env     = var.environment
  }
}
