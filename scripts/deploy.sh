#!/bin/bash -e

s3_url="s3://pls.vatiris.se"
distribution_id="E1N9EPISN3MPGM"

# Check that we have access to the correct AWS account
aws_account_id=$(aws sts get-caller-identity --query "Account" --output text)
if [ "$aws_account_id" != "802367033029" ]; then
    echo "Wrong AWS account $aws_account_id! Check your ~/.aws/credentials"
    exit 1
fi

cd "$(dirname "$0")/../web"

# Check that VITE_WS_PASSWORD resolves to a real value, using Vite's own env
# loading so we see exactly what the build will (.env*, .env.local, env vars).
if ! node --input-type=module -e '
    import { loadEnv } from "vite"
    const pw = (loadEnv("production", process.cwd(), "VITE_").VITE_WS_PASSWORD || "").trim()
    if (!pw || pw === "{enter password here}") process.exit(1)
'; then
    echo "VITE_WS_PASSWORD is empty or unset! Set it in web/.env.local (see web/.env.example)"
    exit 1
fi

npm run build -- --mode production
aws s3 sync dist/ $s3_url --delete --acl public-read
aws cloudfront create-invalidation --distribution-id $distribution_id --paths '/*'
