const express = require('express');
const router = express.Router();
const uuid = require('uuid');

const logger = require('../loggers/logger');
const projectService = require('../service/projectService');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../utils/functions');

const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');

// Request Token transaction on chaincode on target peers.- done
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REQUEST TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const bankTxId = req.body.bankTxId;
    const proofDocName = req.body.proofDocName;
    const proofDocHash = req.body.proofDocHash;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!amount) {
        res.json(fieldErrorMessage('\'amount\''));
    } else if (!bankTxId) {
        res.json(fieldErrorMessage('\'bankTxId\''));
    } else if (!proofDocName) {
        res.json(fieldErrorMessage('\'proofDocName\''));
    } else if (!proofDocHash) {
        res.json(fieldErrorMessage('\'proofDocHash\''));
    }

    let args = [amount, "corporate.csr.com", bankTxId, proofDocName, proofDocHash];

    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString());
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "RequestTokens", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked RequestTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RequestTokens', 401, next);
    }
});

// Assign Token transaction on chaincode on target peers. - dome
router.post('/assign', async (req, res, next) => {
    logger.debug('==================== INVOKE ASSIGN TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const bankTxId = req.body.bankTxId;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!bankTxId) {
        res.json(fieldErrorMessage('\'bankTxId\''));
    }

    let args = [bankTxId]
    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString());
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "AssignTokens", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked AssignTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke AssignTokens', 401, next);
    }
});

// Assign Token transaction on chaincode on target peers. - done
router.post('/reject', async (req, res, next) => {
    logger.debug('==================== INVOKE rejectTokens TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const bankTxId = req.body.bankTxId;
    const comment = req.body.comment;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!bankTxId) {
        res.json(fieldErrorMessage('\'bankTxId\''));
    } else if (!comment) {
        res.json(fieldErrorMessage('\'comment\''));
    }

    let args = [bankTxId]
    args.push(comment)

    //add current UTC date(in epoch milliseconds) to args
    args.push(Date.now().toString());
    args.push(uuid().toString());
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "RejectTokens", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked RejectTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RejectTokens', 401, next);
    }
});

//tranfer token api
router.post('/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber.toString();
    const reviewMsg = req.body.reviewMsg;
    const rating = req.body.rating.toString();

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!amount) {
        res.json(fieldErrorMessage('\'amount\''));
    } else if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!reviewMsg) {
        res.json(fieldErrorMessage('\'reviewMsg\''));
    } else if (!rating) {
        res.json(fieldErrorMessage('\'rating\''));
    }

    var args = [amount, projectId, phaseNumber, reviewMsg, rating, Date.now().toString(), uuid().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "TransferTokens", chaincodeName, channelName, args);
        //add contributor in mongoDB
        //assumption: mongo service won't fail.
        projectService.addContributor(projectId, req.userName)
            .then((data) => {
                res.send(message);
            })
            .catch(err => {
                logger.info(err);
                message['mongo'] = 'failed to add contributor in mongo';
                res.send(message);
            });
    }
    catch (e) {
        generateError(e, 'Failed to invoke TransferTokens', 401, next);
    }
});

// get All TokenRequests - done
router.get('/all-requests', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllTokenRequests ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const userDLTName = req.userName + "." + req.orgname.toLowerCase() + ".csr.com";

    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('pageSize : ' + pageSize);
    logger.debug('bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!pageSize) {
        res.json(fieldErrorMessage('\'pageSize\''));
    }
    if (!status) {
        res.json(fieldErrorMessage('\'status\''));
    }

    const queryString = {
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
        res.send(getMessage(false, 'Unauthorised token tx request access...'))
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
            //newObject.success = true

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

            for (let i = 0; i < newObject.length; i++) {
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
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunctionPagination', 401, next);
    }
});

module.exports = router;