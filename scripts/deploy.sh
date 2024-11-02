#!/bin/bash -e

s3_url="s3://pls.vatiris.se"
distribution_id="E1N9EPISN3MPGM"

# Check that we have access to the correct AWS account
aws_account_id=$(aws sts get-caller-identity --query "Account" --output text)
if [ "$aws_account_id" != "802367033029" ]; then
    echo "Wrong AWS account $aws_account_id! Check your ~/.aws/credentials"
    exit 1
fi

cd "$(dirname $0)/.."
npm run build -- --mode production
aws s3 sync dist/ $s3_url --delete --acl public-read
aws cloudfront create-invalidation --distribution-id $distribution_id --paths '/*'
