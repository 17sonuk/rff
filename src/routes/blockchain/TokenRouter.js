var express = require('express');
var router = express.Router();
const getErrorMessage = require('../../utils/ErrorMsg');

var invoke = require('../../../app/invoke-transaction.js');

// Request Token transaction on chaincode on target peers.
router.post('/requestTokens', async function (req, res) {
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

// Assign Token transaction on chaincode on target peers.
router.post('/assignTokens', async function (req, res) {
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

// Assign Token transaction on chaincode on target peers.
router.post('/rejectTokens', async function (req, res) {
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
router.post('/transferTokens', async function (req, res) {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var qty = req.body.qty.toString();
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
    } else if (!qty) {
        res.json(getErrorMessage('\'qty\''));
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

    var args = [qty, projectId, phaseNumber, reviewMsg, rating, Date.now().toString(), uuid().toString(), uuid().toString()]
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

module.exports = router;