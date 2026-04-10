provider "aws" {
  region = "ap-south-2"
}

# resource "aws_dynamodb_table" "tn_political_data" {
#   name         = "tn_political_data"
#   billing_mode = "PAY_PER_REQUEST"

#   # Primary Key
#   hash_key  = "PK"
#   range_key = "SK"

#   attribute {
#     name = "PK"
#     type = "S"
#   }

#   attribute {
#     name = "SK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI1PK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI1SK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI2PK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI2SK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI3PK"
#     type = "S"
#   }

#   attribute {
#     name = "GSI3SK"
#     type = "S"
#   }

#   # GSI1 - Candidate History
#   global_secondary_index {
#     name            = "GSI1"
#     projection_type = "ALL"

#     key_schema {
#       attribute_name = "GSI1PK"
#       key_type       = "HASH"
#     }

#     key_schema {
#       attribute_name = "GSI1SK"
#       key_type       = "RANGE"
#     }
#   }

#   # GSI2 - Year View
#   global_secondary_index {
#     name            = "GSI2"
#     projection_type = "ALL"

#     key_schema {
#       attribute_name = "GSI2PK"
#       key_type       = "HASH"
#     }

#     key_schema {
#       attribute_name = "GSI2SK"
#       key_type       = "RANGE"
#     }
#   }

#   # GSI3 - Constituency Timeline
#   global_secondary_index {
#     name            = "GSI3"
#     projection_type = "ALL"

#     key_schema {
#       attribute_name = "GSI3PK"
#       key_type       = "HASH"
#     }

#     key_schema {
#       attribute_name = "GSI3SK"
#       key_type       = "RANGE"
#     }
#   }

#   point_in_time_recovery {
#     enabled = true
#   }

#   tags = {
#     Project = "KnowYourMLA"
#     Env     = "prod"
#   }
# }

resource "aws_dynamodb_table" "knowyourmla_candidates" {
  name         = "knowyourmla_candidates"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = AFFIDAVIT#<year>#<myneta_id>, SK = INFO
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "person_id"
    type = "S"
  }

  attribute {
    name = "constituency_id"
    type = "S"
  }

  attribute {
    name = "year"
    type = "N"
  }

  attribute {
    name = "is_winner_flag"
    type = "S"
  }

  attribute {
    name = "party_id"
    type = "S"
  }

  # GSI to find all candidates for a specific person
  global_secondary_index {
    name            = "PersonIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "person_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to find all candidates/affidavits for a specific constituency
  global_secondary_index {
    name            = "ConstituencyIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "constituency_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to find all candidates for a specific year
  global_secondary_index {
    name            = "YearIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "year"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "constituency_id"
      key_type       = "RANGE"
    }
  }

  # Sparse GSI for winners
  global_secondary_index {
    name            = "WinnerYearIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "is_winner_flag"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "year"
      key_type       = "RANGE"
    }
  }

  # GSI to find all candidates for a specific party
  global_secondary_index {
    name            = "PartyIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "party_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "year"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}

resource "aws_dynamodb_table" "knowyourmla_persons" {
  name         = "knowyourmla_persons"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = PERSON#<unique_hash>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "normalized_name"
    type = "S"
  }

  attribute {
    name = "voter_constituency_id"
    type = "S"
  }

  # GSI for searching persons by name
  global_secondary_index {
    name            = "NameIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "normalized_name"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI for searching persons by voter constituency
  global_secondary_index {
    name            = "VoterConstituencyIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "voter_constituency_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}

resource "aws_dynamodb_table" "knowyourmla_constituencies" {
  name         = "knowyourmla_constituencies"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = CONSTITUENCY#<normalized_name>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "normalized_name"
    type = "S"
  }

  attribute {
    name = "district_id"
    type = "S"
  }

  # GSI for searching constituencies by normalized name
  global_secondary_index {
    name            = "NameIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "normalized_name"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to quickly list all METADATA records across all constituencies
  global_secondary_index {
    name            = "MetadataIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "SK"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to find all constituencies in a specific district
  global_secondary_index {
    name            = "DistrictIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "district_id"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}



resource "aws_dynamodb_table" "knowyourmla_political_parties" {
  name         = "knowyourmla_political_parties"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = PARTY#<normalized_name>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "normalized_name"
    type = "S"
  }

  # GSI for searching parties by normalized name
  global_secondary_index {
    name            = "NameIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "normalized_name"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to quickly list all METADATA records across all parties
  global_secondary_index {
    name            = "MetadataIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "SK"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}

resource "aws_dynamodb_table" "knowyourmla_states" {
  name         = "knowyourmla_states"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = STATE#<normalized_name>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "normalized_name"
    type = "S"
  }

  # GSI for searching states by normalized name
  global_secondary_index {
    name            = "NameIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "normalized_name"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}

resource "aws_dynamodb_table" "knowyourmla_districts" {
  name         = "knowyourmla_districts"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = DISTRICT#<normalized_name>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  attribute {
    name = "normalized_name"
    type = "S"
  }

  # GSI for searching districts by normalized name
  global_secondary_index {
    name            = "NameIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "normalized_name"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  # GSI to quickly list all METADATA records across all districts
  global_secondary_index {
    name            = "MetadataIndex"
    projection_type = "ALL"

    key_schema {
      attribute_name = "SK"
      key_type       = "HASH"
    }

    key_schema {
      attribute_name = "PK"
      key_type       = "RANGE"
    }
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}

resource "aws_dynamodb_table" "knowyourmla_elections" {
  name         = "knowyourmla_elections"
  billing_mode = "PAY_PER_REQUEST"

  # Primary Key: PK = ELECTION#<year>#<type>#<category>, SK = METADATA
  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Project = "KnowYourMLA"
    Env     = "prod"
  }
}
