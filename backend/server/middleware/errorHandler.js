const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the full error stack to the console
    
    // Use the global logger that was set in server/index.js
    if (global.logger) {
        global.logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }
    
    // Don't expose error details in production
    const isProduction = process.env.NODE_ENV === 'production';
    const responseMessage = isProduction ? 'Internal Server Error' : err.message;
    
    res.status(err.status || 500).json({ 
        error: responseMessage,
        // Only include stack trace in development
        ...(isProduction ? {} : { stack: err.stack })
    });
};

module.exports = errorHandler;
