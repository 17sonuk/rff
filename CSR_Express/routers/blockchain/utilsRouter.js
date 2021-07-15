require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const XLSX = require('xlsx')

const logger = require('../../loggers/logger');
const { generateError, getMessage } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');

//take a snapshot of all corporate balances on chaincode on target peers.
router.post('/snapshot/create', async (req, res, next) => {
    logger.debug('==================== INVOKE CREATE SNAPSHOT ON CHAINCODE ==================');

    let args = [Date.now().toString(), uuid().toString()];

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SnapshotCurrentCorporateBalances", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SnapshotCurrentCorporateBalances'));
    }
    catch (e) {
        generateError(e, next)
    }
});

//transfer unspent tokens to government.
router.post('/unspent/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER UNSPENT FUNDS TO GOVT ON CHAINCODE ==================');

    const govtAddress = req.body.govtAddress.toString();

    if (!govtAddress) {
        return res.json(getErrorMessage('\'govtAddress\''));
    }

    let args = [govtAddress, Date.now().toString(), uuid().toString()];

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "TransferUnspentTokensToGovt", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked TransferUnspentTokensToGovt'));
    }
    catch (e) {
        generateError(e, next)
    }
});

// Save IT data transaction on chaincode on target peers.
router.post('/add-corporate-email', async (req, res, next) => {
    logger.debug('==================== INVOKE ADD CORPORATE EMAIL ON CHAINCODE ==================')

    const corporateName = req.body.corporateName
    const email = req.body.email

    let args = [email, corporateName]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "AddCorporateEmail", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked AddCorporateEmail'));
    }
    catch (e) {
        generateError(e, next)
    }
});

// Save IT data transaction on chaincode on target peers.
router.post('/it-data', async (req, res, next) => {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')

    const year = req.query.year

    for (let i = 0; i < req.body.length; i++) {
        req.body[i].objectType = "Liability"
    }

    var args = [year, JSON.stringify(req.body)]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SaveItData", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SaveItData'));
    }
    catch (e) {
        generateError(e, next)
    }
});

async function saveITData(req, res, next, data) {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')

    const year = req.body.year

    for (let i = 0; i < data; i++) {
        req.body[i].objectType = "Liability"
    }

    let args = [year, JSON.stringify(data)]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SaveItData", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SaveItData'));
    }
    catch (e) {
        generateError(e, next)
    }
}

//excel upload
router.post('/upload-excel', async (req, res, next) => {
    logger.debug('==================== upload excel ==================');
    let wb = XLSX.read(req.body.fileData, { type: 'binary' });
    let sheet = wb.SheetNames[0];
    let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
    // console.log(rows)
    let temp = Object.keys(rows[0])
    if (!(temp.includes('email') && temp.includes('corporateName') && temp.includes('totalLiability'))) {
        return res.json(getMessage(false, 'Column names should be corporateName, email and totalLiability.'))
    }
    else {
        saveITData(req, res, next, rows)
    }
});

module.exports = router;