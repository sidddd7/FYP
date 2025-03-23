// require('dotenv').config();
// const express = require('express');
// const app = express();
// const http = require('http').createServer(app);
// const io = require('socket.io')(http, {
//     cors: {
//         origin: process.env.CLIENT_ORIGINS.split(','),
//         methods: ['GET', 'POST']
//     }
// });
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const socketManager = require('./socketManager');
// const errorHandler = require('./middleware/errorHandler');
// const path = require('path'); 

// const PORT = process.env.PORT || 3000;

// app.use(cors({
//     origin: process.env.CLIENT_ORIGINS.split(',')
// }));
// app.use(helmet());
// app.use(morgan('dev')); 
// app.use(express.json());


// app.use(express.static(path.join(__dirname, '..'))); 


// socketManager(io);



// app.use(errorHandler);

// http.listen(PORT, () => console.log(`Server listening on port ${PORT}`));






require('dotenv').config();
const fs = require('fs');
const https = require('https');
const express = require('express');
const app = express();
const server = https.createServer({
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
}, app);
const io = require('socket.io')(server, {
    cors: {
        origin: process.env.CLIENT_ORIGINS.split(','),
        methods: ['GET', 'POST']
    }
});
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const socketManager = require('./socketManager');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.CLIENT_ORIGINS.split(',')
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

app.use(express.static(path.join(__dirname, '..')));

socketManager(io);

app.use(errorHandler);

server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));