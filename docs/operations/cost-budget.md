# Cost Budget

## Target

Keep the total monthly cost under `$20`.

## Expected shape

- Cloudflare hosting/logs/analytics: approximately `$0`
- Domain amortized: approximately `$1-$2/month`
- OpenAI: target `$5-$15/month`

## Controls

- default to `gpt-5-mini`
- use cheap embeddings
- cap outputs
- precompute explainers
- monitor token usage through application logs and provider dashboard
