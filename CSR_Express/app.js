'use strict';
require('dotenv').config();
const { NODE_ENV, PORT } = process.env;

const cors = require('cors');
const express = require('express');

const { getMessage } = require('./utils/functions');
const mainRouter = require('./routers/mainRouter');
const logger = require('./loggers/logger');

const app = express();

app.options('*', cors());
app.use(cors());

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({
    extended: false
}));

app.use((req, res, next) => {
    logger.info(`${req.method} - ${req.ip} - ${req.originalUrl}\n${JSON.stringify(req.body, null, 2)}`);
    next();
});

app.use(mainRouter);

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = NODE_ENV === 'development' ? err : {};

    // add this line to include winston logging
    logger.error(`${req.method} - ${req.ip} - ${req.originalUrl} - ${err.status || 500}\n${err.stack}`);

    // render the error page
    res.status(err.status || 500).json(getMessage(false, err.label));
});

app.listen(PORT, () => {
    console.log(`Express is running on port ${PORT}`);
});