const errorHandler = (err, req, res, next) => {
    console.error(err.stack); // Log the full error stack to the console
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    res.status(err.status || 500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;