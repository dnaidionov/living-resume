# Fit-Analysis Benchmark 2026-03-17

## Objective

Measure where the current fit-analysis latency is actually coming from and test whether faster model substitutions improve end-to-end performance without degrading recruiter-facing output quality.

## Methodology

- Benchmark harness: `npm run bench:fit -- --url "<job-url>"`
- Runtime:
  - `.env.local` loaded in-process
  - one process per benchmark run so URL and requirement caches are visible inside the run
- Benchmarked stages:
  - `url_fetch_first`
  - `url_fetch_second`
  - `requirements_first`
  - `requirements_second`
  - `evidence_resolution`
  - `fit_url_first`
  - `fit_url_second`
  - `fit_text_first`
  - `fit_text_second`
- Primary benchmark JD:
  - Sourgum Ashby posting:
    - `https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6?utm_source=VjydAOXMeB`
- Secondary quality sanity check:
  - Motive Greenhouse posting:
    - `https://job-boards.greenhouse.io/gomotive/jobs/8303849002`
- Model experiment rules:
  - Keep `OPENAI_CHAT_MODEL` unchanged
  - Change only `OPENAI_REQUIREMENTS_MODEL` and/or `OPENAI_FIT_MODEL`
  - Compare both timing and recruiter-brief output shape

## Benchmark Matrix

### Baseline

- `OPENAI_FIT_MODEL=gpt-5-mini`
- `OPENAI_REQUIREMENTS_MODEL=gpt-5-mini`

| Stage | Time |
| --- | ---: |
| `url_fetch_first` | 275.6 ms |
| `url_fetch_second` | 0.0075 ms |
| `requirements_first` | 17.28 s |
| `requirements_second` | 0.59 ms |
| `evidence_resolution` | 753 ms |
| `fit_url_first` | 49.60 s |
| `fit_url_second` | 26.31 s |
| `fit_text_first` | 46.23 s |
| `fit_text_second` | 32.21 s |

### Faster extraction only

- `OPENAI_FIT_MODEL=gpt-5-mini`
- `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano`

| Stage | Time |
| --- | ---: |
| `url_fetch_first` | 457.0 ms |
| `url_fetch_second` | 0.0138 ms |
| `requirements_first` | 27.01 s |
| `requirements_second` | 0.52 ms |
| `evidence_resolution` | 1.75 s |
| `fit_url_first` | 29.35 s |
| `fit_url_second` | 29.86 s |
| `fit_text_first` | 24.80 s |
| `fit_text_second` | 30.62 s |

### Faster fit only

- `OPENAI_FIT_MODEL=gpt-5-nano`
- `OPENAI_REQUIREMENTS_MODEL=gpt-5-mini`

| Stage | Time |
| --- | ---: |
| `url_fetch_first` | 408.8 ms |
| `url_fetch_second` | 0.0122 ms |
| `requirements_first` | 32.98 s |
| `requirements_second` | 0.38 ms |
| `evidence_resolution` | 1.63 s |
| `fit_url_first` | 30.87 s |
| `fit_url_second` | 41.18 s |
| `fit_text_first` | 34.53 s |
| `fit_text_second` | 41.37 s |

### Both faster

- `OPENAI_FIT_MODEL=gpt-5-nano`
- `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano`

| Stage | Time |
| --- | ---: |
| `url_fetch_first` | 1.03 s |
| `url_fetch_second` | 0.0084 ms |
| `requirements_first` | 22.11 s |
| `requirements_second` | 0.33 ms |
| `evidence_resolution` | 1.19 s |
| `fit_url_first` | 33.28 s |
| `fit_url_second` | 45.42 s |
| `fit_text_first` | 30.52 s |
| `fit_text_second` | 50.29 s |

## Quality Comparison

### Baseline recruiter-brief output on Sourgum

Verdict:
- `Strong Fit - Let's talk`

Representative `Where I match` bullets:
- `Proven track record owning product strategy while also operating as an individual contributor (player–coach), balancing vision and hands-on delivery.`
- `Serve as Product Manager/Product Owner for the SaaS platform: lead discovery, write requirements and specs, groom backlogs, and drive delivery with Engineering.`
- `Strong understanding of agile product development practices, including backlog management, sprint planning, and cross-functional delivery.`
- `Align product vision, roadmap, and KPIs to company goals to modernize the waste and recycling industry and deliver measurable value (adoption, engagement, business impact).`

### `OPENAI_REQUIREMENTS_MODEL=gpt-5-nano` recruiter-brief output on Sourgum

Verdict:
- `Strong Fit - Let's talk`

Representative `Where I match` bullets:
- `operate effectively as a player-coach, switching between strategic leadership and hands-on delivery.`
- `Strong product instincts paired with data-driven decision-making and excellent communication and stakeholder management.`
- `Strong understanding of agile product development, including backlog management, sprint planning, and cross-functional delivery.`

Observed quality change:
- the bullets became more generic
- the JD-specific PM/PO and KPI/roadmap framing weakened
- verdict stayed the same, but evidence specificity degraded

### Baseline sanity check on Motive

Verdict:
- `Strong Fit - Let's talk`

Representative `Where I match` bullets remained specific:
- telematics APIs, webhooks, enterprise data integrations
- telematics/data-platform roadmap ownership
- enterprise-grade platform reliability
- complex data platforms / API-first / IoT / distributed systems
- 8+ years in lead PM scope

Interpretation:
- the baseline can still produce specific domain-shaped recruiter bullets on a different JD
- the Sourgum `gpt-5-nano` degradation is therefore not just random baseline vagueness

## Conclusions

1. The remaining dominant bottleneck is the model path, not retrieval or URL ingestion.
2. URL ingestion cache works and removes a small amount of latency on reruns.
3. Requirement-extraction cache works and removes a large cold-start requirement-extraction cost on reruns.
4. Batched evidence resolution is not the main latency problem anymore.
5. `gpt-5-nano` is not a safe default speed win for this fit-analysis path.
6. `gpt-5-nano` also showed a real quality tradeoff on at least one representative JD by making recruiter-facing bullets more generic.

## Decision

- Keep the current default fit-analysis models on `gpt-5-mini` for now.
- Do not switch fit-analysis defaults to `gpt-5-nano` without stronger JD-level evidence.
- If further latency work is needed, prioritize architecture changes that reduce or cache the final fit-synthesis call rather than weakening retrieval or deterministic evidence selection.

## OpenRouter Free-Model Matrix

### Objective

Evaluate whether OpenRouter free models can replace the current paid OpenAI models for:
- `fit`
- `requirements`
- `chat`
- `embeddings`

while keeping recruiter-facing output quality acceptable and materially reducing latency and inference cost.

### Scope clarification

- The initial OpenRouter pass was collection-scoped and used:
  - `https://openrouter.ai/collections/free-models`
- That source turned out to be incomplete for this purpose.
- The broader zero-price source is:
  - `https://openrouter.ai/models?max_price=0`
- The shortlist below therefore uses:
  - the broader zero-price index as the source of candidate scope
  - direct model-page verification where possible
  - benchmark evidence already gathered in this repo
- This is still a shortlist, not an exhaustive benchmark of every zero-price model on OpenRouter.

### Additional methodology

- Same primary JD:
  - `https://jobs.ashbyhq.com/sourgum/a8720ec5-99e8-4aa8-b8da-07aa0afa5be6?utm_source=VjydAOXMeB`
- Current baseline for comparison:
  - `AI_FIT_PROVIDER=openai`
  - `AI_REQUIREMENTS_PROVIDER=openai`
  - `AI_FIT_MODEL=gpt-5-mini`
  - `AI_REQUIREMENTS_MODEL=gpt-5-mini`
  - `AI_CHAT_PROVIDER=openai`
  - `AI_CHAT_MODEL=gpt-5-mini`
  - `AI_EMBEDDINGS_PROVIDER=openai`
  - `AI_EMBEDDING_MODEL=text-embedding-3-small`
- OpenRouter experiments kept:
  - `AI_CHAT_PROVIDER=openai` for fit benchmarks unless chat was the task under test
  - `AI_EMBEDDINGS_PROVIDER=openai`
- OpenRouter free-model candidates tested:
  - `qwen/qwen3-next-80b-a3b-instruct:free`
  - `openai/gpt-oss-120b:free`
  - `stepfun/step-3.5-flash:free`
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `qwen/qwen3-4b:free`

### Recompiled zero-price shortlist

This is the current shortlist to benchmark next from the broader `max_price=0` scope.

#### Fit

Primary candidates:
- `openai/gpt-oss-120b:free`
- `qwen/qwen3-next-80b-a3b-instruct:free`
- `z-ai/glm-4.5-air:free`

Reserve candidates:
- `arcee-ai/trinity-large-preview:free`
- `nvidia/nemotron-3-super-120b-a12b:free`

Reasoning:
- `gpt-oss-120b:free` already showed the strongest speed/quality balance
- `qwen3-next` is the fastest successful fit candidate so far
- `glm-4.5-air:free` is in scope under the broader zero-price index and is worth one controlled benchmark
- `trinity-large-preview` and `nemotron-3-super` stay reserve because earlier evidence was unstable or incomplete

#### Requirements extraction

Primary candidates:
- `qwen/qwen3-next-80b-a3b-instruct:free`
- `openai/gpt-oss-120b:free`
- `z-ai/glm-4.5-air:free`

Reserve candidate:
- `meta-llama/llama-3.3-70b-instruct:free`

Reasoning:
- extraction needs structured, stable instruction following
- `qwen3-next` already performed extremely well on this task
- `gpt-oss-120b` is a strong control candidate
- `glm-4.5-air` is worth one pass because it is now in-scope under the broader zero-price listing

#### Chat

Primary candidates:
- `qwen/qwen3-next-80b-a3b-instruct:free`
- `meta-llama/llama-3.3-70b-instruct:free`
- `google/gemma-3n-e4b-it:free`

Reserve candidates:
- `qwen/qwen3-4b:free`
- `arcee-ai/trinity-mini:free`

Reasoning:
- chat candidates must be able to answer reliably before speed matters
- earlier free chat runs failed in the current runtime, so this remains a cautious shortlist rather than a recommendation

#### Embeddings

Primary candidate:
- `nvidia/llama-nemotron-embed-vl-1b-v2:free`

Control:
- `text-embedding-3-small`

Reasoning:
- the broader zero-price scope revealed a real free embedding candidate on OpenRouter
- it is now a legitimate benchmark target
- it is not yet the default recommendation because retrieval-quality benchmarking has not been completed

### Exclusions

The shortlist intentionally excludes:
- `openrouter/free`
  - non-deterministic router target, poor benchmark control
- `stepfun/step-3.5-flash:free`
  - already rejected for fit due to severe latency instability
- obvious multimodal-first or edge-tiny candidates as primary fit models
  - wrong tradeoff for recruiter-fit synthesis

### Fit / requirements comparison matrix

| Configuration | Fit model | Requirements model | `requirements_first` | `fit_url_first` | `fit_url_second` | `fit_text_first` | `fit_text_second` | Quality summary |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| Current baseline | `gpt-5-mini` | `gpt-5-mini` | `21.82 s` | `40.35 s` | `46.28 s` | `34.37 s` | `36.41 s` | Strong fit output; current paid baseline |
| Config A | `qwen/qwen3-next-80b-a3b-instruct:free` | `qwen/qwen3-next-80b-a3b-instruct:free` | `217 ms` | `411 ms` | `1.05 s` | `817 ms` | `981 ms` | Strong fit verdict; no observed degradation in benchmark run |
| Config B | `stepfun/step-3.5-flash:free` | `qwen/qwen3-next-80b-a3b-instruct:free` | `160 ms` | `45.08 s` | `48.54 s` | `32.69 s` | `18.57 s` | Unstable; one rerun degraded to `Probably a Good Fit` |
| Config C | `openai/gpt-oss-120b:free` | `qwen/qwen3-next-80b-a3b-instruct:free` | `307 ms` | `1.50 s` | `520 ms` | `536 ms` | `832 ms` | Strong fit output shape preserved; specific recruiter bullets stayed relevant |
| Config D | `arcee-ai/trinity-large-preview:free` | `qwen/qwen3-next-80b-a3b-instruct:free` | `176 ms` | `9.28 s` | `29.51 s` | `1.25 s` | `49.45 s` | Verdict held, but latency was erratic and not production-worthy |
| Config E | `nvidia/nemotron-3-super-120b-a12b:free` | `qwen/qwen3-next-80b-a3b-instruct:free` | not completed | not completed | not completed | not completed | not completed | Rejected; did not finish in the practical benchmark window |

### Fit / requirements deltas versus current baseline

#### Config A: `qwen/qwen3-next-80b-a3b-instruct:free` for fit and requirements

- `requirements_first`: `21.82 s -> 217 ms` (`-21.60 s`, about `100x` faster)
- `fit_url_first`: `40.35 s -> 411 ms` (`-39.94 s`, about `98x` faster)
- `fit_text_first`: `34.37 s -> 817 ms` (`-33.56 s`, about `42x` faster)
- inference cost for fit + requirements:
  - baseline: paid OpenAI
  - config A: `$0` provider cost

#### Config B: `stepfun/step-3.5-flash:free` fit + `qwen/qwen3-next-80b-a3b-instruct:free` requirements

- `requirements_first`: `21.82 s -> 160 ms` (`-21.66 s`)
- `fit_url_first`: `40.35 s -> 45.08 s` (`+4.73 s`, slower)
- `fit_text_first`: `34.37 s -> 32.69 s` (`-1.68 s`)
- inference cost for fit + requirements:
  - baseline: paid OpenAI
  - config B: `$0` provider cost
- rejected because:
  - the fit step was still slow
  - verdict stability regressed

#### Config C: `openai/gpt-oss-120b:free` fit + `qwen/qwen3-next-80b-a3b-instruct:free` requirements

- `requirements_first`: `28.93 s -> 307 ms` (`-28.62 s`) in the matched benchmark run
- `fit_url_first`: `39.40 s -> 1.50 s` (`-37.90 s`)
- `fit_url_second`: `35.20 s -> 520 ms` (`-34.68 s`)
- `fit_text_first`: `34.92 s -> 536 ms` (`-34.38 s`)
- `fit_text_second`: `36.15 s -> 832 ms` (`-35.32 s`)
- inference cost for fit + requirements:
  - baseline: paid OpenAI
  - config C: `$0` provider cost
- strongest observed quality note:
  - `whereIMatch` bullets remained specific and recruiter-shaped rather than collapsing into generic PM claims

### Chat comparison matrix

Prompt:
- `Which experience best proves product strategy and execution together?`

| Configuration | Chat model | Time | Result | Quality / notes |
| --- | --- | ---: | --- | --- |
| Current baseline | `gpt-5-mini` | `7055 ms` | Success | Best answer of the set; specific and grounded |
| Chat candidate A | `qwen/qwen3-next-80b-a3b-instruct:free` | `759 ms` | Failure | `Provider returned error` |
| Chat candidate B | `meta-llama/llama-3.3-70b-instruct:free` | `750 ms` | Failure | `Provider returned error` |
| Chat candidate C | `qwen/qwen3-4b:free` | `801 ms` | Failure | `Provider returned error` |

Interpretation:
- the tested free OpenRouter chat candidates are not currently usable in this runtime
- their provider cost is `$0`, but that does not matter because they failed before producing answers
- keep chat on `gpt-5-mini` until the OpenRouter chat path is made reliable

### Latest reserve-run addendum

These runs were completed after the initial shortlist pass and are the latest evidence for the broader zero-price recommendation.

#### Qwen fit + Qwen requirements + free embeddings

- `AI_FIT_PROVIDER=openrouter`
- `AI_FIT_MODEL=qwen/qwen3-next-80b-a3b-instruct:free`
- `AI_REQUIREMENTS_PROVIDER=openrouter`
- `AI_REQUIREMENTS_MODEL=qwen/qwen3-next-80b-a3b-instruct:free`
- `AI_EMBEDDINGS_PROVIDER=openrouter`
- `AI_EMBEDDING_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free`

Results:
- `requirements_first`: `197.256292 ms`
- `requirements_second`: `0.273792 ms`
- `evidence_resolution`: `735.464083 ms`
- `fit_url_first`: `835.251000 ms`
- `fit_url_second`: `786.961667 ms`
- `fit_text_first`: `1.037447 s`
- `fit_text_second`: `743.246958 ms`
- verdict:
  - `Strong Fit - Let's talk`
- quality:
  - `whereIMatch` headers stayed relevant and recruiter-shaped
  - one-off invocation preserved a strong recommendation and did not collapse into generic filler

Cost:
- `0` model spend on the free models, versus paid OpenAI baseline spend

Interpretation:
- this is currently the fastest successful free fit stack we observed
- it is the strongest option if the goal is lowest latency plus zero provider cost

#### Trinity fit + Qwen requirements + free embeddings

- `AI_FIT_MODEL=arcee-ai/trinity-large-preview:free`

Results:
- `fit_url_first`: `9.275190 s`
- `fit_url_second`: `29.514910 s`
- `fit_text_first`: `1.251502 s`
- `fit_text_second`: `49.453954 s`
- verdict:
  - `Strong Fit - Let's talk`
- quality:
  - verdict held
  - timing was too unstable to trust

Cost:
- `0` model spend on the free models

Interpretation:
- reject as a default because the latency variance is too large

#### Nemotron fit candidate

- `AI_FIT_MODEL=nvidia/nemotron-3-super-120b-a12b:free`

Result:
- did not complete in a practical benchmark window

Interpretation:
- reject for now

#### Zero-price fit recommendation after the addendum

- `fit`: `qwen/qwen3-next-80b-a3b-instruct:free`
- `requirements`: `qwen/qwen3-next-80b-a3b-instruct:free`
- `embeddings`: `nvidia/llama-nemotron-embed-vl-1b-v2:free`
- `chat`: keep `gpt-5-mini`

Fallback conservative fit option:
- `fit`: `openai/gpt-oss-120b:free`
- `requirements`: `qwen/qwen3-next-80b-a3b-instruct:free`
- `embeddings`: `nvidia/llama-nemotron-embed-vl-1b-v2:free`
- `chat`: keep `gpt-5-mini`

### Embeddings conclusion

- The [OpenRouter free-model collection](https://openrouter.ai/collections/free-models) does not currently list a suitable embedding model for this repo's embeddings path.
- One agent successfully exercised a free embedding model outside that visible collection page:
  - `nvidia/llama-nemotron-embed-vl-1b-v2:free`
- That means a free embedding path may be viable on OpenRouter in general, but it is outside the strict scope of "models from the free-model collection page".
- Therefore:
  - for the strict collection-based recommendation in this report, `embeddings` should remain on the current OpenAI path
  - for the broader zero-price recommendation, `nvidia/llama-nemotron-embed-vl-1b-v2:free` is now the preferred free embedding candidate
- The benchmarked fit runs that powered the main recommendation kept `AI_EMBEDDINGS_PROVIDER=openai`, so embeddings cost and behavior were unchanged across those comparison runs.

## OpenRouter Recommendation

### Best model by task

- `requirements`:
  - recommend `qwen/qwen3-next-80b-a3b-instruct:free`
  - reason: it collapsed the cold extraction step from tens of seconds to hundreds of milliseconds with no observed benchmark regression
- `fit`:
  - recommend `qwen/qwen3-next-80b-a3b-instruct:free` as the fastest acceptable free default
  - reason: it produced a strong-fit verdict, preserved recruiter-shaped bullets, and delivered the lowest successful latency
  - conservative alternative: `openai/gpt-oss-120b:free`
    - reason: it was also very fast and slightly safer on output specificity in earlier runs
- `chat`:
  - do not switch to a free OpenRouter model yet
  - reason: all tested free chat candidates failed in the current runtime
- `embeddings`:
  - recommend `nvidia/llama-nemotron-embed-vl-1b-v2:free` for the broader zero-price path
  - reason: one agent successfully exercised it and the fit benchmark remained strong with it
  - strict collection-based note: it was not visible in the curated collection page, which is why this recommendation only applies once the scope is widened to the full zero-price index

### Recommended experiment configurations

#### Safer production candidate

```env
AI_CHAT_PROVIDER=openai
AI_CHAT_MODEL=gpt-5-mini

AI_FIT_PROVIDER=openrouter
AI_FIT_MODEL=openai/gpt-oss-120b:free

AI_REQUIREMENTS_PROVIDER=openrouter
AI_REQUIREMENTS_MODEL=qwen/qwen3-next-80b-a3b-instruct:free

AI_EMBEDDINGS_PROVIDER=openai
AI_EMBEDDING_MODEL=text-embedding-3-small
```

#### Faster aggressive candidate

```env
AI_CHAT_PROVIDER=openai
AI_CHAT_MODEL=gpt-5-mini

AI_FIT_PROVIDER=openrouter
AI_FIT_MODEL=qwen/qwen3-next-80b-a3b-instruct:free

AI_REQUIREMENTS_PROVIDER=openrouter
AI_REQUIREMENTS_MODEL=qwen/qwen3-next-80b-a3b-instruct:free

AI_EMBEDDINGS_PROVIDER=openai
AI_EMBEDDING_MODEL=text-embedding-3-small
```

### Final decision

- Do not move `chat` to a free OpenRouter model yet.
- For the broader zero-price recommendation, move `fit`, `requirements`, and `embeddings` to:
  - `fit = qwen/qwen3-next-80b-a3b-instruct:free`
  - `requirements = qwen/qwen3-next-80b-a3b-instruct:free`
  - `embeddings = nvidia/llama-nemotron-embed-vl-1b-v2:free`
  - `chat = gpt-5-mini`
- If you want the more conservative fallback instead of the fastest free stack, keep:
  - `fit = openai/gpt-oss-120b:free`
  - `requirements = qwen/qwen3-next-80b-a3b-instruct:free`
  - `embeddings = nvidia/llama-nemotron-embed-vl-1b-v2:free`
  - `chat = gpt-5-mini`

## Reconciliation After Full Parallel No-Cache Pass

The final parallel pass changed the recommendation again.

Reason:
- the stricter no-cache harness and the requirements-only sweep showed that `qwen/qwen3-next-80b-a3b-instruct:free` is still the fastest extraction model, but it is consistently more generic than `openai/gpt-oss-120b:free`
- the embeddings benchmark did not complete cleanly enough in that final pass to justify changing the default embeddings recommendation

### Final reconciled recommendation

- `fit`: `openai/gpt-oss-120b:free`
- `requirements`: `openai/gpt-oss-120b:free`
- `chat`: `gpt-5-mini`
- `embeddings`: `text-embedding-3-small`

### Faster but weaker alternative

- `fit`: `qwen/qwen3-next-80b-a3b-instruct:free`
- `requirements`: `qwen/qwen3-next-80b-a3b-instruct:free`
- `chat`: `gpt-5-mini`
- `embeddings`: `text-embedding-3-small`

Tradeoff:
- materially faster
- weaker recruiter-brief specificity

### Final no-cache fit comparison

| Stage | Baseline (`gpt-5-mini` / `gpt-5-mini`) | `gpt-oss-120b:free` fit + `qwen3-next:free` requirements | `qwen3-next:free` fit + `qwen3-next:free` requirements |
| --- | ---: | ---: | ---: |
| `requirements_first` | `35.516 s` | `304.683 ms` | `169.181 ms` |
| `evidence_resolution` | `1.434 s` | `1.066 s` | `1.771 s` |
| `fit_url_first` | `36.474 s` | `1.797 s` | `1.177 s` |
| `fit_url_second` | `34.537 s` | `782 ms` | `1.545 s` |
| `fit_text_first` | `51.324 s` | `1.645 s` | `832 ms` |
| `fit_text_second` | `35.171 s` | `966.878 ms` | `1.171 s` |

Interpretation:
- `qwen3-next` is the fastest completed fit path
- `gpt-oss-120b` remains the stronger default fit choice because its output stayed more specific

### Final no-cache requirements-only comparison

| Requirements model | `requirements_first` | `fit_url_first` | `fit_text_first` | Quality note |
| --- | ---: | ---: | ---: | --- |
| `gpt-5-mini` baseline | `24.372 s` | `48.260 s` | `32.865 s` | Best specificity, but slow |
| `qwen/qwen3-next-80b-a3b-instruct:free` | `227.5 ms` | `40.326 s` | `43.149 s` | More generic than baseline |
| `openai/gpt-oss-120b:free` | `258.5 ms` | `36.545 s` | `35.858 s` | Best balance of speed and specificity |
| `z-ai/glm-4.5-air:free` | `647.3 ms` | `35.839 s` | `51.130 s` | No quality win |
| `meta-llama/llama-3.3-70b-instruct:free` | `278.8 ms` | `37.859 s` | `35.668 s` | Good speedup, weaker case than `gpt-oss` |

Interpretation:
- the strongest standalone requirements recommendation is now `openai/gpt-oss-120b:free`

### Chat reconciliation

- Completed chat evidence still supports keeping `gpt-5-mini`
- Free candidates tested so far failed in the runtime:
  - `qwen/qwen3-next-80b-a3b-instruct:free`
  - `meta-llama/llama-3.3-70b-instruct:free`
  - `qwen/qwen3-4b:free`
  - `arcee-ai/trinity-mini:free` returned `openrouter response did not include content`

### Embeddings reconciliation

- `nvidia/llama-nemotron-embed-vl-1b-v2:free` remains a viable next candidate
- but the final parallel pass did not produce a clean completed timing + retrieval-quality comparison
- so the recommendation does **not** move embeddings yet
