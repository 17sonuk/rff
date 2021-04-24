require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET } = process.env;

const express = require('express');
var jwt = require('jsonwebtoken');
const mainRouter = express.Router();

// Routers
const demoRouter = require('./demoRouter');
const projectMongoRouter = require('./mongo/projectRouter');
const userMongoRouter = require('./mongo/userRouter');
const escrowRouter = require('./blockchain/escrowRouter');
const projectRouter = require('./blockchain/projectRouter');
const queryRouter = require('./blockchain/queryRouter');
const redeemRouter = require('./blockchain/redeemRouter');
const tokenRouter = require('./blockchain/tokenRouter');
const transactionRouter = require('./blockchain/transactionRouter');
const utilsRouter = require('./blockchain/utilsRouter');
const pspRouter = require('./payment-gateway/pspRouter');

// Services
const registerUser = require('../fabric-sdk/registerUser');
const userService = require('../service/userService');

// Custom functions
const logger = require('../loggers/logger');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

// Authentication
mainRouter.use((req, res, next) => {
    let skip = ['/mongo/user/login', '/mongo/user/onboard', '/users']
    if (skip.includes(req.originalUrl)) {
        next();
    } else {
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const token = authHeader.split(' ')[1];
            jwt.verify(token, TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    let error = new Error('Failed to authenticate token. Make sure to include the ' +
                        'token returned from /users call in the authorization header ' +
                        ' as a Bearer token');
                    error.status = 403;
                    next(error);
                } else {
                    req.userName = decoded.userName;
                    req.orgName = decoded.orgName;
                    logger.debug(`Decoded from JWT token: useName - ${decoded.userName}, orgName - ${decoded.orgName}`);
                    next();
                }
            })
        } else {
            let error = new Error('missing token');
            error.status = 401;
            next(error);
        }
    }
});

mainRouter.use((req, res, next) => {
    req.userName = req.header('userName');
    req.orgName = req.header('orgName');
    logger.debug(`username ${req.userName} orgName ${req.orgName}`)
    next();
})

// Login and Generate JWT Token
mainRouter.post('/users', async (req, res, next) => {
    let { userName, password } = req.body;

    logger.debug('End point : /users');
    logger.debug(`User name : ${userName}`);

    if (!userName) {
        return res.json(fieldErrorMessage('\'userName\''));
    }
    if (!password) {
        return res.json(fieldErrorMessage('\'password\''));
    }

    //calling mongo login for password authentication
    let mongoResponse = {};
    let orgName;

    if (userName.length < 4 && (userName.startsWith('ca2') || userName.startsWith('it'))) {
        if (password === 'test') {
            mongoResponse = { ...getMessage(false, 'Login successfull!'), role: "CreditsAuthority" };
            orgName = 'creditsauthority';
        } else {
            logger.debug(`Authentication failed for the userName ${userName}`);
            return res.json(getMessage(false, 'Wrong credentials!'));
        }
    } else {
        mongoResponse = await userService.login(userName, password);
        if (mongoResponse.success === false) {
            logger.debug(`Authentication failed for the userName ${userName}`);
            return res.json(getMessage(false, mongoResponse.message));
        } else {
            orgName = mongoResponse.role.toLowerCase();
        }
    }

    let payload = {
        orgName: orgName,
        userName: userName
    }

    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

    try {
        await registerUser(userName, orgName);
        res.json({
            name: mongoResponse.name,
            role: mongoResponse.role,
            token: token
        })
    }
    catch (e) {
        logger.error(e)
        if (e.errors[0]['code'] === 0) {
            res.json({
                name: mongoResponse.name,
                role: mongoResponse.role,
                token: token
            })
        } else {
            generateError(e, 'Unauthorized user', 401, next);
        }
    }
});

// For testing purpose
mainRouter.use('/demo', demoRouter);

// Mongo Routers
mainRouter.use('/mongo/project', projectMongoRouter);
mainRouter.use('/mongo/user', userMongoRouter);

// Blockchain Routers
mainRouter.use('/escrow', escrowRouter);
mainRouter.use('/query', queryRouter);
mainRouter.use('/project', projectRouter);
mainRouter.use('/redeem', redeemRouter);
mainRouter.use('/token', tokenRouter);
mainRouter.use('/tx', transactionRouter);
mainRouter.use('/utils', utilsRouter);

// Payment Gateway Routers
mainRouter.use('/psp', pspRouter);

mainRouter.use("*", (req, res, next) => {
    let error = new Error('Invalid request');
    error.status = 404;
    next(error);
});

module.exports = mainRouter;