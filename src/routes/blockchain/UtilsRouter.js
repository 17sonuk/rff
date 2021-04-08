const express = require('express');
const router = express.Router();

//take a snapshot of all corporate balances on chaincode on target peers.
router.post('/snapshot/create', async function (req, res) {
    logger.debug('==================== INVOKE CREATE SNAPSHOT ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    var args = [Date.now().toString(), uuid().toString()];
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "snapshotCurrentCorporateBalances", args, req.username, req.orgname);
    res.send(message);
});

//transfer unspent tokens to government.
router.post('/unspent/transfer', async function (req, res) {
    logger.debug('==================== INVOKE TRANSFER UNSPENT FUNDS TO GOVT ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    var govtAddress = req.body.govtAddress.toString();

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!govtAddress) {
        res.json(getErrorMessage('\'govtAddress\''));
        return;
    }

    var args = [govtAddress, Date.now().toString(), uuid().toString()];
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "transferUnspentTokensToGovt", args, req.username, req.orgname);
    res.send(message);
});

// Save IT data transaction on chaincode on target peers.
router.post('/add-corporate-pan', async function (req, res) {
    logger.debug('==================== INVOKE ADD CORPORATE PAN ON CHAINCODE ==================')
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
    var chaincodeName = req.header('chaincodeName')
    var channelName = req.header('channelName')
    logger.debug('channelName  : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)

    var corporateName = req.body.corporateName
    var panNumber = req.body.panNumber
    var args = [panNumber, corporateName]
    logger.debug('args: ' + args)

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "addCorporatePan", args, req.username, req.orgname)
    res.send(message)
});

// Save IT data transaction on chaincode on target peers.
router.post('/it-data', async function (req, res) {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
    var chaincodeName = req.header('chaincodeName')
    var channelName = req.header('channelName')
    logger.debug('channelName  : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)

    var year = req.query.year

    for (let i = 0; i < req.body.length; i++) {
        req.body[i].objectType = "Liability"
    }

    var args = [year, JSON.stringify(req.body)]
    logger.debug('args: ' + args)

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "saveItData", args, req.username, req.orgname)
    res.send(message)
});

async function saveITData(req, res, data) {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
    var chaincodeName = req.header('chaincodeName')
    var channelName = req.header('channelName')
    logger.debug('channelName  : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)

    var year = req.body.year

    for (let i = 0; i < data; i++) {
        req.body[i].objectType = "Liability"
    }

    var args = [year, JSON.stringify(data)]
    logger.debug('args: ' + args)

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "saveItData", args, req.username, req.orgname)
    res.send(message)
}

//excel upload
router.post('/upload-excel', (req, res) => {
    logger.debug('==================== upload excel ==================');
    let wb = XLSX.read(req.body.fileData, { type: 'binary' });
    let sheet = wb.SheetNames[0];
    let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
    // console.log(rows)
    let temp = Object.keys(rows[0])
    if (!(temp.includes('panNumber') && temp.includes('corporateName') && temp.includes('totalLiability'))) {
        res.send({ success: false, message: 'Column names should be corporateName, panNumber and totalLiability.' })
    }
    else saveITData(req, res, rows)
});

module.exports = router;