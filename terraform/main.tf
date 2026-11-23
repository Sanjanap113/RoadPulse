
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-south-1"
}

resource "aws_s3_bucket" "roadpulse_storage" {
  bucket = "roadpulse-terraform-demo-538632036928"

  tags = {
    Name        = "RoadPulse Terraform Demo"
    Environment = "Learning"
    Project     = "RoadPulse"
    Purpose = "Terraform Practical"
  }
}


resource "aws_ec2_tag" "roadpulse_ec2_tag" {
  resource_id = "i-00432f30cd1e2326d"
  key         = "ManagedBy"
  value       = "Terraform"
}
