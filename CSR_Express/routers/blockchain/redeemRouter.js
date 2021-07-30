require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

//****************************** RedeemRequest *******************************
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const qty = req.body.qty;
    console.log('QTY::::::::::::: ' + qty)
    const paymentDetails = req.body.paymentDetails

    if (!qty) {
        return res.json(fieldErrorMessage('\'quantity\''));
    }
    if (!paymentDetails) {
        return res.json(fieldErrorMessage('\'paymentDetails\''));
    }
    const paymentTypes = ['Paypal', 'Cryptocurrency', 'Bank']
    if (!paymentDetails.paymentType || !paymentTypes.includes(paymentDetails.paymentType)) {
        return res.json(fieldErrorMessage('\'payment type\''));
    }

    if (paymentDetails.paymentType === 'Paypal' && !paymentDetails.paypalEmailId) {
        return res.json(fieldErrorMessage('\'paypal email id of beneficiary\''));
    }
    if (paymentDetails.paymentType === 'Cryptocurrency' && !paymentDetails.cryptoAddress) {
        return res.json(fieldErrorMessage('\'crypto address of beneficiary\''));
    }
    if (paymentDetails.paymentType === 'Bank') {
        if (!paymentDetails.bankDetails)
            return res.json(fieldErrorMessage('\'bank account details of beneficiary\''));
        if (paymentDetails.bankDetails.isUSBank === undefined)
            return res.json(fieldErrorMessage('\'is US bank\''));
        if (!paymentDetails.bankDetails.bankName)
            return res.json(fieldErrorMessage('\'bank name\''));
        if (!paymentDetails.bankDetails.bankAddress)
            return res.json(fieldErrorMessage('\'bank address\''));
        if (!paymentDetails.bankDetails.bankAddress.city)
            return res.json(fieldErrorMessage('\'bank address city\''));
        if (!paymentDetails.bankDetails.bankAddress.country)
            return res.json(fieldErrorMessage('\'bank address country\''));
        if (!paymentDetails.bankDetails.currencyType)
            return res.json(fieldErrorMessage('\'currency type\''));
    }

    let args = [uuid().toString(), JSON.stringify(req.body), Date.now().toString(), uuid().toString()]
    //let args = [uuid().toString(), amount, receiverId, Date.now().toString(), uuid().toString()]
    //added current UTC date(in epoch milliseconds) to args
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "RedeemRequest", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked RedeemRequest'));
    } catch (e) {
        generateError(e, next);
    }
});

//****************************** Approve RedeemRequest *******************************
router.post('/approve', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const redeemId = req.body.redeemId;
    const paymentId = req.body.paymentId;

    if (!redeemId) {
        return res.json(fieldErrorMessage('\'redeemId\''));
    }
    if (!paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }

    let args = [redeemId, paymentId, Date.now().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "ApproveRedeemRequest", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked ApproveRedeemRequest'));
    } catch (e) {
        generateError(e, next);
    }
});

//****************************** Reject RedeemRequest *******************************
router.post('/reject', async (req, res, next) => {
    logger.debug('==================== INVOKE REJECT REDEEM REQUEST ON CHAINCODE ==================');

    var redeemId = req.body.redeemId;
    let rejectionComments = req.body.rejectionComments;

    if (!redeemId) {
        return res.json(fieldErrorMessage('\'redeemId\''));
    }
    if (!rejectionComments) {
        return res.json(fieldErrorMessage('\'rejectionComments\''));
    }

    let args = [redeemId, rejectionComments, Date.now().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "RejectRedeemRequest", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked RejectRedeemRequest'));
    }
    catch (e) {
        generateError(e, next);
    }
});

// get All Redeem Requests
router.get('/request/all', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllRedeemRequests ==================');
    const userDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";

    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('pageSize : ' + pageSize + ' bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }
    if (!status) {
        return res.json(fieldErrorMessage('\'status\''));
    }

    let queryString = {
        "selector": {
            "docType": "Redeem",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (req.orgName === 'creditsauthority') {
        logger.debug('CA has requested...')
    }
    else if (req.orgName === 'ngo') {
        queryString['selector']['from'] = userDLTName
    }
    else {
        return res.json({ success: false, message: 'Unauthorised redeem request access...' })
    }

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message['Results'].forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })
        let newObject = message['Results'];

        let finalResponse = {}
        let allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
        finalResponse["metaData"]["bookmark"] = message["Bookmark"];

        for (let i = 0; i < newObject.length; i++) {
            newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from'])
            newObject[i]['Record']['key'] = newObject[i]['Key']
            allRecords.push(newObject[i]['Record'])
        }

        finalResponse['records'] = allRecords
        return res.json(getMessage(true, finalResponse))
        /*
            newObject = new Object()
            newObject = JSON.parse(message.toString())
    
            for(var i=0; i<newObject.length; i++) {
                newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from'])
            }
    
            newObject.success = true;
            return res.send(newObject);
        */
    }
    catch (e) {
        generateError(e, next);
    }
});

module.exports = router;