const express = require('express');
const { v4: uuid } = require('uuid');
const projectRouter = express.Router();
const enrollAdmin = require('../fabric-sdk/enrollAdmin');
const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');
const registerUser = require('../fabric-sdk/registerUser');
const { generateError, getMessage } = require('../utils/functions');

projectRouter.get('/enrollAdmin', async (req, res, next) => {
    let orgName = req.query.orgName;
    try {
        await enrollAdmin(orgName);
        res.json(getMessage(true, 'Successfully enrolled'));
    }
    catch (e) {
        generateError(e, 'Failed to enroll', 401, next);
    }
});

projectRouter.get('/registerUser', async (req, res, next) => {
    let orgName = req.query.orgName;
    let userName = req.query.userName;
    try {
        await registerUser(userName, orgName);
        res.json(getMessage(true, 'Successfully registered'));
    }
    catch (e) {
        generateError(e, 'Failed to register', 401, next);
    }
});

projectRouter.post('/invoke', async (req, res, next) => {
    let orgName = req.query.orgName;
    let userName = req.query.userName;
    let fcName = req.query.fcName;
    let ccName = req.query.ccName;
    let channelName = req.query.channelName;

    let amount = req.body.amount.toString();
    let bankTxId = req.body.bankTxId;
    let proofDocName = req.body.proofDocName;
    let proofDocHash = req.body.proofDocHash;
    let args = [amount, "corporate.csr.com", bankTxId, proofDocName, proofDocHash];
    args.push(Date.now().toString());
    args.push(uuid().toString())
    args = JSON.stringify(args);
    try {
        await invoke(userName, orgName, fcName, ccName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

projectRouter.get('/query', async function (req, res, next) {
    let orgName = req.query.orgName;
    let fcName = req.query.fcName;
    let ccName = req.query.ccName;
    let channelName = req.query.channelName;
    let args = {
        "selector": {
            "docType": "TokenRequest"
        }
    }
    try {
        let result = await query('userName', orgName, fcName, ccName, channelName, JSON.stringify(args));
        res.json(getMessage(true, result));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

projectRouter.get('/testQuery', async function (req, res, next) {
    try {
        res.json(getMessage(true, '123'));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

module.exports = projectRouter;