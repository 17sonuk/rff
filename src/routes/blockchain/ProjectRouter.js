const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
const uuid = require('uuid');
const getErrorMessage = require('../../utils/ErrorMsg');
var invoke = require('../../../app/invoke-transaction.js');

//****************************** Create Project *******************************
// Create Project transaction on chaincode on target peers.
router.post('/create', async function (req, res) {
    logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //set extra attributes in request body.
    req.body["creationDate"] = Date.now();

    //modify all the criteria as per project object
    for (let i = 0; i < req.body.phases.length; i++) {
        let criteriaList = req.body.phases[i].validationCriteria;
        req.body.phases[i].validationCriteria = new Map();
        for (let j = 0; j < criteriaList.length; j++) {
            req.body.phases[i].validationCriteria[criteriaList[j]] = [];
        }
        logger.debug("criteria>>>>>>")
        logger.debug(req.body.phases[i].validationCriteria);
    }

    let projectId = uuid().toString()
    var args = [JSON.stringify(req.body), projectId, uuid().toString()];
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "createProject", args, req.username, req.orgname);
    message['projectId'] = projectId
    res.send(message);
});

//****************************** Update Project *******************************
router.post('/update', async function (req, res) {
    logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var status = req.body.status;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!status) {
        res.json(getErrorMessage('\'status\''));
        return;
    }

    var args = [projectId, phaseNumber, status, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "updateProject", args, req.username, req.orgname);
    res.send(message);
});

//****************************** Project Update Visible To *******************************
router.post('/updateVisibleTo', async function (req, res) {
    logger.debug('==================== INVOKE UPDATE VISIBLE TO ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var corporateName = req.body.corporateName;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!corporateName) {
        corporateName = "all"
    }

    var args = [projectId, corporateName, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "updateVisibleTo", args, req.username, req.orgname);
    res.send(message);
});

//****************************** validate a phase of a project
router.post('/validatePhase', async function (req, res) {
    logger.debug('==================== INVOKE VALIDATE PHASE TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var validated = req.body.validated;
    var rejectionComment = req.body.rejectionComment;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!validated) {
        res.json(getErrorMessage('\'validated\''));
        return;
    }

    var args = [projectId, phaseNumber, validated, rejectionComment, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "validatePhase", args, req.username, req.orgname);
    res.send(message);
});

//****************************** add a document hash against a criterion
router.post('/addDocumentHash', async function (req, res) {
    logger.debug('==================== INVOKE ADD DOCUMENT HASH TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var criterion = req.body.criterion;
    var docHash = req.body.docHash;
    var docName = req.body.docName;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!criterion) {
        res.json(getErrorMessage('\'criterion\''));
        return;
    } else if (!docHash) {
        res.json(getErrorMessage('\'docHash\''));
        return;
    } else if (!docName) {
        res.json(getErrorMessage('\'docName\''));
        return;
    }

    var args = [projectId, phaseNumber, criterion, docHash, docName, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "addDocumentHash", args, req.username, req.orgname);
    res.send(message);
});

module.exports = router;