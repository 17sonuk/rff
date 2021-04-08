const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');

const getErrorMessage = require('../../utils/ErrorMsg');
const splitOrgName = require('../../utils/splitOrgName');

var query = require('../../../app/query.js');

//get all parked amount tx by corporate 
router.get('/parked-by-corporate', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getAllParkedTxForCorporate ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var parked = req.query.parked;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('parked : ' + parked);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!parked) {
        res.json(getErrorMessage('\'parked\''));
        return;
    }

    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    var queryString = {
        "selector": {
            "docType": "Transaction",
            "txType": {},
            "from": userDLTName
        },
        "sort": [{ "date": "desc" }]
    }

    if (parked === "true") {
        queryString["selector"]["txType"]["$in"] = ["FundsToEscrowAccount", "FundsToEscrowAccount_snapshot"]
    } else {
        queryString["selector"]["txType"]["$in"] = ["TransferToken", "TransferToken_snapshot", "ReleaseFundsFromEscrow"]
    }
    logger.debug('queryString: ' + JSON.stringify(queryString));

    var args = [JSON.stringify(queryString)];
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        //console.log(message.toString())
        newObject = JSON.parse(message.toString())
        for (let i = 0; i < newObject.length; i++) {
            let objRef = newObject[i]["Record"]["objRef"]
            let projectQueryString = {
                "selector": {
                    "_id": objRef
                },
                "fields": ["projectName"]
            }

            if (parked === "true" || newObject[i]["Record"]["txType"] === 'ReleaseFundsFromEscrow') {
                projectQueryString["selector"]["_id"] = objRef.split('_')[1]
            }

            args = [JSON.stringify(projectQueryString)]
            let projectResponse = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
            projectResponse = projectResponse[0]
            newProjectObj = JSON.parse(projectResponse.toString());

            newObject[i]["Record"]["projectName"] = newProjectObj[0]["Record"]["projectName"]
            newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
            newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
        }
        newObject.success = true
        res.send(newObject)
    }
});

module.exports = router;