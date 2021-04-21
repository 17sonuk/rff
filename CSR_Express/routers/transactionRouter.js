const express = require('express');
const router = express.Router();

const { v4: uuid } = require('uuid');
const logger = require('../loggers/logger');
const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');
const { fieldErrorMessage, generateError, getMessage } = require('../utils/functions');

router.get('/parked-by-corporate', async (req, res, next) => {
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');

    //extract parameters from query.
    const parked = req.query.parked;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('parked : ' + parked);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
    }
    if (!parked) {
        res.json(getErrorMessage('\'parked\''));
    }

    let userDLTName = req.userName + "." + req.orgName.toLowerCase() + ".csr.com";

    let queryString = {
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

    args = JSON.stringify(queryString);
    logger.debug(args);

    try {
        const result = await query(req.userName, req.orgName, 'ReserveFundsForProject', chaincodeName, channelName, args);
        newObject = JSON.parse(result.toString());

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

            let projectResponse = await query(req.userName, req.orgName, 'GeneralQueryFunction', chaincodeName, channelName, args);
            projectResponse = projectResponse[0];
            newProjectObj = JSON.parse(projectResponse.toString());

            newObject[i]["Record"]["projectName"] = newProjectObj[0]["Record"]["projectName"]
            newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
            newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
        }
        newObject.success = true
        res.json(getMessage(true, newObject));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

module.exports = router;