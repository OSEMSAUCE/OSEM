import express from 'express';
import cors from 'cors';
import apiRoutes from './routes/index.js';

const app = express();
const PORT = Number(process.env.API_PORT) || 3001;

// CORS Configuration - Allow OSEM and contributor domains
const allowedOrigins = [
	'http://localhost:5174', // OSEM dev
	'http://127.0.0.1:5174',
	'https://osemsauce.org',
	'https://www.osemsauce.org'
	// Contributors: add your domains here
];

// Public API - throttled by default for all requests
// This ensures fair usage and protects the database
app.use((req, res, next) => {
	const origin = req.headers.origin || '';
	// Default: all requests are throttled (public access)
	res.locals.isPublic = true;

	// Private ReTreever domain gets full access (not in open source)
	if (origin.includes('retreever.org')) {
		res.locals.isPublic = false;
	}
	next();
});

// Rate limiting middleware for public access
const publicRateLimit = (req: any, res: any, next: any) => {
	if (res.locals.isPublic) {
		const limit = req.query.limit ? Math.min(Number(req.query.limit), 10) : 10;
		res.locals.queryLimit = limit;
		res.setHeader('X-RateLimit-Limit', '10');
		res.setHeader('X-RateLimit-Remaining', '9');
	}
	next();
};

// Apply CORS
app.use(
	cors({
		origin: (origin, callback) => {
			if (!origin || allowedOrigins.includes(origin)) {
				callback(null, true);
			} else {
				console.warn(`CORS blocked request from: ${origin}`);
				callback(new Error('Not allowed by CORS'));
			}
		},
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true
	})
);

app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
	res.json({
		name: 'OSEM API',
		version: '1.0.0',
		description: 'Open source reforestation data API',
		note: 'Public API is throttled to 10 items per request. Set up your own database for full access.',
		repository: 'https://github.com/OSEMSAUCE/OSEM',
		endpoints: {
			health: `${req.protocol}://${req.get('host')}/health`,
			projects: `${req.protocol}://${req.get('host')}/api/projects`,
			lands: `${req.protocol}://${req.get('host')}/api/lands`,
			polygons: `${req.protocol}://${req.get('host')}/api/polygons`
		}
	});
});

// Health check
app.get('/health', (req, res) => {
	res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes with public rate limiting
app.use('/api', publicRateLimit, apiRoutes);

// Error handling
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
	console.error('Unhandled error:', err);
	res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
	console.log(`\n🌍 OSEM API Server (Open Source)`);
	console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
	console.log(`Server:        http://localhost:${PORT}`);
	console.log(`Health:        http://localhost:${PORT}/health`);
	console.log(`\n📊 API Endpoints (throttled to 10 items):`);
	console.log(`  GET  /api/projects  - List all projects`);
	console.log(`  GET  /api/lands     - List lands (paginated)`);
	console.log(`  GET  /api/polygons  - GeoJSON polygons`);
	console.log(`  GET  /api/schema    - Database schema`);
	console.log(`\n💡 Using public demo database`);
	console.log(`   To use your own: Set DATABASE_URL in .env`);
	console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});

export default app;
