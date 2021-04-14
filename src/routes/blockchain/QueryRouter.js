const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const getErrorMessage = require('../../utils/ErrorMsg');
const splitOrgName = require('../../utils/splitOrgName');

var query = require('../../../app/query.js');

// get fund raised and contributors for particular ngo
router.get('/funds-raised-by-ngo', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getFundsRaisedNgo ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    let peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": req.username + '.ngo.csr.com'
        },
        "fields": ["contributors", "phases"]
    }

    var args = [JSON.stringify(queryString)]
    logger.debug('args : ' + args[0]);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        let contributors = [];
        let amount = 0;

        for (var i = 0; i < newObject.length; i++) {
            contributors.push(...Object.keys(newObject[i].Record.contributors))

            var phases = newObject[i].Record.phases
            for (var j = 0; j < phases.length; j++) {
                amount += phases[j].qty - phases[j].outstandingQty
            }
        }
        /*
            newObject.forEach(e => {
                contributors.push(...Object.keys(e.Record.contributors))
                e.Record.phases.forEach(q => {
                    amount += q.qty - q.outstandingQty
                })
            })
        */
        contributors = [...new Set(contributors)].length
        res.send({ fundsRaised: amount, contributorsCount: contributors })
    }
});

// get a specific record by key 
router.get('/getRecord/:recordKey', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getRecord ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = 'peer0.' + req.orgname.toLowerCase() + '.csr.com';
    var recordKey = req.params.recordKey;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('recordKey : ' + recordKey);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!recordKey) {
        res.json(getErrorMessage('\'recordKey\''));
        return;
    }

    var queryString = {
        "selector": {
            "_id": recordKey
        }
    }

    var args = [JSON.stringify(queryString)];
    logger.debug('args: ' + args[0]);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        newObject = JSON.parse(message.toString())
        newObject = newObject[0]

        if (newObject['Record']['docType'] === 'Project') {
            newObject['Record']['ngo'] = splitOrgName(newObject['Record']['ngo'])
            newObject['Record']['totalReceived'] = 0;
            var fundReceived = 0

            for (let f = 0; f < newObject['Record'].phases.length; f++) {
                fundReceived = (newObject['Record'].phases[f]['qty'] - newObject['Record'].phases[f]['outstandingQty'])
                newObject['Record']['totalReceived'] += fundReceived
                newObject['Record'].phases[f]['fundReceived'] = fundReceived
                newObject['Record'].phases[f]['percentageFundReceived'] = (fundReceived / newObject['Record'].phases[f]['qty']) * 100

                if (newObject["Record"].phases[f]["phaseState"] !== "Created") {
                    newObject["Record"]["currentPhase"] = f + 1;
                }

                Object.keys(newObject["Record"].phases[f]['contributions']).forEach(function (key) {
                    var newkey = key.split(".")[0];
                    newObject["Record"].phases[f]['contributions'][newkey] = newObject["Record"].phases[f]['contributions'][key];
                    delete newObject["Record"].phases[f]['contributions'][key];
                    newObject["Record"].phases[f]['contributions'][newkey]['donatorAddress'] = splitOrgName(newObject["Record"].phases[f]['contributions'][newkey]['donatorAddress'])
                });
            }

            newObject['Record']['contributors'] = Object.keys(newObject['Record']['contributors']).map(splitOrgName)
            var timeDifference = Date.now() - newObject['Record']['creationDate']
            if (timeDifference < 0) {
                timeDifference = 0
            }
            newObject['Record']['daysPassed'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        }

        logger.debug(newObject);
        res.send(newObject)
    }
});

//totalLockedAmountAndValidityOfCorporate
router.get('/total-locked-and-validity-of-corporate', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: totalLockedAmountAndValidityOfCorporate ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!peer) {
        res.json(getErrorMessage('\'peer\''));
        return;
    }
    if (!corporate) {
        res.json(getErrorMessage('\'corporate\''));
        return;
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

    var args = [JSON.stringify(queryString)]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    fund = new Object()
    fund = JSON.parse(message.toString())

    result = []

    resultObject = new Object()

    fund.forEach(e => {
        e.Record.funds.forEach(f => {
            resultObject = new Object()
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

    res.send({ result })
});

//get parked amount by corporate for a project 
router.get('/amount-parked', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getParkedQtyForCorporate ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var projectId = req.query.projectId;
    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    }

    var queryString = {
        "selector": {
            "docType": "EscrowDetails",
            "_id": userDLTName + "_" + projectId
        }
    }

    var args = [JSON.stringify(queryString)];
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    var response = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())

        //logger.debug(newObject[0]["Record"]["funds"].toString())

        response["lockedQty"] = 0

        if (newObject.length != 0) {
            for (let i = 0; i < newObject[0]["Record"]["funds"].length; i++) {
                response["lockedQty"] += newObject[0]["Record"]["funds"][i]["qty"]
            }
        }

        newObject.success = true
        response.success = true
        res.send(response)
    }
});

//fetch the Id data uploaded by the IT Dept. - not used
router.get('/it-data', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getItData ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var year = req.query.year;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('year : ' + year);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!year) {
        res.json(getErrorMessage('\'year\''));
        return;
    }

    let queryString = {
        "selector": {
            "_id": year.toString()
        }
    }

    var args = [JSON.stringify(queryString)]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    newObject = new Object()
    newObject = JSON.parse(message.toString())
    res.send({ newObject })
});

router.get('/it-report', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: itReport ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var responseType = req.header('responseType');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('responseType : ' + responseType);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!responseType) {
        res.json(getErrorMessage('\'responseType\''));
        return;
    }

    var year = req.query.year
    logger.debug('year : ' + year);
    if (!year) {
        res.json(getErrorMessage('\'year\''));
        return;
    }
    var next = Number(year) + 1
    var thisYear = "April 1, " + year + " 00:00:00"
    var nexYear = "March 31, " + next.toString() + " 00:00:00"

    var date1 = new Date(thisYear)
    var date2 = new Date(nexYear)

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
        "fields": [
            "objRef"
        ]
    }

    var m = new Map()

    let args = [JSON.stringify(queryString)]
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    let objref = JSON.parse(message.toString())

    console.log("mithun", objref)

    for (let i = 0; i < objref.length; i++) {
        let mit = objref[i].Record.objRef

        let mit1 = mit.split(",")
        console.log("mit1", mit1)

        for (let i = 0; i < mit1.length; i++) {
            let mit2 = mit1[i].split(":")
            if (m.get(mit2[0]) == undefined) {
                m.set(mit2[0], Number(mit2[2]))
            }
            else {
                m.set(mit2[0], m.get(mit2[0]) + Number(mit2[2]))
            }
        }
    }

    console.log("money", m)

    //get it list added from csr
    queryString = {
        "selector": {
            "_id": year.toString() + "-" + (Number(year) + 1).toString()
        }
    }
    args = []
    args.push(JSON.stringify(queryString))
    message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    var ItList = JSON.parse(message.toString())
    if (ItList.length <= 0) {
        res.send("no record found for the perticular year")
    }
    ItList = ItList[0]

    for (let i = 0; i < ItList.Record.length; i++) {

        var resultObject = new Object()

        resultObject.corporate = ItList.Record[i].corporateName
        resultObject.panNumber = ItList.Record[i].panNumber
        resultObject.totalLiability = ItList.Record[i].totalLiability

        let queryString = {
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

        let args = []
        args.push(JSON.stringify(queryString))

        let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

        var transactionList = JSON.parse(message.toString())

        var creditsReceived = 0.0
        var creditsLocked = 0.0
        var creditsContributed = 0.0
        var creditsContributedFromLocked = 0.0

        transactionList.forEach(e => {
            console.log("sgfadhdafh", e.Record)
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
        if (creditsToGov == undefined) {
            creditsToGov = 0
        }
        console.log("creditsToGov", creditsToGov)
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

        console.log("resultObject", resultObject)
        result.push(resultObject)
    }

    if (responseType === 'json') {
        res.send(result)
    }
    else if (responseType === 'excel') {
        let excelResponse = convertToExcel(result, 'report');
        res.send(excelResponse);
    }
    else {
        res.send({ success: false, message: 'responseType should be json or excel' })
    }
});

//get in excel format
var convertToExcel = (jsonData, fileName) => {

    const ws = XLSX.utils.json_to_sheet(jsonData);

    //var f={E1: { t: 's', v: 'compliant' }};
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    console.log("dbdfshd", excelBuffer)
    // let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    // const data = new Blob([excelBuffer], {type: fileType});
    return ({ fileData: excelBuffer, fileName: fileName })
    // return excelBuffer;
}

//get a report of ngo(credits received, redeemed, lockedFor)
router.get('/ngo-report', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoReport ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    //joining path of directory 
    var directoryPath = path.join(__dirname, '..', '..', '..', 'fabric-client-kv-ngo');

    var filenames = fs.readdirSync(directoryPath);
    console.log("\nCurrent directory filenames:");
    var listOfNgos = filenames.filter(function (value, index, arr) {
        return value != 'admin';
    });

    var year = req.query.year
    logger.debug('year : ' + year);
    if (!year) {
        res.json(getErrorMessage('\'year\''));
        return;
    }
    var next = Number(year) + 1
    var thisYear = "April 1, " + year + " 00:00:00"
    var nextYear = "April 1, " + next.toString() + " 00:00:00"

    var startDate = new Date(thisYear)
    var endDate = new Date(nextYear)

    var response = {
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

        var args = [JSON.stringify(queryString)];
        let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        message = message[0]
        //console.log(message.toString())
        newObject = JSON.parse(message.toString())
        var ngoData = {}
        ngoData["ngo"] = listOfNgos[i]

        var total = 0;
        let setOfContributors = new Set();
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"];
            setOfContributors.add(newObject[j]["Record"]["from"]);
        }
        ngoData["totalReceived"] = total;
        ngoData["contributors"] = Array.from(setOfContributors).map(splitOrgName);

        //get all redeemed amount
        queryString["selector"]["txType"]["$in"] = ["ApproveRedeemRequest"];
        args[0] = JSON.stringify(queryString);
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = JSON.parse(message[0].toString())

        total = 0;
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"]
        }
        ngoData["totalRedeemed"] = total;

        //get all locked amounts
        queryString["selector"]["txType"]["$in"] = ["FundsToEscrowAccount", "FundsToEscrowAccount_snapshot"];
        args[0] = JSON.stringify(queryString);
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = JSON.parse(message[0].toString())

        total = 0;
        for (let j = 0; j < newObject.length; j++) {
            total += newObject[j]["Record"]["qty"]
        }
        ngoData["totalLocked"] = total;

        response["result"].push(ngoData);
        console.log(response);
    }

    response["success"] = true;
    res.send(response);
});

//get the details of contributions to an ngo in the current financial year
router.get('/ngo-contribution-details', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoContributionDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    var ngoName = req.query.ngoName;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('ngoName : ' + ngoName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!ngoName) {
        res.json(getErrorMessage('\'ngoName\''));
        return;
    }

    var response = {
        "success": false,
        "result": {}
    }

    var currentDate = new Date();
    var currentMonth = currentDate.getMonth() + 1;

    var year = currentDate.getFullYear();
    if (currentMonth < 4) {
        year -= 1;
    }

    var next = year + 1;
    var thisYear = "April 1, " + year.toString() + " 00:00:00"
    var nextYear = "April 1, " + next.toString() + " 00:00:00"
    var startDate = new Date(thisYear)
    var endDate = new Date(nextYear)

    var queryString = {
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

    var args = [JSON.stringify(queryString)];
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    newObject = JSON.parse(message[0].toString())
    console.log(message[0].toString())

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
        var newkey = splitOrgName(key);
        response["result"][newkey] = response["result"][key];
        delete response["result"][key];
    });

    response["success"] = true;
    res.send(response);
});

// get balance
router.get('/balance', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getBalance ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }

    var response = {
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

    var args = [JSON.stringify(queryString)]
    logger.debug('args : ' + args[0]);

    //query normal and snapshot balance
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    var newObject = new Object()
    console.log('response message: ' + message.toString())
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
    }
    else {
        newObject = JSON.parse(message.toString())

        for (var i = 0; i < newObject.length; i++) {
            if (newObject[i]['Key'] === userDLTName) {
                response['balance'] = Number(newObject[i]['Record'])
            }
            else if (newObject[i]['Key'] === userDLTName + '_snapshot') {
                response['snapshotBalance'] = Number(newObject[i]['Record'])
            }
        }
        response.success = true;
    }

    if (req.orgname === 'Corporate') {
        queryString = {
            'selector': {
                'docType': "EscrowDetails",
                'corporate': userDLTName
            },
            'fields': ['funds']
        }

        args[0] = JSON.stringify(queryString)
        logger.debug('args : ' + args[0]);

        //query esrow balance
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        console.log('reponse message: ' + message.toString())
        newObject = new Object()
        if (message.toString().includes("Error:")) {
            newObject.success = false
            newObject.message = message.toString().split("Error:")[1].trim()
            res.send(newObject)
        }
        else {
            newObject = JSON.parse(message.toString())

            for (var i = 0; i < newObject.length; i++) {
                var funds = newObject[i]['Record']['funds']
                for (var j = 0; j < funds.length; j++) {
                    response['escrowBalance'] += funds[j]['qty']
                }
            }
            response.success = true;
        }
    }

    res.send(response)
});

//get a list of all corporate names
router.get('/corporate-names', async function (req, res) {
    logger.debug('==================== QUERY: getCorporateNames ==================');

    //joining path of directory 
    var directoryPath = path.join(__dirname, './fabric-client-kv-corporate');

    var filenames = fs.readdirSync(directoryPath);
    console.log("\nCurrent directory filenames:");
    var listOfCorporates = filenames.filter(function (value, index, arr) {
        return value != 'admin' && value != 'ca';
    });

    var response = {
        "success": true,
        "result": listOfCorporates
    }

    res.send(response);
});

//gives all corporate names along with their contribution
router.get('/corporate-contributions', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    //get all corpoarte present
    let args = []
    args.push(JSON.stringify("queryString"))
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "getAllCorporates", req.username, req.orgname);
    corporateList = new Object()
    corporateList = JSON.parse(message.toString())

    console.log("djfjasd", corporateList)

    result = []

    for (let corporate of corporateList) {

        let args = []
        let message
        let queryString

        let resultObject = new Object()

        resultObject.corporate = corporate

        //get amount assigned to corporate
        queryString = { "selector": { "docType": "Transaction", "txType": "AssignToken", "to": corporate }, "fields": ["qty"] }
        args = []
        args.push(JSON.stringify(queryString))
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        let totalAssign = 0.0
        for (let assign of newObject) {
            totalAssign += assign.Record.qty
        }
        resultObject.assignedValue = totalAssign

        //get balance of corporate
        args = []
        args.push(corporate)
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "getBalanceCorporate", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        resultObject.balance = newObject.balance
        resultObject.escrowBalance = newObject.escrowBalance
        resultObject.snapshotBalance = newObject.snapshotBalance

        //get all the projects the corporate is contributed
        let list1 = corporate.split(".")
        let res = list1[0] + "\\\\." + list1[1] + "\\\\." + list1[2] + "\\\\." + list1[3]
        queryString = "{\"selector\":{\"docType\":\"Project\",\"contributors." + res + "\":{\"$exists\":true}},\"fields\":[\"_id\"]}"
        args = []
        args.push(queryString)
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        resultObject.projectCount = newObject.length

        result.push(resultObject)
    }
    res.send(result)
});

module.exports = router;
