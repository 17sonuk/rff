'use strict';
const helmet = require("helmet");
const authJson = require('./permissions.json');

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

app.listen(PORT, () => {
    logger.info(`Express is running on port ${PORT}`);
});