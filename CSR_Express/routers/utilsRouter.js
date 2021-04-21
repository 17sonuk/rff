const express = require('express');
const router = express.Router();

const { v4: uuid } = require('uuid');
const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

//take a snapshot of all corporate balances on chaincode on target peers.
router.post('/snapshot/create', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    let orgName = req.query.orgName;
    let userName = req.query.userName;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }

    const args = [Date.now().toString(), uuid().toString()];
    logger.debug('args  : ' + args);

    try {
        await invoke(userName, orgName, 'SnapshotCurrentCorporateBalances', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully snapshot!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

//transfer unspent tokens to government.
router.post('/unspent/transfer', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    let orgName = req.query.orgName;
    let userName = req.query.userName;

    var govtAddress = req.body.govtAddress.toString();

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!govtAddress) {
        res.json(fieldErrorMessage('\'govtAddress\''));
    }

    const args = [govtAddress, Date.now().toString(), uuid().toString()];
    logger.debug('args  : ' + args);

    try {
        await invoke(userName, orgName, 'TransferUnspentTokensToGovt', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully transferred unspent tokens to govt.!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

// Save IT data transaction on chaincode on target peers.
router.post('/add-corporate-pan', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    let orgName = req.query.orgName;
    let userName = req.query.userName;

    const corporateName = req.body.corporateName
    const panNumber = req.body.panNumber

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!govtAddress) {
        res.json(fieldErrorMessage('\'govtAddress\''));
    }

    const args = [panNumber, corporateName]
    logger.debug('args: ' + args)

    try {
        await invoke(userName, orgName, 'AddCorporatePan', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully added PAN of corporate!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

router.post('/it-data', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    let orgName = req.query.orgName;
    let userName = req.query.userName;

    var year = req.query.year

    for (let i = 0; i < req.body.length; i++) {
        req.body[i].objectType = "Liability"
    }

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!year) {
        res.json(fieldErrorMessage('\'year\''));
    }

    const args = [year, JSON.stringify(req.body)]
    logger.debug('args: ' + args)

    try {
        await invoke(userName, orgName, 'SaveItData', chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully saved IT data!'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke', 401, next);
    }
});

async function saveITData(req, res, data) {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')

    const chaincodeName = req.header('chaincodeName')
    const channelName = req.header('channelName')
    logger.debug('channelName  : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)

    const year = req.body.year

    for (let i = 0; i < data; i++) {
        req.body[i].objectType = "Liability"
    }

    const args = [year, JSON.stringify(data)]
    logger.debug('args: ' + args)

    let message = await invoke(userName, orgName, 'SaveItData', chaincodeName, channelName, args);
    res.send(message)
}

router.post('/upload-excel', async (req, res, next) => {
    logger.debug('==================== upload excel ==================');
    const fileData = req.body.fileData

    if (!fileData) {
        res.json(fieldErrorMessage('\'fileData\''));
    }

    let wb = XLSX.read(req.body.fileData, { type: 'binary' });
    let sheet = wb.SheetNames[0];
    let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
    // console.log(rows)

    let temp = Object.keys(rows[0])
    if (!(temp.includes('panNumber') && temp.includes('corporateName') && temp.includes('totalLiability'))) {
        res.send({ success: false, message: 'Column names should be corporateName, panNumber and totalLiability.' })
    }
    else saveITData(req, res, rows)
});

module.exports = router;