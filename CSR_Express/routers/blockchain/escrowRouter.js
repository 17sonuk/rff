require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

const express = require('express');
const router = express.Router();

const { v4: uuid } = require('uuid');
const logger = require('../../loggers/logger');
const invoke = require('../../fabric-sdk/invoke');

const { fieldErrorMessage, generateError, getMessage } = require('../../utils/functions');

router.post('/fund/reserve', async (req, res, next) => {

    //extract parameters from request body.
    var id = req.body.projectId;
    var amount = req.body.amount.toString();

    if (!amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (!id) {
        return res.json(fieldErrorMessage('\'projectID\''));
    }

    const currentdate = new Date(Date.now())
    let date = new Date("July 21, 2019 00:00:00")
    date.setFullYear(currentdate.getFullYear() + 3, 3, 30)
    date.setHours(0, 0, 0)

    let args = [id, amount, Date.now().toString(), uuid().toString(), date.valueOf().toString()]
    logger.debug('args  : ' + args);
    args = JSON.stringify(args);

    try {
        await invoke.main(req.userName, req.orgName, 'ReserveFundsForProject', CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully Reserved funds!'));
    }
    catch (e) {
        generateError(e, next);
    }
});

router.post('/fund/release', async (req, res, next) => {

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const amount = req.body.amount.toString();
    const rating = req.body.rating.toString();
    const reviewMsg = req.body.reviewMsg;
    const phaseNumber = req.body.phaseNumber.toString();

    if (!amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    }

    let args = [projectId, amount, Date.now().toString(), uuid().toString(), rating, reviewMsg, phaseNumber]
    logger.debug('args  : ' + args);
    args = JSON.stringify(args);

    try {
        await invoke.main(req.userName, req.orgName, 'ReleaseFundsForProject', CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully Released funds!'));
    }
    catch (e) {
        generateError(e, next);
    }
});

module.exports = router;