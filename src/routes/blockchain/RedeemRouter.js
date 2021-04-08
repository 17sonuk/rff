const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');
const uuid = require('uuid');

const getErrorMessage = require('../../utils/ErrorMsg');
const splitOrgName = require('../../utils/splitOrgName');

var invoke = require('../../../app/invoke-transaction.js');
var query = require('../../../app/query.js');

//****************************** RedeemRequest *******************************
router.post('/request', async function (req, res) {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var qty = req.body.qty;
    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!qty) {
        res.json(getErrorMessage('\'quantity\''));
        return;
    }

    var args = [uuid().toString(), qty, Date.now().toString(), uuid().toString()]
    //add current UTC date(in epoch milliseconds) to args
    // args.push(Date.now().toString());
    // args.push(uuid().toString());
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "redeemRequest", args, req.username, req.orgname);
    res.send(message);
});

//****************************** Approve RedeemRequest *******************************
router.post('/approve', async function (req, res) {
    logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var uid = req.body.id;
    var bankTxId = req.body.bankTxId;
    var proofDocName = req.body.proofDocName;
    var proofDocHash = req.body.proofDocHash;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!uid) {
        res.json(getErrorMessage('\'uid\''));
        return;
    }

    var args = [uid, bankTxId, Date.now().toString(), uuid().toString(), proofDocName, proofDocHash]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "approveRedeemRequest", args, req.username, req.orgname);
    res.send(message);
});

// get All Redeem Requests
router.get('/request/all', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getAllRedeemRequests ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    var pageSize = req.query.pageSize;
    var bookmark = req.query.bookmark;
    var status = req.query.status;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('pageSize : ' + pageSize + ' bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!pageSize) {
        res.json(getErrorMessage('\'pageSize\''));
        return;
    }
    if (!status) {
        res.json(getErrorMessage('\'status\''));
        return;
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

    var args = [JSON.stringify(queryString), pageSize, bookmark]
    logger.debug('args : ' + args[0]);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunctionPagination", req.username, req.orgname);
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        var responseMetaObj = new Object()

        var msgList = message.toString().split("#");
        logger.debug(msgList[0]);
        logger.debug(msgList[1]);

        responseMetaObj = JSON.parse(msgList[1]);
        newObject = JSON.parse(msgList[0]);

        var finalResponse = {}
        var allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["recordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
        finalResponse["metaData"]["bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

        for (var i = 0; i < newObject.length; i++) {
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
});

module.exports = router;