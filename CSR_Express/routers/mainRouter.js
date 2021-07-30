require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, CA_USERNAME, IT_EMAIL, GUEST_EMAIL } = process.env;

const express = require('express');
var jwt = require('jsonwebtoken');
const mainRouter = express.Router();

// Routers
const escrowRouter = require('./blockchain/escrowRouter');
const countryRouter = require('./country/countryRouter');
const fileMongoRouter = require('./mongo/fileRouter');
const commonMongoRouter = require('./mongo/commonRouter');
const projectMongoRouter = require('./mongo/projectRouter');
const projectRouter = require('./blockchain/projectRouter');
const pspRouter = require('./payment-gateway/pspRouter');
const queryRouter = require('./blockchain/queryRouter');
const redeemRouter = require('./blockchain/redeemRouter');
const tokenRouter = require('./blockchain/tokenRouter');
const transactionRouter = require('./blockchain/transactionRouter');
const userMongoRouter = require('./mongo/userRoute');
const utilsRouter = require('./blockchain/utilsRouter');

// Services
const registerUser = require('../fabric-sdk/registerUser');
const userService = require('../service/userService');

// Custom functions
const logger = require('../loggers/logger');
const checkJwt = require('../utils/checkJwt');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

// Authentication
mainRouter.use((req, res, next) => {
    let skip = ['/users', '/psp/coinbase/chargeStatus']
    //, '/country/countries', '/country/states', '/country/cities'
    console.log(req.path)
    if (skip.includes(req.originalUrl) || skip.includes(req.path)) {
        next();
    } else {
        let authHeader = '';
        // console.log('all cokies:', req.cookies)
        if (req.originalUrl === '/mongo/user/onboard' || req.originalUrl === '/mongo/user/checkUserNameValidity') {
            if (!req.headers.csrtoken) {
                return next();
            }
        }
        authHeader = req.headers.csrtoken;
        // console.log('cookie is: ', authHeader);
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
                    req.email = decoded.email;
                    req.name = decoded.name;
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

// Auth0
mainRouter.use(checkJwt);

mainRouter.use((req, res, next) => {

    let roles = ['ngo', 'corporate', 'creditsauthority'];
    //authorization logic
    let authMap = req.authMap;

    let e = new Error('Unauthorized User')
    e.status = 401

    if (req.path === '/mongo/user/onboard' && req.body['role'] === 'Ngo' && (req.userName !== CA_USERNAME || req.orgName !== 'creditsauthority')) {
        generateError(e, next);
    }

    let skip = ['/mongo/user/onboard', '/mongo/user/checkUserNameValidity', '/users', '/psp/coinbase/chargeStatus', '/country/countries', '/country/states', '/country/cities'];
    if (skip.includes(req.path)) {
        return next();
    }

    if (!roles.includes(req.orgName)) {
        generateError(e, next);
    }

    let guestForbiddenpaths = [
        "/mongo/project/projects-ngo",
        "/mongo/project/create",
        "/mongo/project/projects-corporate",
    ]

    if (req.userName === 'guest') {
        console.log('is guest')
        if (authMap[req.userName].has(req.path) || req.path === '/psp/coinbase/charge' || req.path.startsWith("/mongo/project/all") || req.path.startsWith("/query/getRecord") || (req.path.startsWith("/mongo/project") && !guestForbiddenpaths.includes('/mongo/project'))) {
            return next();
        } else {
            //console.log(authMap[req.userName].has(req.path))
            return generateError(e, next);
        }
    }

    let paths = [
        "/mongo/project/projects-ngo",
        "/mongo/project/create",
        "/mongo/project/projects-corporate",
        "/mongo/project/all"
    ]
    if (req.path.startsWith("/mongo/project")) {
        if (!paths.includes(req.path)) {
            return next();
        }
    }
    if (req.path.startsWith('/query/getRecord/') || req.path.startsWith('/mongo/user/notification/')) {
        return next();
    }

    if (!authMap[req.orgName].has(req.path) && !authMap['common'].has(req.path)) {
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

    //calling mongo login for password authentication
    let mongoResponse = {};
    let userName;
    let orgName;

    let user = email.split("@")[0];
    console.log(user);
    if (email === GUEST_EMAIL) {
        mongoResponse = { role: "Corporate", userName: user };
        userName = user;
        orgName = 'corporate';
    } else if (email === CA_EMAIL || email === IT_EMAIL) {
        mongoResponse = { role: "CreditsAuthority", userName: user };
        // userName = user;
        userName = 'ca'
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

    if (orgName === 'corporate' && userName !== 'guest') {
        payload.email = mongoResponse.email;
        payload.name = mongoResponse.name;
    }

    const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

    try {
        let walletExists = await registerUser(userName, orgName, true);
        if (walletExists) {
            let finalResponse = {
                success: true,
                name: 'Guest',
                role: mongoResponse.role,
                token: token,
                userName: mongoResponse.userName
            }
            if (userName !== 'guest') {
                finalResponse['name'] = mongoResponse.name;
            }

            // res.cookie('csrtoken', token, {
            //     maxAge: 1000 * 60 * 24,
            //     httpOnly: true,
            //     // sameSite: "none",
            //     // secure: false
            // })
            return res.json(finalResponse);
        } else {
            let err = new Error('Unauthorized user')
            err.status = 401;
            generateError(err, next)
        }
    }
    catch (e) {
        console.log("------------", e.message, Object.keys(e))
        generateError(e, next, 500, 'some error occurred');
    }
});



// Mongo Routers
mainRouter.use('/mongo/project', projectMongoRouter);
mainRouter.use('/mongo/user', userMongoRouter);
mainRouter.use('/mongo/file', fileMongoRouter);
mainRouter.use('/mongo/common', commonMongoRouter);

// Blockchain Routers
mainRouter.use('/escrow', escrowRouter);
mainRouter.use('/query', queryRouter);
mainRouter.use('/project', projectRouter);
mainRouter.use('/redeem', redeemRouter);
mainRouter.use('/token', tokenRouter);
mainRouter.use('/tx', transactionRouter);
mainRouter.use('/utils', utilsRouter);


// Country-state-city Router
mainRouter.use('/country', countryRouter);

// Payment Gateway Router
mainRouter.use('/psp', pspRouter);

mainRouter.use("*", (req, res, next) => {
    let error = new Error('Invalid request');
    error.status = 404;
    next(error);
});

module.exports = mainRouter;