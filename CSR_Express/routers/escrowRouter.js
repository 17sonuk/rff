const express = require('express');
const router = express.Router();

const { v4: uuid } = require('uuid');
const logger = require('../loggers/logger');
const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

router.post('/fund/reserve', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    //extract parameters from request body.
    var id = req.body.projectId;
    var amount = req.body.amount.toString();

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!amount) {
        res.json(fieldErrorMessage('\'amount\''));
    }
    if (!id) {
        res.json(fieldErrorMessage('\'projectID\''));
    }

    const currentdate = new Date(Date.now())
    let date = new Date("July 21, 2019 00:00:00")
    date.setFullYear(currentdate.getFullYear() + 3, 3, 30)
    date.setHours(0, 0, 0)

    let args = [id, amount, Date.now().toString(), uuid().toString(), date.valueOf().toString()]
    logger.debug('args  : ' + args);
    args = JSON.stringify(args);

    try {
        await invoke(req.userName, req.orgName, 'ReserveFundsForProject', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully Reserved funds!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

router.post('/fund/release', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const amount = req.body.amount.toString();
    const rating = req.body.rating.toString();
    const reviewMsg = req.body.reviewMsg;
    const phaseNumber = req.body.phaseNumber.toString();

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!amount) {
        res.json(fieldErrorMessage('\'amount\''));
    }
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    }

    let args = [projectId, amount, Date.now().toString(), uuid().toString(), rating, reviewMsg, phaseNumber]
    logger.debug('args  : ' + args);
    args = JSON.stringify(args);

    try {
        await invoke(req.userName, req.orgName, 'ReleaseFundsForProject', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully Released funds!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

module.exports = router;