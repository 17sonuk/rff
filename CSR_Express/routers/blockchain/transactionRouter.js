require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;

const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');
const query = require('../../fabric-sdk/query');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

router.get('/parked-by-corporate', async (req, res, next) => {
    let userDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "txType": "TransferToken",
            "from": userDLTName
        },
        "sort": [{ "date": "desc" }]
    }

    let args = JSON.stringify(queryString);
    logger.debug(args);

    try {
        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        for (let i = 0; i < message.length; i++) {
            let objRef = message[i]["Record"]["objRef"]
            let projectQueryString = {
                "selector": {
                    "_id": objRef
                },
                "fields": ["projectName"]
            }

            args = [JSON.stringify(projectQueryString)]

            let projectResponse = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
            projectResponse = JSON.parse(projectResponse.toString());

            projectResponse.forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })

            message[i]["Record"]["projectName"] = projectResponse[0]["Record"]["projectName"]
            message[i]["Record"]["from"] = splitOrgName(message[i]["Record"]["from"])
            message[i]["Record"]["to"] = splitOrgName(message[i]["Record"]["to"])
        }
        return res.json(getMessage(true, message));
    }
    catch (e) {
        generateError(e, next)
    }
});

// // get snapshot and transfer to gov Transactions for CA : not using
// router.get('/transactions', async function (req, res, next) {

//     let queryString = {
//         "selector": {
//             "docType": "Transaction",
//             "from": req.userName + '.' + ORG1_NAME + '.' + BLOCKCHAIN_DOMAIN + ".com"
//         }
//     }

//     const args = JSON.stringify(queryString)

//     try {
//         let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
//         message = JSON.parse(message.toString());

//         message.forEach(elem => {
//             elem['Record'] = JSON.parse(elem['Record'])
//         })

//         return res.json(getMessage(true, message));
//     }
//     catch (e) {
//         generateError(e, next);
//     }
// });

module.exports = router;