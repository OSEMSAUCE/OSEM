# OSEM Environment Setup

## Environment Files

OSEM has **NO database access** - it only calls ReTreever's API.

### Files in this directory:

- **`.env.example`** - Template showing required variables (COMMIT THIS)
- **`.env`** - Your local development config (DO NOT COMMIT)

### Setup Instructions

1. Copy the example file:

   ```bash
   cp .env.example .env
   ```

2. Fill in your actual values in `.env`:
   - Get Mapbox token from https://account.mapbox.com/access-tokens/
   - Set `PUBLIC_API_URL` to your ReTreever instance:
     - Local development: `http://localhost:5173`
     - Production: `https://your-retreever-domain.com`

3. Never commit `.env` to git!

## What OSEM Needs

- ✅ Mapbox token for maps
- ✅ ReTreever API URL (where to fetch data)
- ❌ **NO database credentials** (that's the whole point!)

## How It Works

OSEM is a **public-facing demo** that:

1. Uses the same UI code as ReTreever (via SubWoof)
2. Fetches ALL data from ReTreever's API
3. Has no direct database access
4. Shows only public data (controlled by RLS policies on ReTreever)

## Security Note

OSEM's `.env` only contains the API URL and Mapbox token - no sensitive database credentials!
