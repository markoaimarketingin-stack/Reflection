# Reflection & Learning Engine

Production-ready FastAPI backend for Marko AI's retrospective and learning loop. The system compares forecasted vs actual campaign results, detects reusable patterns, stores structured and semantic memory, and feeds those learnings back into future planning.

## What it does

- Compares expected vs actual CTR, CVR, CPA, and ROAS deltas
- Detects winning audiences, high-performing creatives, budget inefficiencies, platform trends, and heuristic clusters
- Generates structured insights and recommendations with OpenAI when configured, with deterministic fallback when it is not
- Stores campaign memory in SQLite and semantic summaries in Chroma or a local JSON vector fallback
- Updates reusable signal weights for continuous self-improvement
- Persists campaign artifacts to `output/<campaign_id>/`

## Tech stack

- FastAPI
- Pandas + NumPy
- Pydantic
- SQLite
- ChromaDB with deterministic fallback vector store
- OpenAI API for insight extraction and embeddings

## Project structure

```text
app/
  api/                FastAPI routes
  core/               settings and dependency bootstrap
  models/             Pydantic request/response schemas
  services/           comparator, pattern detection, insights, feedback loop
  storage/            SQLite and vector memory adapters
  utils/              metric and JSON helpers
data/
  samples/            sample campaign payloads
output/               generated analysis artifacts
scripts/
  generate_example_outputs.py
tests/
```

## Input schema

Primary request model: `CampaignPerformanceInput`

- `campaign_id: str`
- `platform: str`
- `objective: str`
- `expected_metrics: Metrics`
- `actual_metrics: Metrics`
- `audiences: list[Audience]`
- `creatives: list[Creative]`
- `timestamp: datetime`

`Metrics` includes the requested fields plus optional `revenue`. ROAS needs revenue to be meaningful; when it is absent, the engine returns `null` for ROAS deltas and flags that gap in the insight layer.

## Core modules

### 1. Performance Comparator

- Computes CTR, CVR, CPA, and ROAS snapshots
- Returns percentage deviation between expected and actual performance
- Calculates a weighted `performance_score`

Formula:

```text
performance_score =
    (conversion_weight * conversions)
  + (ctr_weight * CTR)
  - (cpa_weight * CPA)
```

### 2. Pattern Detection Engine

- Uses Pandas groupby aggregation over campaign, audience, and creative views
- Finds winning audiences and creatives
- Flags budget inefficiencies
- Detects cross-platform patterns and trend slopes
- Builds heuristic clusters for scale winners, efficient converters, and at-risk campaigns

### 3. Insight Extraction

- Uses OpenAI structured output when `OPENAI_API_KEY` is available
- Falls back to deterministic summarization when the API is unavailable
- Produces:
  - `key_learnings`
  - `recommendations`
  - `anomalies`

### 4. Memory System

Structured memory:

- `campaigns`
- `performance_logs`
- `patterns`
- `insights`
- `weights`

Semantic memory:

- Stores campaign summaries and insight context in Chroma
- Falls back to a local persisted vector file if Chroma is unavailable
- Supports similarity retrieval for future campaign planning

### 5. Feedback Loop Engine

- Promotes weights for positive audience and creative signals
- Discounts inefficient or underperforming signals
- Persists a global `weights.json` snapshot

## API endpoints

### `POST /analyze-campaign`

Input: `CampaignPerformanceInput`

Returns:

- comparison report
- pattern report
- insights
- updated weights
- similar campaigns from memory
- storage confirmation

### `GET /insights`

Returns top stored learnings ordered by priority.

### `GET /patterns`

Returns stored pattern findings ordered by impact.

### `GET /recommendations`

Returns planning recommendations built from top insights, top patterns, signal weights, and similar historical campaigns.

## Local setup

### 1. Install dependencies

```bash
pip install -e .[dev]
```

### 2. Configure environment

Copy `.env.example` into your environment or export the variables directly.

Key variables:

- `OPENAI_API_KEY`
- `MARKO_DATABASE_PATH`
- `MARKO_OUTPUT_DIR`
- `MARKO_VECTOR_BACKEND`
- `MARKO_VECTOR_PATH`
- `MARKO_VECTOR_FALLBACK_PATH`
- `MARKO_WEIGHTS_PATH`
- `MARKO_INSIGHTS_MODEL`
- `MARKO_EMBEDDING_MODEL`

### 3. Run the API

```bash
uvicorn app.main:app --reload
```

## Example workflow

### Generate sample outputs

```bash
python scripts/generate_example_outputs.py
```

That script:

- loads historical campaigns from `data/samples/campaign_history.json`
- analyzes the incoming sample campaign from `data/samples/incoming_campaign.json`
- writes artifacts to `output/cmp_007_meta_summer_bootcamp/`

### Sample request

```json
{
  "campaign_id": "cmp_007_meta_summer_bootcamp",
  "platform": "Meta",
  "objective": "Lead Generation",
  "expected_metrics": {
    "impressions": 95000,
    "clicks": 1900,
    "conversions": 76,
    "spend": 3800.0,
    "revenue": 7600.0
  },
  "actual_metrics": {
    "impressions": 140000,
    "clicks": 4900,
    "conversions": 205,
    "spend": 3950.0,
    "revenue": 22500.0
  },
  "audiences": [
    {
      "name": "Students 18-25",
      "attributes": {
        "age_range": "18-25",
        "city_tier": "Tier-1",
        "segment": "students"
      }
    }
  ],
  "creatives": [
    {
      "id": "crt_010",
      "type": "video",
      "headline": "From scroll to signup in 15 seconds",
      "primary_text": "Short-form bootcamp creative built around creator before-and-after proof."
    }
  ],
  "timestamp": "2026-03-29T10:00:00+00:00"
}
```

## Output structure

```text
output/
  <campaign_id>/
    comparison.json
    patterns.json
    insights.json
    updated_weights.json
```

## Notes for production

- SQLite is used for phase 1 and can be swapped behind the repository interface.
- Campaign-level attribution across multiple audiences and creatives is heuristic because the input schema does not include segment-level metrics.
- Chroma is the preferred semantic backend; the local JSON vector store exists so the engine still runs without extra infrastructure.
- For more reliable ROAS analysis, always supply `revenue`.

## Verification

- `tests/test_comparator.py`
- `tests/test_pattern_detector.py`
- `python scripts/generate_example_outputs.py`
