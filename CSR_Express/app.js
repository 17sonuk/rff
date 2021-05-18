'use strict';
const fs = require('fs'); // https
const https = require('https'); // https
const certificate = fs.readFileSync('./sslcert/server.crt', 'utf8'); // https
const privateKey = fs.readFileSync('./sslcert/server.key', 'utf8'); // https

const helmet = require("helmet");
const authJson = require('./permissions.json');
const fileUpload = require('express-fileupload') //Alternative of IPFS

const authMap = {
    'common': new Set(authJson.common),
    'ngo': new Set(authJson.ngo),
    'corporate': new Set(authJson.corporate),
    'creditsauthority': new Set(authJson.creditsauthority)
};

require('dotenv').config();
const { NODE_ENV, PORT } = process.env;

const cors = require('cors');
const express = require('express');

const connectionToMongo = require('./model/connection')
connectionToMongo();

const { getMessage } = require('./utils/functions');
const mainRouter = require('./routers/mainRouter');
const logger = require('./loggers/logger');

const app = express();
app.use(helmet());
app.use(fileUpload()) //Alternative of IPFS

app.options('*', cors());
app.use(cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({
    extended: false
}));

app.use((req, res, next) => {
    req.authMap = authMap;
    logger.info(`${req.method} - ${req.ip} - ${req.originalUrl}\n${JSON.stringify(req.body, null, 2)}`);
    next();
});

app.use(mainRouter);

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = NODE_ENV === 'development' ? err : {};

    // add this line to include winston logging
    logger.error(`${req.method} - ${req.ip} - ${req.originalUrl} - ${err.status || 500}\n${err.stack || err}`);

    // render the error page
    return res.status(err.status).json(getMessage(false, (err.message)));
});

// app.listen(PORT, () => {
//     logger.info(`Express is running on port ${PORT}`);
// });

const credentials = { key: privateKey, cert: certificate }; // https

const httpsServer = https.createServer(credentials, app); // https

httpsServer.listen(PORT, () => console.log(`Server running on Port 4200`)); //https