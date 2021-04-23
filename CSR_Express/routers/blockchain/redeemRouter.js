require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');

//****************************** RedeemRequest *******************************
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const qty = req.body.qty;
    if (!qty) {
        return res.json(fieldErrorMessage('\'quantity\''));
    }

    let args = [uuid().toString(), qty, Date.now().toString(), uuid().toString()]
    //add current UTC date(in epoch milliseconds) to args
    // args.push(Date.now().toString());
    // args.push(uuid().toString());
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "RedeemRequest", CHAINCODE_NAME, CHANNEL_NAME, args);
        res.json(getMessage(true, 'Successfully invoked RedeemRequest'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RedeemRequest', 401, next);
    }
});

//****************************** Approve RedeemRequest *******************************
router.post('/approve', async (req, res, next) => {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const uid = req.body.id;
    const bankTxId = req.body.bankTxId;
    const proofDocName = req.body.proofDocName;
    const proofDocHash = req.body.proofDocHash;

    if (!uid) {
        return res.json(fieldErrorMessage('\'uid\''));
    }

    let args = [uid, bankTxId, Date.now().toString(), uuid().toString(), proofDocName, proofDocHash]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "ApproveRedeemRequest", CHAINCODE_NAME, CHANNEL_NAME, args);
        res.json(getMessage(true, 'Successfully invoked ApproveRedeemRequest'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke ApproveRedeemRequest', 401, next);
    }
});

// get All Redeem Requests
router.get('/request/all', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllRedeemRequests ==================');
    const userDLTName = req.userName + "." + req.orgName.toLowerCase() + ".csr.com";

    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('pageSize : ' + pageSize + ' bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!pageSize) {
        return res.json(getErrorMessage('\'pageSize\''));
    }
    if (!status) {
        return res.json(getErrorMessage('\'status\''));
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
        let message = await query(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
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
        res.json(getMessage(true, finalResponse))
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
    catch (e) {
        generateError(e, 'Failed to query CommonQueryPagination', 401, next);
    }
});

module.exports = router;