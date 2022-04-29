require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN, CA_USERNAME } = process.env;

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { orgModel } = require('../../model/models');

const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const query = require('../../fabric-sdk/query');

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

// get fund raised and contributors for particular ngo
router.get('/funds-raised-by-ngo', async function (req, res, next) {

    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": req.userName + '.' + ORG3_NAME + '.' + BLOCKCHAIN_DOMAIN + ".com"
        },
        "fields": ["contributors", "phases"]
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let contributors = [];
        let amount = 0;

        for (let i = 0; i < message.length; i++) {
            contributors.push(...Object.keys(message[i].Record.contributors))

            let phases = message[i].Record.phases
            for (let j = 0; j < phases.length; j++) {
                amount += phases[j].qty - phases[j].outstandingQty
            }
        }

        contributors = [...new Set(contributors)].length
        return res.json(getMessage(true, { fundsRaised: amount, contributorsCount: contributors }));
    }
    catch (e) {
        generateError(e, next)
    }
});

// get a specific record by key 
router.get('/getRecord', async function (req, res, next) {

    const recordKey = req.query.id;

    if (!recordKey) {
        return res.json(fieldErrorMessage('\'recordKey\''));
    }

    let queryString = {
        "selector": {
            "_id": recordKey
        }
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());
        console.log('message response: ', message)

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        if (message.length > 0) {
            if (message[0]['Record']['docType'] === 'Project') {
                message = message[0]
                message['Record']['ngo'] = splitOrgName(message['Record']['ngo'])
                // message['Record']['totalReceived'] = 0;
                message['Record']['totalReceived'] = message['Record'].totalReceived;
                let fundReceived = 0

                for (let f = 0; f < message['Record'].phases.length; f++) {
                    fundReceived = (message['Record'].phases[f]['qty'] - message['Record'].phases[f]['outstandingQty'])
                    //message['Record']['totalReceived'] += fundReceived
                    message['Record'].phases[f]['fundReceived'] = fundReceived
                    message['Record'].phases[f]['percentageFundReceived'] = (fundReceived / message['Record'].phases[f]['qty']) * 100

                    if (message["Record"].phases[f]["phaseState"] !== "Created") {
                        message["Record"]["currentPhase"] = f + 1;
                    }

                    Object.keys(message["Record"]['contributions']).forEach(function (key) {
                        let newkey = key.split(".")[0];
                        message["Record"]['contributions'][newkey] = message["Record"]['contributions'][key];
                        delete message["Record"]['contributions'][key];
                        //message["Record"]['contributions'][newkey]['donatorAddress'] = splitOrgName(message["Record"]['contributions'][newkey]['donatorAddress'])
                    });
                }

                message['Record']['contributors'] = Object.keys(message['Record']['contributors']).map(splitOrgName)
                let timeDifference = Date.now() - message['Record']['creationDate']
                if (timeDifference < 0) {
                    timeDifference = 0
                }
                message['Record']['daysPassed'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                let startDate = message['Record'].phases[0]['startDate']
                let timeDiff = startDate - Date.now()
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                message['Record']['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                timeDiff = Date.now() - startDate
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                message['Record']['daysPassed'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            } else {
                return res.json(getMessage(true, message[0]));
            }
        } else {
            let e = new Error(messages.error.NO_PROJECT);
            e.status = 404;
            generateError(e, next);
        }

        logger.debug(`Modified response :  ${JSON.stringify(message, null, 2)}`);
        return res.json(getMessage(true, message));
    }
    catch (e) {
        generateError(e, next)
    }
});

// get balance
router.get('/balance', async function (req, res, next) {
    let userDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";

    let response = {
        'balance': 0
    }

    let queryString = {
        "selector": {
            "_id": {
                "$in": [
                    userDLTName
                ]
            }
        }
    }

    let args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        let newObject = JSON.parse(message.toString())

        for (let i = 0; i < newObject.length; i++) {
            response['balance'] = Number(newObject[i]['Record'])
        }

        // if (req.orgName === 'corporate') {
        //     queryString = {
        //         'selector': {
        //             'docType': "EscrowDetails",
        //             'corporate': userDLTName
        //         },
        //         'fields': ['funds']
        //     }

        //     args = JSON.stringify(queryString)
        //     logger.debug(`query string:\n ${args}`);

        //     //query esrow balance
        //     message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        //     logger.debug(`response message: ${message.toString()}`);

        //     message = JSON.parse(message.toString())

        //     for (let i = 0; i < message.length; i++) {
        //         message[i]['Record'] = JSON.parse(message[i]['Record'])
        //         let funds = message[i]['Record']['funds']
        //         for (let j = 0; j < funds.length; j++) {
        //             response['escrowBalance'] += funds[j]['qty']
        //         }
        //     }
        //     response.success = true;       // +++++++++++++++++++++++++++++++
        // }
        return res.json(getMessage(true, response));
    }
    catch (e) {
        generateError(e, next);
    }
});


router.get('/corporateReport-userProfile', async function (req, res, next) {
    try {
        let result = []

        let donorList = await orgModel.find({ role: "Corporate" }, { _id: 0, subRole: 1, userName: 1, firstName: 1, lastName: 1, orgName: 1, email: 1, active: 1 })
        console.log("donorList : ", donorList)
        let donorMap = {}
        let queryCorporate = []

        let guestData = {
            "userName": "guest",
            "firstName": '',
            "lastName": '',
            "orgName": '',
            "fundsDonated": 0,
            "projectsFunded": [],
            "projectsFundedCount": 0
        }
        donorList.push(guestData)

        for (i = 0; i < donorList.length; i++) {
            let donor = donorList[i]
            if (donor.userName == 'guest') {
                //data not coming from mongo
                donorMap[donor.userName] = donor
            } else {

                // data coming from mongo i.e. why toJSON is used
                // donorMap[donor.userName] = donor.toJSON()

                donorMap[donor.userName] = {}

                donorMap[donor.userName]['firstName'] = donor.firstName
                donorMap[donor.userName]['lastName'] = donor.lastName
                donorMap[donor.userName]['orgName'] = donor.orgName
                donorMap[donor.userName]['userName'] = donor.userName
                donorMap[donor.userName]['email'] = donor.email
                donorMap[donor.userName]['subRole'] = donor.subRole
                donorMap[donor.userName]['active'] = donor.active
            }

            donorMap[donor.userName]["fundsDonated"] = 0
            donorMap[donor.userName]["projectsFunded"] = []
            donorMap[donor.userName]["projectsFundedCount"] = 0
            // console.log('from for loop', donor)

            let donorAdd = donor.userName + "." + ORG2_NAME + "." + BLOCKCHAIN_DOMAIN + ".com"
            queryCorporate.push(donorAdd)
        }
        // console.log('outside loop', donorMap);

        //get amount assigned to corporate
        let queryString = {
            "selector": {
                "docType": "Transaction",
                "txType": "TransferToken",
                "from": { "$in": queryCorporate }
            },
            "fields": ["qty", "objRef", "from"]
        }

        let args = JSON.stringify(queryString);
        logger.debug(`query string:\n ${args}`);

        let txnList = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        txnList = JSON.parse(txnList.toString());
        logger.debug(`response2 :  ${JSON.stringify(txnList, null, 2)}`)

        txnList.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            let { from, objRef, qty } = elem['Record']

            from = splitOrgName(from)
            donorMap[from]['fundsDonated'] += qty
            if (!(donorMap[from]['projectsFunded'].includes(objRef))) {
                donorMap[from]['projectsFundedCount'] += 1
                donorMap[from]['projectsFunded'].push(objRef)
            }
        })

        result = Object.values(donorMap)
        return res.json(getMessage(true, result))
    }
    catch (e) {
        generateError(e, next);
    }
});

router.get('/ngoReport-userProfile', async function (req, res, next) {
    try {
        let result = []

        let ngoList = await orgModel.find({ role: "Ngo" }, { _id: 0, userName: 1, firstName: 1, lastName: 1, orgName: 1, email: 1 })
        console.log("ngoList: ", ngoList)
        let ngoMap = {}
        let queryNgo = []

        for (i = 0; i < ngoList.length; i++) {
            let ngo = ngoList[i]

            // data coming from mongo i.e. why toJSON is used
            // ngoMap[ngo.userName] = ngo.toJSON()

            ngoMap[ngo.userName] = {}

            ngoMap[ngo.userName]['firstName'] = ngo.firstName
            ngoMap[ngo.userName]['lastName'] = ngo.lastName
            ngoMap[ngo.userName]['orgName'] = ngo.orgName
            ngoMap[ngo.userName]['userName'] = ngo.userName
            ngoMap[ngo.userName]['email'] = ngo.email

            ngoMap[ngo.userName]["totalReceived"] = 0
            ngoMap[ngo.userName]["totalRedeemed"] = 0
            ngoMap[ngo.userName]["contributors"] = []
            ngoMap[ngo.userName]["projectsFunded"] = []

            let ngoAdd = ngo.userName + "." + ORG3_NAME + "." + BLOCKCHAIN_DOMAIN + ".com"
            queryNgo.push(ngoAdd)
        }

        let queryString = {
            "selector": {
                "docType": "Transaction",
                "txType": { "$in": ["TransferToken", "ApproveRedeemRequest"] },
                "to": { "$in": queryNgo }
            },
            "fields": ["qty", "objRef", "to", "txType", "from"]
        }

        let args = JSON.stringify(queryString);
        logger.debug(`query string:\n ${args}`);

        let txnList = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        txnList = JSON.parse(txnList.toString());
        console.log('txnList : ', txnList)
        logger.debug(`response2 :  ${JSON.stringify(txnList, null, 2)}`)

        txnList.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            let { to, objRef, qty, txType, from } = elem['Record']

            to = splitOrgName(to)
            from = splitOrgName(from)
            if (txType == "TransferToken") {
                ngoMap[to]['totalReceived'] += qty
                if (!(ngoMap[to]['projectsFunded'].includes(objRef))) {
                    ngoMap[to]['projectsFunded'].push(objRef)
                }
                if (!(ngoMap[to]['contributors'].includes(from))) {
                    ngoMap[to]['contributors'].push(from)
                }
            }
            else if (txType == "ApproveRedeemRequest") {
                ngoMap[to]['totalRedeemed'] += qty
            }
        })

        result = Object.values(ngoMap)
        return res.json(getMessage(true, result))
    }
    catch (e) {
        generateError(e, next);
    }
});


module.exports = router;
