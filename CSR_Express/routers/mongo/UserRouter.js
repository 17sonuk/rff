const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const userService = require('../../service/userService');

logger.debug('<<<<<<<<<<<<<< user router >>>>>>>>>>>>>>>>>')

//Onboarding of user
router.post('/onboard', (req, res, next) => {
    logger.debug(`router-onboarding: ${req.body}`);

    userService.registerUser(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get user details
router.get('/profile', (req, res, next) => {
    logger.debug("router-getUserDetails");

    userService.getUserDetails(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/unapproved-users', (req, res, next) => {
    logger.debug(`router-getUnapprovedUsers: ${req.body}`);

    userService.getUnapprovedUserDetails()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//approve user
router.post('/approve-user', (req, res, next) => {
    logger.debug(`router-approveUser: ${req.body}`);

    userService.approveUser(req.body.userName, req.body.pan)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//login user
// router.post('/login', (req, res, next) => {
//     console.log("router-login", req.body);
//     let userName = req.body.userName;
//     let password = req.body.password;
//     if (userName.length < 4 && (userName.startsWith('ca2') || userName.startsWith('it'))) {
//         if (password !== 'test') {
//             res.json({ success: false, message: 'wrong credentials!' });
//             return;
//         }
//         res.json({ success: true, message: 'login successful', userName: req.body.userName, role: "csr" })
//     }
//     userService.login(userName, password)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })

//get profit amount of corporate for Current financial year
router.get('/profit-corporate', (req, res, next) => {
    logger.debug(`router-getProfitCorporate: ${req.body}`);

    userService.getAmountFromBalanceSheet(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get notification - true for unseen and false for seen
router.get('/notification/:seen', (req, res, next) => {
    logger.debug("router-getNotification");

    let name = req.username + "." + req.orgname + ".csr.com";
    userService.getNotifications(name, req.params.seen)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/notification', (req, res, next) => {
    logger.debug("router-updateNotification");

    let name = req.username + "." + req.orgname + ".csr.com";
    userService.updateNotification(name, req.body.txId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

module.exports = router;