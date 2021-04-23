require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const query = require('../../fabric-sdk/query');

// get fund raised and contributors for particular ngo
router.get('/funds-raised-by-ngo', async function (req, res, next) {

    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": req.userName + '.ngo.csr.com'
        },
        "fields": ["contributors", "phases"]
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
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
        res.json(getMessage(true, { fundsRaised: amount, contributorsCount: contributors }));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

// get a specific record by key 
router.get('/getRecord/:recordKey', async function (req, res, next) {

    const recordKey = req.params.recordKey;

    if (!recordKey) {
        res.json(fieldErrorMessage('\'recordKey\''));
    }

    let queryString = {
        "selector": {
            "_id": recordKey
        }
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        if (message.length > 0 && message[0]['Record']['docType'] === 'Project') {
            message = message[0]
            message['Record']['ngo'] = splitOrgName(message['Record']['ngo'])
            message['Record']['totalReceived'] = 0;
            let fundReceived = 0

            for (let f = 0; f < message['Record'].phases.length; f++) {
                fundReceived = (message['Record'].phases[f]['qty'] - message['Record'].phases[f]['outstandingQty'])
                message['Record']['totalReceived'] += fundReceived
                message['Record'].phases[f]['fundReceived'] = fundReceived
                message['Record'].phases[f]['percentageFundReceived'] = (fundReceived / message['Record'].phases[f]['qty']) * 100

                if (message["Record"].phases[f]["phaseState"] !== "Created") {
                    message["Record"]["currentPhase"] = f + 1;
                }

                Object.keys(message["Record"].phases[f]['contributions']).forEach(function (key) {
                    let newkey = key.split(".")[0];
                    message["Record"].phases[f]['contributions'][newkey] = message["Record"].phases[f]['contributions'][key];
                    delete message["Record"].phases[f]['contributions'][key];
                    message["Record"].phases[f]['contributions'][newkey]['donatorAddress'] = splitOrgName(message["Record"].phases[f]['contributions'][newkey]['donatorAddress'])
                });
            }

            message['Record']['contributors'] = Object.keys(message['Record']['contributors']).map(splitOrgName)
            let timeDifference = Date.now() - message['Record']['creationDate']
            if (timeDifference < 0) {
                timeDifference = 0
            }
            message['Record']['daysPassed'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        } else {
            return generateError(new Error('Project not found'), 'Failed to query', 401, next);
        }

        logger.debug(`Modified response :  ${JSON.stringify(message, null, 2)}`);
        res.json(getMessage(true, message));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

router.get('/total-locked-and-validity-of-corporate', async function (req, res, next) {
    const corporate = req.query.corporate;

    if (!corporate) {
        res.json(fieldErrorMessage('\'corporate\''));
    }

    let queryString = {
        "selector": {
            "docType": "EscrowDetails",
            "corporate": corporate
        },
        "fields": [
            "funds"
        ]
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let result = []
        // let resultObject = new Object()

        message.forEach(e => {
            e.Record.funds.forEach(f => {
                let resultObject = new Object()
                resultObject.qty = f.qty
                resultObject.validity = f.validity

                if (result.length == 0) {
                    result.push(resultObject)
                }
                else {
                    result.forEach(g => {
                        if (g.validity == resultObject.validity) {
                            g.qty += resultObject.qty
                        }
                    })
                }
            })
        })

        res.json(getMessage(true, result));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

// get fund raised and contributors for particular ngo
router.get('/amount-parked', async function (req, res, next) {
    const projectId = req.query.projectId;
    const userDLTName = req.userName + "." + req.orgName.toLowerCase() + ".csr.com";

    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    }

    let queryString = {
        "selector": {
            "docType": "EscrowDetails",
            "_id": userDLTName + "_" + projectId
        }
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let response = {}

        response["lockedQty"] = 0

        if (message.length != 0) {
            for (let i = 0; i < message[0]["Record"]["funds"].length; i++) {
                response["lockedQty"] += message[0]["Record"]["funds"][i]["qty"]
            }
        }

        res.json(getMessage(true, response));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

//fetch the Id data uploaded by the IT Dept. - not used
router.get('/it-data', async function (req, res, next) {

    const year = req.query.year;

    if (!year) {
        res.json(fieldErrorMessage('\'year\''));
        return;
    }

    let queryString = {
        "selector": {
            "_id": year.toString()
        }
    }

    const args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);

        // let newObject = new Object()
        let newObject = JSON.parse(message.toString())
        res.json(getMessage(true, { newObject }));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

// it report - for a year
router.get('/it-report', async function (req, res, next) {

    const responseType = req.header('responseType');
    const year = req.query.year

    if (!responseType) {
        res.json(fieldErrorMessage('\'responseType\''));
    }
    if (!year) {
        res.json(fieldErrorMessage('\'year\''));
    }

    let next = Number(year) + 1
    let thisYear = "April 1, " + year + " 00:00:00"
    let nexYear = "March 31, " + next.toString() + " 00:00:00"

    let date1 = new Date(thisYear)
    let date2 = new Date(nexYear)

    let result = []

    // get all corporates and their gov transferd data in a key value pair
    let queryString = {
        "selector": {
            "docType": "Transaction",
            "txType": "ClosingYearFundTransfer",
            "$and": [
                {
                    "date": {
                        "$gt": date1.valueOf()
                    }
                },
                {
                    "date": {
                        "$lt": date2.valueOf()
                    }
                }
            ]
        },
        "fields": ["objRef"]
    }

    let m = new Map()

    let args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);

        let objref = JSON.parse(message.toString());

        for (let i = 0; i < objref.length; i++) {
            let mit = objref[i].Record.objRef

            let mit1 = mit.split(",")
            logger.debug("mit1", mit1)

            for (let i = 0; i < mit1.length; i++) {
                let mit2 = mit1[i].split(":")
                if (m.get(mit2[0]) == undefined) {
                    m.set(mit2[0], Number(mit2[2]))
                } else {
                    m.set(mit2[0], m.get(mit2[0]) + Number(mit2[2]))
                }
            }
        }

        //get it list added from csr
        queryString = {
            "selector": {
                "_id": year.toString() + "-" + (Number(year) + 1).toString()
            }
        }
        args = JSON.stringify(queryString)
        logger.debug(`query string:\n ${args}`);

        message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);

        let ItList = JSON.parse(message.toString())
        if (ItList.length <= 0) {
            res.json(getMessage(true, "no record found for the perticular year"));
        }
        ItList = ItList[0]

        for (let i = 0; i < ItList.Record.length; i++) {

            let resultObject = new Object()

            resultObject.corporate = ItList.Record[i].corporateName
            resultObject.panNumber = ItList.Record[i].panNumber
            resultObject.totalLiability = ItList.Record[i].totalLiability

            queryString = {
                "selector": {
                    "txType": {
                        "$in": [
                            "AssignToken",
                            "FundsToEscrowAccount",
                            "TransferToken",
                            "ReleaseFundsFromEscrow",
                            "TransferToken_snapshot",
                            "FundsToEscrowAccount_snapshot"
                        ]
                    },
                    "$or": [
                        {
                            "from": ItList.Record[i].corporateName + ".corporate.csr.com"
                        },
                        {
                            "to": ItList.Record[i].corporateName + ".corporate.csr.com"
                        }
                    ],
                    "$and": [
                        {
                            "date": {
                                "$gt": date1.valueOf()
                            }
                        },
                        {
                            "date": {
                                "$lt": date2.valueOf()
                            }
                        }
                    ]
                }
            }

            args = JSON.stringify(queryString)
            logger.debug(`query string:\n ${args}`);

            message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);

            let transactionList = JSON.parse(message.toString())

            let creditsReceived = 0.0
            let creditsLocked = 0.0
            let creditsContributed = 0.0
            let creditsContributedFromLocked = 0.0

            transactionList.forEach(e => {
                logger.debug("tx Record: ", e.Record)
                if (e.Record.txType == "AssignToken") {
                    creditsReceived += e.Record.qty
                }
                else if (e.Record.txType == "FundsToEscrowAccount") {
                    creditsLocked += e.Record.qty
                }
                else if (e.Record.txType == "TransferToken") {
                    creditsContributed += e.Record.qty
                }
                else if (e.Record.txType == "ReleaseFundsFromEscrow") {
                    creditsContributedFromLocked += e.Record.qty
                }
                else if (e.Record.txType == "TransferToken_snapshot") {
                    creditsContributed += e.Record.qty
                }
                else if (e.Record.txType == "FundsToEscrowAccount_snapshot") {
                    creditsLocked += e.Record.qty
                }
            })

            let corNAme = ItList.Record[i].corporateName + ".corporate.csr.com"
            let liabality = ItList.Record[i].totalLiability - creditsReceived
            let creditsToGov = m.get(corNAme)
            if (creditsToGov === undefined) {
                creditsToGov = 0
            }
            logger.debug("creditsToGov: ", creditsToGov)
            let creditsUnspent = creditsReceived - creditsContributed - creditsLocked - creditsToGov

            resultObject.creditsReceived = creditsReceived
            resultObject.creditsLocked = creditsLocked
            resultObject.creditsContributed = creditsContributed
            resultObject.creditsContributedFromLocked = creditsContributedFromLocked
            resultObject.creditsUnspent = creditsUnspent
            resultObject.creditsToGov = creditsToGov

            if (liabality >= 0) {
                resultObject.pendingLiability = liabality
            } else {
                resultObject.pendingLiability = 0
            }

            if (creditsReceived < ItList.Record[i].totalLiability) {
                resultObject.compliant = "No"
            }
            else {
                resultObject.compliant = "Yes"
            }

            logger.debug("resultObject", resultObject)
            result.push(resultObject)
        }

        if (responseType === 'json') {
            res.json(getMessage(true, result));
        }
        else if (responseType === 'excel') {
            let excelResponse = convertToExcel(result, 'report');
            res.json(getMessage(true, excelResponse));
        }
        else {
            generateError(e, 'responseType should be json or excel', 401, next);
        }
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

//get in excel format
let convertToExcel = (jsonData, fileName) => {

    const ws = XLSX.utils.json_to_sheet(jsonData);

    //var f={E1: { t: 's', v: 'compliant' }};
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    logger.debug(`excelBuffer: ${excelBuffer}`)
    // let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    // const data = new Blob([excelBuffer], {type: fileType});
    return ({ fileData: excelBuffer, fileName: fileName })
    // return excelBuffer;
}

//get a report of ngo(credits received, redeemed, lockedFor)
router.get('/ngo-report', async function (req, res, next) {
    const year = req.query.year

    if (!year) {
        res.json(fieldErrorMessage('\'year\''));
    }

    //joining path of directory 
    let directoryPath = path.join(__dirname, '..', 'wallet-ngo');

    let filenames = fs.readdirSync(directoryPath);
    logger.debug("\nCurrent directory filenames:");
    let listOfNgos = filenames.filter(function (value, index, arr) {
        return value != 'admin';
    });

    let next = Number(year) + 1
    let thisYear = "April 1, " + year + " 00:00:00"
    let nextYear = "April 1, " + next.toString() + " 00:00:00"

    let startDate = new Date(thisYear)
    let endDate = new Date(nextYear)

    let response = {
        "success": false,
        "result": []
    }

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "txType": {},
            "to": "",
            "date": {
                "$gt": startDate.valueOf(),
                "$lt": endDate.valueOf()
            }
        },
        "fields": ["qty", "from"]
    }

    for (let i = 0; i < listOfNgos.length; i++) {
        queryString["selector"]["txType"]["$in"] = ["TransferToken", "TransferToken_snapshot", "ReleaseFundsFromEscrow"];
        queryString["selector"]["to"] = listOfNgos[i] + ".ngo.csr.com";

        let args = JSON.stringify(queryString);
        logger.debug(`query string:\n ${args}`);

        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = message[0]
        //console.log(message.toString())
        let newObject = JSON.parse(message.toString())
        let ngoData = {}
        ngoData["ngo"] = listOfNgos[i]

        let total = 0;
        let setOfContributors = new Set();
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"];
            setOfContributors.add(newObject[j]["Record"]["from"]);
        }
        ngoData["totalReceived"] = total;
        ngoData["contributors"] = Array.from(setOfContributors).map(splitOrgName);

        //get all redeemed amount
        queryString["selector"]["txType"]["$in"] = ["ApproveRedeemRequest"];
        args = JSON.stringify(queryString);
        logger.debug(`query string:\n ${args}`);

        message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        newObject = JSON.parse(message[0].toString())

        total = 0;
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"]
        }
        ngoData["totalRedeemed"] = total;

        //get all locked amounts
        queryString["selector"]["txType"]["$in"] = ["FundsToEscrowAccount", "FundsToEscrowAccount_snapshot"];
        args = JSON.stringify(queryString);
        logger.debug(`query string:\n ${args}`);

        message = await await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        newObject = JSON.parse(message[0].toString())

        total = 0;
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"]
        }
        ngoData["totalLocked"] = total;

        response["result"].push(ngoData);
        logger.debug(response);
    }

    res.json(getMessage(true, response));
});

//get the details of contributions to an ngo in the current financial year
router.get('/ngo-contribution-details', async function (req, res, next) {
    const ngoName = req.query.ngoName;

    if (!ngoName) {
        res.json(fieldErrorMessage('\'ngoName\''));
    }

    let response = {
        // "success": false,
        "result": {}
    }

    let currentDate = new Date();
    let currentMonth = currentDate.getMonth() + 1;

    let year = currentDate.getFullYear();
    if (currentMonth < 4) {
        year -= 1;
    }

    let next = year + 1;
    let thisYear = "April 1, " + year.toString() + " 00:00:00"
    let nextYear = "April 1, " + next.toString() + " 00:00:00"
    let startDate = new Date(thisYear)
    let endDate = new Date(nextYear)

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "to": ngoName + ".ngo.csr.com",
            "txType": {
                "$in": ["TransferToken", "TransferToken_snapshot", "FundsToEscrowAccount", "FundsToEscrowAccount_snapshot"]
            },
            "date": {
                "$gt": startDate.valueOf(),
                "$lt": endDate.valueOf()
            }
        },
        "fields": ["from", "qty", "txType"]
    }

    let args = JSON.stringify(queryString);
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        logger.debug(message[0].toString())

        let newObject = JSON.parse(message[0].toString())

        for (let i = 0; i < newObject.length; i++) {
            let from = newObject[i]["Record"]["from"]
            if (response["result"][from] === undefined) {
                response["result"][from] = { "totalTransferred": 0, "totalLocked": 0 }
            }

            if (newObject[i]["Record"]["txType"] === "TransferToken" || newObject[i]["Record"]["txType"] === "TransferToken_snapshot") {
                response["result"][from]["totalTransferred"] += newObject[i]["Record"]["qty"]
            }
            else {
                response["result"][from]["totalLocked"] += newObject[i]["Record"]["qty"]
            }
        }

        Object.keys(response["result"]).forEach(function (key) {
            let newkey = splitOrgName(key);
            response["result"][newkey] = response["result"][key];
            delete response["result"][key];
        });

        // response["success"] = true;
        res.json(getMessage(true, response));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

// get balance
router.get('/balance', async function (req, res, next) {
    let userDLTName = req.userName + "." + req.orgName + ".csr.com";

    let response = {
        'balance': 0,
        'snapshotBalance': 0,
        'escrowBalance': 0
    }

    let queryString = {
        "selector": {
            "_id": {
                "$in": [
                    userDLTName,
                    userDLTName + '_snapshot'
                ]
            }
        }
    }

    let args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    try {
        let message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);

        let newObject = JSON.parse(message.toString())

        for (let i = 0; i < newObject.length; i++) {
            if (newObject[i]['Key'] === userDLTName) {
                response['balance'] = Number(newObject[i]['Record'])
            }
            else if (newObject[i]['Key'] === userDLTName + '_snapshot') {
                response['snapshotBalance'] = Number(newObject[i]['Record'])
            }
        }
        response.success = true;

        if (req.orgName === 'Corporate') {
            queryString = {
                'selector': {
                    'docType': "EscrowDetails",
                    'corporate': userDLTName
                },
                'fields': ['funds']
            }

            args = JSON.stringify(queryString)
            logger.debug(`query string:\n ${args}`);

            //query esrow balance
            message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
            logger.debug(`response message: ${message.toString()}`);

            let newObject = new Object()
            if (message.toString().includes("Error:")) {
                newObject.success = false
                newObject.message = message.toString().split("Error:")[1].trim()
                generateError(e, 'Failed to query', 401, next);
            }
            else {
                newObject = JSON.parse(message.toString())

                for (let i = 0; i < newObject.length; i++) {
                    let funds = newObject[i]['Record']['funds']
                    for (let j = 0; j < funds.length; j++) {
                        response['escrowBalance'] += funds[j]['qty']
                    }
                }
                response.success = true;
            }
        }

        res.json(getMessage(true, response));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

//get a list of all corporate names
router.get('/corporate-names', async function (req, res, next) {
    //joining path of directory 
    let directoryPath = path.join(__dirname, '..', 'wallet-corporate');

    let filenames = fs.readdirSync(directoryPath);
    logger.debug("\nCurrent directory filenames:");
    let listOfCorporates = filenames.filter(function (value, index, arr) {
        return value != 'admin' && value != 'ca';
    });

    res.json(getMessage(true, listOfCorporates));
});

//gives all corporate names along with their contribution
router.get('/corporate-contributions', async function (req, res, next) {
    //get all corporate present
    let args = [JSON.stringify("queryString")]

    try {
        let message = await query(req.userName, req.orgName, 'GetAllCorporates', CHAINCODE_NAME, CHANNEL_NAME, JSON.stringify(args));

        let corporateList = new Object()
        corporateList = JSON.parse(message.toString())

        logger.debug(`corporate list: ${corporateList}`)

        let result = []

        for (let corporate of corporateList) {

            let args = []
            let message
            let queryString

            let resultObject = new Object()

            resultObject.corporate = corporate

            //get amount assigned to corporate
            queryString = {
                "selector": {
                    "docType": "Transaction",
                    "txType": "AssignToken",
                    "to": corporate
                },
                "fields": ["qty"]
            }

            args = JSON.stringify(queryString);
            logger.debug(`query string:\n ${args}`);

            message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
            newObject = new Object()
            newObject = JSON.parse(message.toString())

            let totalAssign = 0.0
            for (let assign of newObject) {
                totalAssign += assign.Record.qty
            }
            resultObject.assignedValue = totalAssign

            //get balance of corporate
            args = [corporate]
            message = await query(req.userName, req.orgName, 'GetBalanceCorporate', CHAINCODE_NAME, CHANNEL_NAME, JSON.stringify(args));
            newObject = new Object()
            newObject = JSON.parse(message.toString())

            resultObject.balance = newObject.balance
            resultObject.escrowBalance = newObject.escrowBalance
            resultObject.snapshotBalance = newObject.snapshotBalance

            //get all the projects the corporate is contributed
            let list1 = corporate.split(".")
            let res = list1[0] + "\\\\." + list1[1] + "\\\\." + list1[2] + "\\\\." + list1[3]
            queryString = "{\"selector\":{\"docType\":\"Project\",\"contributors." + res + "\":{\"$exists\":true}},\"fields\":[\"_id\"]}"
            args = queryString
            logger.debug(`query string:\n ${args}`);

            message = await query(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
            newObject = new Object()
            newObject = JSON.parse(message.toString())
            resultObject.projectCount = newObject.length

            result.push(resultObject)
        }
        res.json(getMessage(true, result));
    }
    catch (e) {
        generateError(e, 'Failed to query', 401, next);
    }
});

module.exports = router;