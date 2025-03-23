require('dotenv').config();
const fs = require('fs');
const https = require('https');
const http = require('http');
const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const winston = require('winston');
const errorHandler = require('./middleware/errorHandler');

// Setup logger
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { service: 'camera-monitoring-system' },
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

// Export logger for use in error handler
global.logger = logger;

// Get the port from environment variables
const PORT = process.env.PORT || 3000;

// Set up server with HTTPS if cert files exist
let server;
try {
    // Check if certificate files exist
    if (fs.existsSync('key.pem') && fs.existsSync('cert.pem')) {
        server = https.createServer({
            key: fs.readFileSync('key.pem'),
            cert: fs.readFileSync('cert.pem')
        }, app);
        logger.info('HTTPS server created with certificates');
    } else {
        logger.warn('SSL certificates not found, falling back to HTTP');
        server = http.createServer(app);
    }
} catch (error) {
    logger.error('Error creating HTTPS server, falling back to HTTP', { error });
    server = http.createServer(app);
}

// Setup Socket.IO with CORS settings
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(',') : '*',
        methods: ['GET', 'POST']
    }
});

// Configure middleware
app.use(cors({
    origin: process.env.CLIENT_ORIGINS ? process.env.CLIENT_ORIGINS.split(',') : '*'
}));

// Configure Helmet with necessary adjustments for WebRTC
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            connectSrc: ["'self'", 'wss:', 'ws:'],
            mediaSrc: ["'self'", 'blob:'],
            imgSrc: ["'self'", 'data:', 'blob:']
        }
    }
}));

app.use(morgan('dev'));
app.use(express.json());

// Serve static files
app.use(express.static(path.join(__dirname, '..')));

// Initialize socket manager
const socketManager = require('./socketManager');
socketManager(io);

// Add a basic route for health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Add error handler middleware
app.use(errorHandler);

// Start the server
server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
    console.log(`Server running on port ${PORT}`);
    
    // Log the server URLs for easy access
    const protocol = server instanceof https.Server ? 'https' : 'http';
    console.log(`Local access: ${protocol}://localhost:${PORT}`);
    
    // Try to get the machine's IP for network access
    try {
        const { networkInterfaces } = require('os');
        const nets = networkInterfaces();
        
        for (const name of Object.keys(nets)) {
            for (const net of nets[name]) {
                // Skip internal and non-IPv4 addresses
                if (!net.internal && net.family === 'IPv4') {
                    console.log(`Network access: ${protocol}://${net.address}:${PORT}`);
                }
            }
        }
    } catch (err) {
        console.error('Unable to determine network addresses', err);
    }
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    logger.info('SIGINT signal received. Shutting down gracefully');
    server.close(() => {
        logger.info('Server closed');
        process.exit(0);
    });
});
