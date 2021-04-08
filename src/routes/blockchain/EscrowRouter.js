const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');
const uuid = require('uuid');

const getErrorMessage = require('../../utils/ErrorMsg');
const projectService = require('../../service/ProjectService');

var invoke = require('../../../app/invoke-transaction.js');

//****************************** ReserveFunds *******************************
router.post('/fund/reserve', async function (req, res) {
    logger.debug('==================== INVOKE RESERVE FUNDS TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var id = req.body.projectId;
    var amount = req.body.amount.toString();

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!amount) {
        res.json(getErrorMessage('\'amount\''));
        return;
    } else if (!id) {
        res.json(getErrorMessage('\'projectID\''));
        return;
    }

    var currentdate = new Date(Date.now())
    var date = new Date("July 21, 2019 00:00:00")
    date.setFullYear(currentdate.getFullYear() + 3, 3, 30)
    date.setHours(0, 0, 0)

    var args = [id, amount, Date.now().toString(), uuid().toString(), date.valueOf().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "reserveFundsForProject", args, req.username, req.orgname);
    res.send(message);
});

//****************************** ReleaseFunds *******************************
router.post('/fund/release', async function (req, res) {
    logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var amount = req.body.amount.toString();
    var rating = req.body.rating.toString();
    var reviewMsg = req.body.reviewMsg;
    var phaseNumber = req.body.phaseNumber.toString();

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
    }

    var args = [projectId, amount, Date.now().toString(), uuid().toString(), rating, reviewMsg, phaseNumber]
    //add current UTC date(in epoch milliseconds) to args
    // args.push(Date.now().toString());
    // args.push(uuid().toString());
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "releaseFundsForProject", args, req.username, req.orgname);

    //add contributor in mongoDB
    //assumption: mongo service is fail safe.
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