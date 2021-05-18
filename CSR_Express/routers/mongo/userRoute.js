const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');
const { generateError, getMessage } = require('../../utils/functions');

const userService = require('../../service/userService');

const registerUser = require('../../fabric-sdk/registerUser');

logger.debug('<<<<<<<<<<<<<< user router >>>>>>>>>>>>>>>>>')

//Onboarding of user
router.post('/onboard', (req, res, next) => {
    logger.debug(`router-onboarding: ${JSON.stringify(req.body, null, 2)}`);

    userService.registerUser(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get user details
router.get('/profile', (req, res, next) => {
    logger.debug("router-getUserDetails");
    // if(req.email !== req.query.email){
    //     let err= new Error('Unauthorized user!')
    //     err.status=401
    //     return next(err)
    // }
    userService.getUserDetails(req.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/unapproved-users', (req, res, next) => {
    logger.debug(`router-getUnapprovedUsers`);

    userService.getUnapprovedUserDetails()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//approve user
router.post('/approve-user', async (req, res, next) => {
    logger.debug(`router-approveUser: ${JSON.stringify(req.body, null, 2)}`);

    try {
        let orgName = await userService.approveUser(req.body.userName);
        try {
            await registerUser(req.body.userName, orgName);
            return res.json(getMessage(true, "User approved successfully!"));
        } catch (registerError) {
            if (registerError.status === 400) {
                return generateError(registerError, next, 400, `${req.body.userName} is already registered in blockchain`);
            }
            try {
                await userService.resetUserStatus(req.body.userName)
                return generateError(registerError, next, 500, 'Couldn\'t register user in blockchain!');
            } catch (resetStatusError) {
                return generateError(resetStatusError, next);
            }
        }
    } catch (approveErr) {
        return generateError(approveErr, next);
    }
})

//reject user
router.post('/reject-user', (req, res, next) => {
    logger.debug(`router-rejectUser: ${JSON.stringify(req.body, null, 2)}`);

    userService.rejectUser(req.body.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get profit amount of corporate for Current financial year
router.get('/profit-corporate', (req, res, next) => {
    logger.debug(`router-getProfitCorporate: ${JSON.stringify(req.body, null, 2)}`);

    userService.getAmountFromBalanceSheet(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get notification - true for unseen and false for seen
router.get('/notification/:seen', (req, res, next) => {
    logger.debug("router-getNotification");

    if (req.userName.startsWith('ca')) {
        req.userName = 'ca';
    }

    let name = req.userName + "." + req.orgName + ".csr.com";

    userService.getNotifications(name, req.params.seen)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/notification', (req, res, next) => {
    logger.debug("router-updateNotification");
    if (req.userName.startsWith('ca')) {
        req.userName = 'ca';
    }

    let name = req.userName + "." + req.orgName + ".csr.com";
    userService.updateNotification(name, req.body.txId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

module.exports = router;