const express = require('express');
const router = express.Router();
const uuid = require('uuid');

const logger = require('../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../utils/functions');

const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');

//****************************** RedeemRequest *******************************
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const qty = req.body.qty;
    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!qty) {
        res.json(fieldErrorMessage('\'quantity\''));
    }

    let args = [uuid().toString(), qty, Date.now().toString(), uuid().toString()]
    //add current UTC date(in epoch milliseconds) to args
    // args.push(Date.now().toString());
    // args.push(uuid().toString());
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "RedeemRequest", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked RedeemRequest'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RedeemRequest', 401, next);
    }
});

//****************************** Approve RedeemRequest *******************************
router.post('/approve', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const uid = req.body.id;
    const bankTxId = req.body.bankTxId;
    const proofDocName = req.body.proofDocName;
    const proofDocHash = req.body.proofDocHash;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!uid) {
        res.json(fieldErrorMessage('\'uid\''));
    }

    let args = [uid, bankTxId, Date.now().toString(), uuid().toString(), proofDocName, proofDocHash]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "ApproveRedeemRequest", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked ApproveRedeemRequest'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke ApproveRedeemRequest', 401, next);
    }
});

// get All Redeem Requests
router.get('/request/all', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllRedeemRequests ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('pageSize : ' + pageSize + ' bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
    }
    if (!pageSize) {
        res.json(getErrorMessage('\'pageSize\''));
    }
    if (!status) {
        res.json(getErrorMessage('\'status\''));
    }

    let queryString = {
        "selector": {
            "docType": "Redeem",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (req.orgname === 'CreditsAuthority') {
        console.log('CA has requested...')
    }
    else if (req.orgname === 'Ngo') {
        queryString['selector']['from'] = userDLTName
    }
    else {
        res.send({ success: false, message: 'Unauthorised redeem request access...' })
    }

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);
    logger.debug('args : ' + args[0]);

    try {
        const message = await query(req.userName, req.orgName, "GeneralQueryFunctionPagination", chaincodeName, channelName, args);
        let newObject = new Object()
        if (message.toString().includes("Error:")) {
            newObject.success = false
            newObject.message = message.toString().split("Error:")[1].trim()
            res.send(newObject)
        }
        else {
            let responseMetaObj = new Object()

            let msgList = message.toString().split("#");
            logger.debug(msgList[0]);
            logger.debug(msgList[1]);

            responseMetaObj = JSON.parse(msgList[1]);
            newObject = JSON.parse(msgList[0]);

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

            for (let i = 0; i < newObject.length; i++) {
                newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from'])
                newObject[i]['Record']['key'] = newObject[i]['Key']
                allRecords.push(newObject[i]['Record'])
            }

            finalResponse['records'] = allRecords
            finalResponse['success'] = true
            res.send(finalResponse);
            /*
                newObject = new Object()
                newObject = JSON.parse(message.toString())
        
                for(var i=0; i<newObject.length; i++) {
                    newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from'])
                }
        
                newObject.success = true;
                res.send(newObject);
            */
        }
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunctionPagination', 401, next);
    }
});

module.exports = router;