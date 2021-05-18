require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET } = process.env;

const express = require('express');
var jwt = require('jsonwebtoken');
const mainRouter = express.Router();

// Routers
const demoRouter = require('./demoRouter');
const projectMongoRouter = require('./mongo/projectRouter');
const userMongoRouter = require('./mongo/userRoute');
const escrowRouter = require('./blockchain/escrowRouter');
const projectRouter = require('./blockchain/projectRouter');
const queryRouter = require('./blockchain/queryRouter');
const redeemRouter = require('./blockchain/redeemRouter');
const tokenRouter = require('./blockchain/tokenRouter');
const transactionRouter = require('./blockchain/transactionRouter');
const utilsRouter = require('./blockchain/utilsRouter');
const pspRouter = require('./payment-gateway/pspRouter');
const fileMongoRouter = require('./mongo/fileRouter');

// Services
const registerUser = require('../fabric-sdk/registerUser');
const userService = require('../service/userService');

// Custom functions
const logger = require('../loggers/logger');
const checkJwt = require('../utils/checkJwt');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

// Auth0
mainRouter.use(checkJwt);

// Authentication
mainRouter.use((req, res, next) => {
    let skip = ['/mongo/user/login', '/mongo/user/onboard', '/users']
    if (skip.includes(req.originalUrl)) {
        next();
    } else {
        const authHeader = req.headers.csrtoken;
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

    let roles = ['ngo', 'corporate', 'creditsauthority'];
    //authorization logic
    let authMap = req.authMap;


    let skip = ['/mongo/user/login', '/mongo/user/onboard', '/users'];
    console.log(req.path);
    console.log(req.orgName);
    console.log(req.params)
    if (skip.includes(req.path)) {
        return next();
    }

    if (!roles.includes(req.orgName)) {
        let e = new Error('Unauthorized User')
        e.status = 401
        generateError(e, next);
    }
    let paths = [
        "/mongo/project/projects-ngo",
        "/mongo/project/create",
        "/mongo/project/projects-corporate",
        "/mongo/project/all"]
    if (req.path.startsWith("/mongo/project")) {
        if (!paths.includes(req.path)) {
            return next();
        }
    }
    if (req.path.startsWith('/query/getRecord/') || req.path.startsWith('/mongo/user/notification/')) {
        return next();
    }
    if (!authMap[req.orgName].has(req.path) && !authMap['common'].has(req.path)) {
        let e = new Error('Unauthorized User')
        e.status = 401
        generateError(e, next);
    }

    logger.debug(`this role is authorized: orgName ${req.orgName}`)
    next();
})

// Login and Generate JWT Token
mainRouter.post('/users', async (req, res, next) => {
    let { email } = req.body;

    logger.debug(`email : ${email}`);

    if (!email) {
        return res.json(fieldErrorMessage('\'email\''));
    }
    // if (!password) {
    //     return res.json(fieldErrorMessage('\'password\''));
    // }

    //calling mongo login for password authentication
    let mongoResponse = {};
    let userName;
    let orgName;

    let user = email.split("@")[0];
    console.log(user);
    if (user.startsWith('ca') || user.startsWith('it')) {
        mongoResponse = { role: "CreditsAuthority", userName: user };
        userName = user;
        orgName = 'creditsauthority';
    } else {
        mongoResponse = await userService.login(email);
        if (mongoResponse.success === false) {
            logger.debug(`Authentication failed for the email ${email}`);
            return res.json(getMessage(false, mongoResponse.message));
        } else {
            orgName = mongoResponse.role.toLowerCase();
            userName = mongoResponse.userName;
        }
    }

    let payload = {
        orgName: orgName,
        userName: userName
    }

    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

    try {
        await registerUser(userName, orgName);
        return res.json({
            success: true,
            name: mongoResponse.name,
            role: mongoResponse.role,
            token: token,
            userName: mongoResponse.userName
        })
    }
    catch (e) {
        console.log("------------", e.message, Object.keys(e))
        if (e.message === `An identity for the user ${userName} already exists in the wallet`) {
            return res.json({
                success: true,
                name: mongoResponse.name,
                role: mongoResponse.role,
                token: token,
                userName: mongoResponse.userName
            })
        } else if (e.errors[0]['code'] === 0) {
            return res.json({
                success: true,
                name: mongoResponse.name,
                role: mongoResponse.role,
                token: token,
                userName: mongoResponse.userName
            })
        } else {
            generateError(e, next, 401, 'Unauthorized user');
        }
    }
});

// For testing purpose
mainRouter.use('/demo', demoRouter);

// Mongo Routers
mainRouter.use('/mongo/project', projectMongoRouter);
mainRouter.use('/mongo/user', userMongoRouter);
mainRouter.use('/mongo/file', fileMongoRouter);

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