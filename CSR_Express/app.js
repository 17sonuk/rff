'use strict';
const fs = require('fs'); // https
const https = require('https'); // https

const helmet = require("helmet");
const authJson = require('./permissions.json');
const fileUpload = require('express-fileupload') //Alternative of IPFS

const authMap = {
    'common': new Set(authJson.common),
    'ngo': new Set(authJson.ngo),
    'corporate': new Set(authJson.corporate),
    'creditsauthority': new Set(authJson.creditsauthority),
    'guest': new Set(authJson.guest)
};

require('dotenv').config();
const { NODE_ENV, PORT, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;

const cors = require('cors');
const express = require('express');
const compression = require('compression')
const rateLimit = require("express-rate-limit");

const { connectionToMongo } = require('./model/connection')
connectionToMongo();

const registerUser = require('./fabric-sdk/registerUser');
const { getMessage } = require('./utils/functions');
const mainRouter = require('./routers/mainRouter');
const logger = require('./loggers/logger');

const app = express();

app.use(compression())
app.use(helmet());
app.use(fileUpload()) //Alternative of IPFS

const limiter = rateLimit({
    windowMs: 20 * 1000, // 15 minutes
    max: 3, // limit each IP to 100 requests per windowMs
    // message: {
    //     status: 200,
    //     message: 'Too many request!!!!!!!!!!!!',
    // }

    handler: function (req, res, next) {
        console.log('................limit exceeded.....................')
        let error = new Error('................limit exceeded.....................');
        error.status = 200;
        next(error);
        //res.status(429).send();
    },
});
//app.use(limiter);

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

// Register ca in wallet (startup activity)
registerUser(CA_EMAIL.split('@')[0], 'creditsauthority')
    .then(_ => {
        logger.debug(_)
    })
    .catch(e => {
        logger.error(`${e.stack || e}`)
    });

// Register guest donor in wallet (startup activity)
registerUser(GUEST_EMAIL.split('@')[0], 'corporate')
    .then(_ => {
        logger.debug(_)
    })
    .catch(e => {
        logger.error(`${e.stack || e}`)
    })

// await registerUser(IT_EMAIL.split('@')[0], 'creditsauthority')

app.use(mainRouter);

app.use((err, req, res, next) => {
    console.log('some error!!!!!!!!!!!!!!!!!!!!!1')
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

module.exports = app;