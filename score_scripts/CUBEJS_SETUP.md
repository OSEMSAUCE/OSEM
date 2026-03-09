# Cube.js Setup for Scoring Metrics

This document explains how to set up Cube.js as the semantic layer for the scoring system.

---

## What is Cube.js?

Cube.js is a **semantic layer** that sits between your database and your application. It:
- Defines metrics (measures) and dimensions in schema files
- Enforces consistent definitions (if the schema is wrong, queries fail)
- Provides an API to query metrics
- Caches results for performance

**Why use it?**
- **Enforced conventions**: Schema files must be valid or Cube.js won't start
- **Self-documenting**: The schema IS the documentation
- **AI-readable**: Standard format that any AI can understand
- **No drift**: You can't accidentally use wrong field names

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Your Application                        │
└─────────────────────────────┬───────────────────────────────┘
                              │ HTTP API
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Cube.js                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Schema Files (model/*.yml)                          │    │
│  │  - Dimensions (what you group by)                    │    │
│  │  - Measures (what you compute)                       │    │
│  │  - Joins (how tables relate)                         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────┬───────────────────────────────┘
                              │ SQL
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    PostgreSQL (Supabase)                     │
│  - ProjectTable, OrganizationTable, etc.                    │
│  - ProjectScore_agg_helper, OrgScore_agg_helper             │
└─────────────────────────────────────────────────────────────┘
```

---

## Setup Steps

### 1. Create Cube.js directory structure

```
ReTreever/
└── cube/
    ├── docker-compose.yml
    ├── .env
    └── model/
        ├── projects.yml
        └── organizations.yml
```

### 2. Configure Docker

The `docker-compose.yml` runs Cube.js as a container:
- Port 4000: Developer Playground (web UI)
- Port 15432: SQL API (optional)
- Mounts `./model` for schema files

### 3. Configure Database Connection

The `.env` file contains your Supabase connection:
```
CUBEJS_DB_TYPE=postgres
CUBEJS_DB_HOST=<your-supabase-host>
CUBEJS_DB_PORT=5432
CUBEJS_DB_NAME=postgres
CUBEJS_DB_USER=postgres
CUBEJS_DB_PASS=<your-password>
CUBEJS_DB_SSL=true
```

### 4. Define Schema Files

Schema files define your metrics using Cube.js vocabulary:

**Dimensions** = attributes you group/filter by (project name, org name, stakeholder type)
**Measures** = computed values (sum, avg, count, percentile)

---

## Cube.js Vocabulary → Your System

| Cube.js Term | Your Current Term | Example |
|--------------|-------------------|---------|
| **Cube** | Table | `ProjectScore_agg_helper` |
| **Dimension** | Attribute/Field | `projectId`, `organizationName` |
| **Measure** | Computed Field | `projectScore`, `preClaimScore` |
| **Join** | Relation | Project → Org via Stakeholder |

---

## Mathematical Notation in Schema

Cube.js schemas can include descriptions that document the formula:

```yaml
measures:
  - name: pct_pre_claim
    type: avg
    sql: project_score
    description: |
      pct_pre_claim(O) = (1/n) × Σᵢ pct_score(pᵢ)
      where P = stakeholder_projects(O)
```

---

## Running Cube.js

```bash
cd ReTreever/cube
docker compose up -d
```

Then open http://localhost:4000 to see the Developer Playground.

---

## Querying via API

Once running, query metrics via REST API:

```bash
curl http://localhost:4000/cubejs-api/v1/load \
  -H "Content-Type: application/json" \
  -d '{
    "measures": ["OrgScores.pct_final"],
    "dimensions": ["OrgScores.organization_name"],
    "order": {"OrgScores.pct_final": "desc"},
    "limit": 10
  }'
```

---

## Next Steps

1. Start Cube.js with `docker compose up`
2. Open http://localhost:4000
3. Explore the schema in the Playground
4. Query your metrics
5. If schema is wrong, Cube.js will error - fix and restart

---

## Files Created

| File | Purpose |
|------|---------|
| `cube/docker-compose.yml` | Runs Cube.js container |
| `cube/.env` | Database connection |
| `cube/model/projects.yml` | Project scoring schema |
| `cube/model/organizations.yml` | Org scoring schema |
