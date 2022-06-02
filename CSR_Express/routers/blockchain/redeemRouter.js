require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
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
        return res.json(getMessage(true, messages.success.INVOKE_REDEEM));
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
        return res.json(getMessage(true, messages.success.INVOKE_APPROVE_REDEEM));
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
        return res.json(getMessage(true, messages.success.INVOKE_REJECT_REDEEM));
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
    const projectId = req.query.projectId;

    logger.debug('pageSize : ' + pageSize + ' bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }

    if (typeof pageSize === 'string' && typeof parseInt(pageSize) !== 'number') {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }
    let alpha = /^[.0-9a-zA-Z_-]*$/;
    if (typeof bookmark === 'string' && !bookmark.match(alpha)) {
        return res.json(fieldErrorMessage('\'bookmark\''));
    }

    if (!status) {
        return res.json(fieldErrorMessage('\'status\''));
    }

    // var queryString = {
    //     "selector": {
    //         "docType": "Redeem",
    //         "status": status
    //     },
    //     "sort": [{ "date": "asc" }]
    // }

    if (status.includes("[")) {
        let statusarr = []
        statusarr = JSON.parse(status);
        var queryString = {
            "selector": {
                "docType": "Redeem",
                "status": { $in: statusarr }
            },
            "sort": [{ "date": "asc" }]
        }
    } else {

        var queryString = {
            "selector": {
                "docType": "Redeem",
                "status": status
            },
            "sort": [{ "date": "asc" }]
        }
    }


    if (projectId) {
        queryString['selector']['projectId'] = projectId;
    }

    if (req.orgName === 'corporate') {
        queryString["fields"] = ["communityName", "communityPlace", "date", "docType", "forBeneficiary", "from", "key", "projectId", "projectName", "qty", "status"]
    }

    if (req.orgName === 'ngo') {
        queryString['selector']['from'] = userDLTName
    }

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);

    try {
        let redeemRequests = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        redeemRequests = JSON.parse(redeemRequests.toString());

        let finalResponse = {}
        let allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["recordsCount"] = redeemRequests["RecordsCount"];
        finalResponse["metaData"]["bookmark"] = redeemRequests["Bookmark"];

        for (let i = 0; i < redeemRequests['Results'].length; i++) {
            let req = redeemRequests['Results'][i];
            req['Record'] = JSON.parse(req['Record'])

            req['Record']['from'] = splitOrgName(req['Record']['from'])
            req['Record']['key'] = req['Key']
            allRecords.push(req['Record'])
        }

        finalResponse['records'] = allRecords
        return res.json(getMessage(true, finalResponse))
    }
    catch (e) {
        if (e.toString().includes("Invalid bookmark value")) {
            let error = {}
            error.message = "Invalid bookmark value";
            error.status = 400;
            next(error);
        }
        else {
            generateError(e, next);
        }
        // generateError(e, next);
    }
});

router.get('/request/forUserprofile', async (req, res, next) => {
    const userDLTName = req.query.ngo + "." + orgMap['ngo'] + "." + BLOCKCHAIN_DOMAIN + ".com";
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.status;
    const communityName = req.query.communityName ? decodeURIComponent(req.query.communityName) : '';
    const communityPlace = req.query.communityPlace ? decodeURIComponent(req.query.communityPlace) : '';
    const ngo = req.query.ngo;

    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }

    if (typeof pageSize === 'string' && typeof parseInt(pageSize) !== 'number') {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }
    let alpha = /^[.0-9a-zA-Z_-]*$/;
    if (typeof bookmark === 'string' && !bookmark.match(alpha)) {
        return res.json(fieldErrorMessage('\'bookmark\''));
    }

    if (!status) {
        return res.json(fieldErrorMessage('\'status\''));
    }

    if (!ngo && (!communityName && !communityPlace)) {
        return res.json({ success: false, message: messages.error.NGO_OR_COMMUNITY });
    }

    if (ngo && (communityName || communityPlace)) {
        return res.json({ success: false, message: messages.error.NGO_AND_COMMUNITY });
    }

    if (!ngo && (!communityName || !communityPlace)) {
        if (!communityName) {
            return res.json(fieldErrorMessage('\'communityName\''));
        } else {
            return res.json(fieldErrorMessage('\'communityPlace\''));
        }
    }

    let queryString = {
        "selector": {
            "docType": "Redeem",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (ngo) {
        queryString['selector']['from'] = userDLTName
    } else if (communityName && communityPlace) {
        queryString['selector']['communityName'] = communityName
        queryString['selector']['communityPlace'] = communityPlace
    }
    // else {
    //     return res.json({ success: false, message: messages.error.UNAUTHORISED_REDEEM_ACCESS })
    // }

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);
    logger.debug('args : ' + args);

    try {
        let redeemRequests = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        redeemRequests = JSON.parse(redeemRequests.toString());

        let finalResponse = {}
        let allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["recordsCount"] = redeemRequests["RecordsCount"];
        finalResponse["metaData"]["bookmark"] = redeemRequests["Bookmark"];

        for (let i = 0; i < redeemRequests['Results'].length; i++) {
            let req = redeemRequests['Results'][i];
            req['Record'] = JSON.parse(req['Record'])

            req['Record']['from'] = splitOrgName(req['Record']['from'])
            req['Record']['key'] = req['Key']
            allRecords.push(req['Record'])
        }

        finalResponse['records'] = allRecords
        return res.json(getMessage(true, finalResponse))
    }
    catch (e) {
        if (e.toString().includes("Invalid bookmark value")) {
            let error = {}
            error.message = "Invalid bookmark value";
            error.status = 400;
            next(error);
        }
        else {
            generateError(e, next);
        }
        // generateError(e, next);
    }
});


module.exports = router;