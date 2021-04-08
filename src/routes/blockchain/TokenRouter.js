const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');
const uuid = require('uuid');

const getErrorMessage = require('../../utils/ErrorMsg');
const projectService = require('../../service/ProjectService');
const splitOrgName = require('../../utils/splitOrgName');

var invoke = require('../../../app/invoke-transaction.js');
var query = require('../../../app/query.js');

// Request Token transaction on chaincode on target peers.- done
router.post('/request', async function (req, res) {
    logger.debug('==================== INVOKE REQUEST TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var amount = req.body.amount.toString();
    var bankTxId = req.body.bankTxId;
    var proofDocName = req.body.proofDocName;
    var proofDocHash = req.body.proofDocHash;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!amount) {
        res.json(getErrorMessage('\'amount\''));
        return;
    } else if (!bankTxId) {
        res.json(getErrorMessage('\'bankTxId\''));
        return;
    } else if (!proofDocName) {
        res.json(getErrorMessage('\'proofDocName\''));
        return;
    } else if (!proofDocHash) {
        res.json(getErrorMessage('\'proofDocHash\''));
        return;
    }

    var args = [amount, "corporate.csr.com", bankTxId, proofDocName, proofDocHash]
    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString())
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "requestTokens", args, req.username, req.orgname);
    res.send(message);
});

// Assign Token transaction on chaincode on target peers. - dome
router.post('/assign', async function (req, res) {
    logger.debug('==================== INVOKE ASSIGN TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var bankTxId = req.body.bankTxId;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!bankTxId) {
        res.json(getErrorMessage('\'bankTxId\''));
        return;
    }

    var args = [bankTxId]
    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString());
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "assignTokens", args, req.username, req.orgname);
    res.send(message);
});

// Assign Token transaction on chaincode on target peers. - done
router.post('/reject', async function (req, res) {
    logger.debug('==================== INVOKE rejectTokens TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var bankTxId = req.body.bankTxId;
    var comment = req.body.comment;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!bankTxId) {
        res.json(getErrorMessage('\'bankTxId\''));
        return;
    } else if (!comment) {
        res.json(getErrorMessage('\'comment\''));
        return;
    }

    var args = [bankTxId]
    args.push(comment)
    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString());
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "rejectTokens", args, req.username, req.orgname);
    res.send(message);
});

//tranfer token api
router.post('/transfer', async function (req, res) {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var amount = req.body.amount.toString();
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber.toString();
    var reviewMsg = req.body.reviewMsg;
    var rating = req.body.rating.toString();

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!amount) {
        res.json(getErrorMessage('\'amount\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!reviewMsg) {
        res.json(getErrorMessage('\'reviewMsg\''));
        return;
    } else if (!rating) {
        res.json(getErrorMessage('\'rating\''));
        return;
    }

    var args = [amount, projectId, phaseNumber, reviewMsg, rating, Date.now().toString(), uuid().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "transferTokens", args, req.username, req.orgname);

    //add contributor in mongoDB
    //assumption: mongo service won't fail.
    projectService.addContributor(projectId, req.username)
        .then((data) => {
            res.send(message);
        })
        .catch(err => {
            logger.info(err);
            message['mongo'] = 'failed to add contributor in mongo';
            res.send(message);
        });
});

// get All TokenRequests - done
router.get('/all-requests', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getAllTokenRequests ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    var pageSize = req.query.pageSize;
    var bookmark = req.query.bookmark;
    var status = req.query.status;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('pageSize : ' + pageSize);
    logger.debug('bookmark : ' + bookmark);
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
            "docType": "TokenRequest",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (req.orgname === 'CreditsAuthority') {
        console.log('CA has requested...')
    }
    else if (req.orgname === 'Corporate') {
        queryString['selector']['from'] = userDLTName
    }
    else {
        res.send({ success: false, message: 'Unauthorised token tx request access...' })
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
        //newObject.success = true

        var finalResponse = {}
        var allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["recordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
        finalResponse["metaData"]["bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

        for (var i = 0; i < newObject.length; i++) {
            newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from'])
            newObject[i]['Record']['role'] = splitOrgName(newObject[i]['Record']['role'])
            allRecords.push(newObject[i]['Record'])
        }

        //newObject.success = true;
        //res.send(newObject);
        finalResponse['records'] = allRecords
        finalResponse['success'] = true
        res.send(finalResponse);
    }
});

module.exports = router;