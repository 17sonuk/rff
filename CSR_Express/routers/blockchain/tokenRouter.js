require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const projectService = require('../../service/projectService');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');

// Request Token transaction on chaincode on target peers.- done
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REQUEST TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const bankTxId = req.body.bankTxId;
    const proofDocName = req.body.proofDocName;
    const proofDocHash = req.body.proofDocHash;

    if (!CHAINCODE_NAME) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
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
        await invoke(req.userName, req.orgName, "RequestTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        res.json(getMessage(true, 'Successfully invoked RequestTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RequestTokens', 401, next);
    }
});

// Assign Token transaction on chaincode on target peers. - dome
router.post('/assign', async (req, res, next) => {
    logger.debug('==================== INVOKE ASSIGN TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const bankTxId = req.body.bankTxId;

    if (!CHAINCODE_NAME) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
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
        await invoke(req.userName, req.orgName, "AssignTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        res.json(getMessage(true, 'Successfully invoked AssignTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke AssignTokens', 401, next);
    }
});

// Assign Token transaction on chaincode on target peers. - done
router.post('/reject', async (req, res, next) => {
    logger.debug('==================== INVOKE rejectTokens TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const bankTxId = req.body.bankTxId;
    const comment = req.body.comment;

    if (!CHAINCODE_NAME) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
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
        await invoke(req.userName, req.orgName, "RejectTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        res.json(getMessage(true, 'Successfully invoked RejectTokens'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke RejectTokens', 401, next);
    }
});

//tranfer token api
router.post('/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber.toString();
    const reviewMsg = req.body.reviewMsg;
    const rating = req.body.rating.toString();

    if (!CHAINCODE_NAME) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
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

    let args = [amount, projectId, phaseNumber, reviewMsg, rating, Date.now().toString(), uuid().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        //add contributor in mongoDB
        //assumption: mongo service won't fail.
        // projectService.addContributor(projectId, req.userName)
        //     .then((data) => {
        //         logger.debug(`transfer success ----- ${data}`)
        //         res.send(message);
        //     })
        //     .catch(err => {
        //         generateError(err, 'Failed to add contributor in mongo', 401, next);
        //     });
        res.json(getMessage(true, "Transferred succesfully"))
    }
    catch (e) {
        generateError(e, 'Failed to invoke TransferTokens', 401, next);
    }
});

// get All TokenRequests - done
router.get('/all-requests', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllTokenRequests ==================');
    const userDLTName = req.userName + "." + req.orgName.toLowerCase() + ".csr.com";

    const pageSize = req.query.pageSize;
    let bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('pageSize : ' + pageSize);
    logger.debug('bookmark : ' + bookmark);
    logger.debug('status : ' + status);

    if (!CHAINCODE_NAME) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!pageSize) {
        res.json(fieldErrorMessage('\'pageSize\''));
    }
    if (!status) {
        res.json(fieldErrorMessage('\'status\''));
    }
    if (!bookmark) {
        bookmark = '';
    }

    const queryString = {
        "selector": {
            "docType": "TokenRequest",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (req.orgName === 'creditsauthority') {
        logger.debug('CA has requested...')
    }
    else if (req.orgName === 'corporate') {
        queryString['selector']['from'] = userDLTName
    }
    else {
        res.json(getMessage(false, 'Unauthorised token tx request access...'))
    }

    let args = [JSON.stringify(queryString), String(pageSize), bookmark];
    args = JSON.stringify(args);
    logger.debug('args : ' + args);

    try {
        let message = await query(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());
        
        logger.debug(JSON.stringify(message, null, 2))

        if (message.toString().includes("Error:")) {
            let errorMessage = message.toString().split("Error:")[1].trim()
            res.json(getMessage(false, errorMessage))
        }
        else {
            message['Results'].forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
                elem['Record']['from'] = splitOrgName(elem['Record']['from'])
                elem['Record']['role'] = splitOrgName(elem['Record']['role'])
            })

            let finalResponse = {}

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];
            finalResponse['records'] = message['Results']
            res.json(getMessage(true, finalResponse));
        }
    }
    catch (e) {
        generateError(e, 'Failed to query CommonQueryPagination', 401, next);
    }
});

module.exports = router;