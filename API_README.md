# OSEM API

Open-source API server for environmental mapping and reforestation data.

## Quick Start

### Run Everything (Frontend + API)

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Run both frontend and API
npm run dev:all
```

- **Frontend:** http://localhost:5174
- **API:** http://localhost:3001

### Run Separately

```bash
# Frontend only
npm run dev

# API only
npm run dev:api
```

## Default Configuration

OSEM works out of the box with a **public demo database**:

- **URL:** `https://api.retreever.org/public`
- **Access:** Read-only, throttled to 10 items per request
- **No setup required** - just run and go!

This allows anyone to fork OSEM and have a working app immediately.

## Using Your Own Database

Want full data access? Set up your own database:

1. **Copy `.env.example` to `.env`**
2. **Set your database URL:**

```bash
# PostgreSQL
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Supabase
DATABASE_URL=https://your-project.supabase.co

# Or any other PostgreSQL-compatible database
```

3. **Run the app:**

```bash
npm run dev:all
```

## Environment Variables

| Variable            | Description                          | Default                            |
| ------------------- | ------------------------------------ | ---------------------------------- |
| `DATABASE_URL`      | Database connection string           | `https://api.retreever.org/public` |
| `API_PORT`          | API server port                      | `3001`                             |
| `NODE_ENV`          | Environment (development/production) | `development`                      |
| `VITE_MAPBOX_TOKEN` | Mapbox API token for maps            | Required                           |

## API Endpoints

### Root

```
GET /
```

Returns API information and available endpoints.

### Health Check

```
GET /health
```

Returns server status and timestamp.

### Projects

```
GET /api/projects
```

List all reforestation projects (throttled to 10 items).

### Lands

```
GET /api/lands?limit=10&offset=0
```

List land parcels with pagination.

### Polygons

```
GET /api/polygons
```

Get GeoJSON polygons for map display.

### Schema

```
GET /api/schema
```

Get database schema information.

## Rate Limiting

Public API requests are automatically throttled:

- **Max items per request:** 10
- **Headers:**
  - `X-RateLimit-Limit: 10`
  - `X-RateLimit-Remaining: 9`

This ensures fair usage and protects the database. Use your own database for unlimited access.

## Security

### Public Database URL

The default `DATABASE_URL` is intentionally public:

```bash
DATABASE_URL=https://api.retreever.org/public
```

This is **safe** because:

- ✅ Read-only access
- ✅ Throttled responses (10 items max)
- ✅ Row-level security at database level
- ✅ No write permissions
- ✅ No sensitive data exposed

### Your Private Database

When you use your own database:

- ⚠️ **Never commit `.env` to git** (already in `.gitignore`)
- ⚠️ **Use environment variables** for credentials
- ⚠️ **Set up RLS policies** in your database
- ⚠️ **Use read-only credentials** if possible

## Architecture

```
┌─────────────────────────────────────┐
│         OSEM (Open Source)          │
├─────────────────────────────────────┤
│  Frontend (SvelteKit)               │
│  - Dashboard                        │
│  - Map                              │
│  - UI Components                    │
├─────────────────────────────────────┤
│  API Server (Express)               │
│  - Routes & Controllers             │
│  - Rate Limiting                    │
│  - CORS                             │
├─────────────────────────────────────┤
│  Database (PostgreSQL/Supabase)     │
│  - Default: Public demo (throttled) │
│  - Optional: Your own (full access) │
└─────────────────────────────────────┘
```

## Development

### Build for Production

```bash
# Build frontend
npm run build

# Build API
npm run build:api
```

### Run Production Build

```bash
# Start frontend
npm run start

# Start API
npm run start:api
```

### Testing

```bash
# Run all tests
npm test

# Unit tests
npm run test:unit

# Integration tests
npm run test:integration
```

## Deployment

### Frontend (Netlify/Vercel)

1. Connect your GitHub repo
2. Set build command: `npm run build`
3. Set publish directory: `build`
4. Add environment variables (Mapbox token)

### API (Railway/Render)

1. Connect your GitHub repo
2. Set start command: `npm run start:api`
3. Add environment variables:
   - `DATABASE_URL`
   - `API_PORT`
   - `NODE_ENV=production`

## Contributing

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Test locally with `npm run dev:all`
5. Submit a pull request

## Troubleshooting

### API won't start

- Check if port 3001 is available
- Verify `DATABASE_URL` is set in `.env`
- Run `npm install` to ensure dependencies are installed

### Frontend can't connect to API

- Ensure API is running (`npm run dev:api`)
- Check API is on port 3001
- Verify CORS settings in `api/server.ts`

### Database connection errors

- Check `DATABASE_URL` format
- Verify database is accessible
- Try the default public URL first

## License

MIT - See LICENSE file for details

## Links

- **Repository:** https://github.com/OSEMSAUCE/OSEM
- **Issues:** https://github.com/OSEMSAUCE/OSEM/issues
- **Discussions:** https://github.com/OSEMSAUCE/OSEM/discussions
