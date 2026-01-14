import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Import routes
import applicationRoutes from './routes/applications.js';
import adminRoutes from './routes/admin.js';
import { generalLimiter } from './middleware/rateLimit.js';

// Import database initialization
import { initDatabase } from './config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust reverse proxy (Render/Vercel) for rate limiting
app.set('trust proxy', 1);

// ==================== MIDDLEWARE ====================

// CORS configuration - allow frontend origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
].filter(Boolean).map(url => url.replace(/\/$/, '')); // Remove trailing slashes

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        const sanitizedOrigin = origin.replace(/\/$/, '');

        const isAllowed = allowedOrigins.includes(sanitizedOrigin) ||
            sanitizedOrigin.endsWith('.vercel.app') ||
            process.env.NODE_ENV !== 'production';

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// General rate limiting
app.use(generalLimiter);

// Request logging (development only)
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${req.method} ${req.path}`);
        next();
    });
}

// ==================== ROUTES ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'HUDT Backend API is running',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'HUDT Backend API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            applications: '/api/applications',
            admin: '/api/admin'
        }
    });
});

// Public application routes
app.use('/api/applications', applicationRoutes);

// Admin routes
app.use('/api/admin', adminRoutes);

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        code: 'NOT_FOUND'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        code: 'SERVER_ERROR'
    });
});

// ==================== START SERVER ====================

async function startServer() {
    try {
        // Initialize database
        await initDatabase();
        console.log('✅ Database initialized');

        app.listen(PORT, '0.0.0.0', () => {
            console.log(`
╔══════════════════════════════════════════════════════╗
║                                                      ║
║   🎭 HUDT Backend API Server                         ║
║                                                      ║
║   Server running on: http://0.0.0.0:${PORT}            ║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(27)}║
║                                                      ║
║   Endpoints:                                         ║
║   - GET  /api/health                                 ║
║   - POST /api/applications                           ║
║   - GET  /api/applications/status/:identifier        ║
║   - POST /api/admin/login                            ║
║   - GET  /api/admin/dashboard/stats                  ║
║   - GET  /api/admin/applications                     ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
      `);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

export default app;
