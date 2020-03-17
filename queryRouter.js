express = require('express');
var log4js = require('log4js');
var logger = log4js.getLogger('CSR-SDK-WebApp');
var query = require('./app/query.js');
const XLSX = require('xlsx');


const router = express.Router();

// get fund raised and contributors for particular ngo
router.get('/getFundsRaisedNgo', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    let peer = req.query.peer;
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
    var args = []
    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": req.username + '.ngo.csr.com'
        },
        "fields": ["contributors", "phases"]
    }
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        let contributors = [];
        let amount = 0;
        newObject.forEach(e => {
            contributors.push(...Object.keys(e.Record.contributors))
            e.Record.phases.forEach(q => {
                amount += q.qty - q.outstandingQty
            })
        })

        contributors = [...new Set(contributors)].length
        res.send({ fundsRaised: amount, contributorsCount: contributors })
        // return res.send(newObject)
    }
});

// get all projects 
router.get('/getAllProjects', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";

    var orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    var self = req.query.self;
    var ongoing = req.query.ongoing;
    var newRecords = req.query.newRecords;
    var pageSize = req.query.pageSize;
    var bookmark = req.query.bookmark;
    var queryString = {
        "selector": {
            "docType": "Project"
        },
        "sort": [{ "creationDate": "desc" }]
    }

    logger.debug(orgDLTName + ":" + self + ":" + ongoing + ":" + newRecords);

    if (req.orgname === "CreditsAuthority" || self !== "true") {
        logger.debug("Get all Projects");
    } else if (req.orgname === "Corporate") {
        queryString["selector"]["contributors"] = {}
        queryString["selector"]["contributors"][orgDLTName.toString().replace(/\./g, "\\\\.")] = "exists";
    } else if (req.orgname === "Ngo") {
        queryString["selector"]["ngo"] = orgDLTName
    }

    queryString["selector"]["projectState"] = {};
    if (ongoing === "true") {
        queryString["selector"]["projectState"]["$ne"] = "Completed"
    } else {
        queryString["selector"]["projectState"]["$eq"] = "Completed"
    }

    logger.debug('queryString: ' + JSON.stringify(queryString));
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

    var args = [JSON.stringify(queryString), pageSize, bookmark];
    logger.debug(args);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunctionPagination", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        var responseMetaObj = new Object()

        var msgList = message.toString().split("#");
        logger.debug(msgList[0]);
        logger.debug(msgList[1]);

        responseMetaObj = JSON.parse(msgList[1]);
        newObject = JSON.parse(msgList[0]);
        newObject.success = true

        var finalResponse = {}
        var allRecords = []

        //populate the MetaData
        finalResponse["metaData"] = {}
        finalResponse["metaData"]["RecordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
        finalResponse["metaData"]["Bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

        //resp.push(metaData);

        newObject.forEach(e => {
            let response = {}
            logger.debug(e["Record"]);
            let endDate = 0;
            response["totalReceived"] = 0;
            response["ourContribution"] = 0;
            for (let f = 0; f < e["Record"].phases.length; f++) {
                response["totalReceived"] += (e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"])

                // if (e["Record"].phases[f]["phaseState"] !== "Created" && e["Record"].phases[f]["phaseState"] !== "Complete") {
                if (e["Record"].phases[f]["phaseState"] !== "Created") {
                    response["currentPhase"] = f + 1;
                    response["percentageFundReceived"] = ((e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"]) / e["Record"].phases[f]["qty"]) * 100
                }

                if (e["Record"].phases[f]["contributions"][orgDLTName.toString()] !== undefined) {
                    response["ourContribution"] += e["Record"].phases[f]["contributions"][orgDLTName.toString()]["contributionQty"]
                }

                if (f === e["Record"].phases.length - 1) {
                    endDate = e["Record"].phases[f]["endDate"]
                }
            }
            response["projectId"] = e["Key"]
            response["contributors"] = Object.keys(e["Record"]["contributors"])
            response["ngo"] = e["Record"]["ngo"]
            response["totalProjectCost"] = e["Record"]["totalProjectCost"]
            response["projectName"] = e["Record"]["projectName"]
            response["projectType"] = e["Record"]["projectType"]
            response["totalPhases"] = e["Record"].phases.length
            var timeDifference = endDate - Date.now()
            if (timeDifference < 0) {
                timeDifference = 0
            }
            response["daysLeft"] = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
            allRecords.push(response);
            logger.debug(response);
        });

        logger.debug(allRecords);
        finalResponse["allRecords"] = allRecords
        return res.send(finalResponse)
    }
});

// get all projects 
router.get('/getRecord/:recordKey', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var recordKey = req.params.recordKey;

    var queryString = {
        "selector": {
            "_id": recordKey
        }
    }

    logger.debug('queryString: ' + JSON.stringify(queryString));
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

    var args = [JSON.stringify(queryString)];
    logger.debug(args);

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        newObject = JSON.parse(message.toString())
        newObject = newObject[0]

        if (newObject['Record']['docType'] === 'Project') {
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
            }

            newObject['Record']['contributors'] = Object.keys(newObject['Record']['contributors'])
            var timeDifference = Date.now() - newObject['Record']['creationDate']
            if (timeDifference < 0) {
                timeDifference = 0
            }
            newObject['Record']['daysPassed'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        }

        logger.debug(newObject);
        return res.send(newObject)
    }
});

//getOngoing project count for csr : 
router.get('/getTotalOngoingProjectCount', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = { "selector": { "docType": "Project", "projectState": { "$in": ["Partially Funded", "Created"] } }, "fields": ["_id"] }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ projectCount: newObject.length })
});

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var corporate = req.query.args
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id","ngo","projectName"]}'

    var args = []
    args.push(queryString)

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    var result = []

    newObject.forEach(e => {
        returnObject = new Object()
        returnObject.projectId = e.Key
        returnObject.ngo = e.Record.ngo
        returnObject.projectname = e.Record.projectName
        result.push(returnObject)
    })

    res.send(result)
});

//getCorporateProjectTransaction
router.get('/getCorporateProjectTransaction', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate
    var projectId = req.query.projectId


    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "from": corporate,
            "txType": {
                "$in": [
                    "ReleaseFundsFromEscrow",
                    "TransferToken",
                    "FundsToEscrowAccount"
                ]
            },
            "objRef": {
                "$in": [
                    projectId,
                    corporate + "_" + projectId
                ]
            }
        }
    }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ newObject })
});

//gives all corporate names along with their contribution
router.get('/getProjectLockedDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    var projectId = req.query.projectId

    var args = []
    args.push(JSON.stringify("queryString"))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "getAllCorporates", req.username, req.orgname);

    corporateList = new Object()
    corporateList = JSON.parse(message.toString())

    result = []

    for (var corporate of corporateList) {

        let queryString = {
            "selector": {
                "_id": corporate + '_' + projectId
            }
        }

        var args1 = []
        args1.push(JSON.stringify(queryString))

        let message1 = await query.queryChaincode(peer, channelName, chaincodeName, args1, "generalQueryFunction", req.username, req.orgname);

        newObject = new Object()
        newObject = JSON.parse(message1.toString())

        newObject.forEach(e => {
            returnObject = new Object()
            returnObject.corporate = e.Record.corporate
            totalsum = 0.0
            e.Record.funds.forEach(f => {
                totalsum += f.qty
            })
            returnObject.quantity = totalsum
            result.push(returnObject)
        })
    }
    res.send(result)
});

//get all parked amount tx by corporate 
router.get('/getAllParkedTxForCorporate', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var args = [];

    var parked = req.query.parked;

    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    var queryString = {
        "selector": {
            "docType": "Transaction",
            "from": userDLTName
        },
        "sort": [{ "date": "desc" }]
    }

    if (parked === "true") {
        queryString["selector"]["txType"] = "FundsToEscrowAccount"
    } else {
        queryString["selector"]["txType"] = {}
        queryString["selector"]["txType"]["$in"] = ["TransferToken", "ReleaseFundsFromEscrow"]
    }

    // logger.debug(userDLTName + ":" + self + ":" + ongoing + ":" + newRecords);

    logger.debug('queryString: ' + JSON.stringify(queryString));
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

    args.push(JSON.stringify(queryString));

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())

        for (let i = 0; i < newObject.length; i++) {
            let objRef = newObject[i]["Record"]["ObjRef"]
            let projectQueryString = {
                "selector": {
                    "docType": "Project",
                    "_id": objRef
                },
                "fields": ["projectName", "docType", "_id", "ngo"]
            }

            args = [JSON.stringify(projectQueryString)]
            let projectResponse = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

            projectResponse = projectResponse[0]
            newProjectObj = JSON.parse(projectResponse.toString());
            newObject[i]["Record"]["projectName"] = newProjectObj[0]["Record"]["projectName"]
            newObject[i]["Record"]["ngo"] = newProjectObj[0]["Record"]["ngo"]
        }

        newObject.success = true
        return res.send(newObject)
    }
});

//totalLockedAmountAndValidityOfCorporate
router.get('/totalLockedAmountAndValidityOfCorporate', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "docType": "EscrowDetails",
            "corporate": corporate
        },
        "fields": [
            "funds"
        ]
    }

    var args = []
    args.push(JSON.stringify(queryString))

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
router.get('/getParkedQtyForCorporate', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    var args = [];

    var projectId = req.query.projectId;

    var userDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";

    var queryString = {
        "selector": {
            "docType": "EscrowDetails",
            "_id": userDLTName + "_" + projectId
        }
    }

    // logger.debug(userDLTName + ":" + self + ":" + ongoing + ":" + newRecords);

    logger.debug('queryString: ' + JSON.stringify(queryString));
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
    if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    }

    args.push(JSON.stringify(queryString));
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    var response = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        logger.debug(newObject[0]["Record"]["funds"].toString())

        response["lockedQty"] = 0

        if (newObject.length != 0) {
            for (let i = 0; i < newObject[0]["Record"]["funds"].length; i++) {
                response["lockedQty"] += newObject[0]["Record"]["funds"][i]["qty"]
            }
        }

        newObject.success = true
        response.success = true
        return res.send(response)
    }
});

//getOngoing project count for csr : 
router.get('/getCorporateProjectOngoingCount', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    var corporate = req.query.corporate


    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","projectState": "Partially Funded","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id"]}'

    var args = []
    args.push(queryString)

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ projectCount: newObject.length })
});

//getCorporateProjectTransaction
router.get('/getTotalAmountLockedForProjectId', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate
    var projectId = req.query.projectId


    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "project": projectId,
            "docType": "EscrowDetails"
        },
        "fields": [
            "funds"
        ]
    }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    var result = 0

    newObject.forEach(e => {
        e.Record.funds.forEach(f => {
            result += f.qty
        })
    })

    res.send({ lockedAmount: result })
});

//getCorporateProjectTransaction
router.get('/getNgoProjectAndLockedAmountDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var ngo = req.query.ngo

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": ngo
        },
        "fields": [
            "_id",
            "projectId",
            "phases",
            "totalProjectCost",
            "projectName",
            "endDate"
        ]
    }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    response = []

    projectList = new Object()
    projectList = JSON.parse(message.toString())

    for (let i = 0; i < projectList.length; i++) {

        obj = Object()
        obj.projectName = projectList[i].Record.projectName
        obj.totalProjectCost = projectList[i].Record.totalProjectCost

        //find amount locked for the project

        let queryString1 = {
            "selector": {
                "project": projectList[i].Key,
                "docType": "EscrowDetails"
            },
            "fields": [
                "funds"
            ]
        }
        var args = []
        args.push(JSON.stringify(queryString1))
        let message1 = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message1.toString())

        var result = 0

        newObject.forEach(e => {
            e.Record.funds.forEach(f => {
                result += f.qty
            })
        })
        obj.locked = result
        obj.projectId = projectList[i].Key

        //get current phase details

        var amountCollected = 0
        for (let j = 0; j < projectList[i].Record.phases.length; j++) {

            if (projectList[i].Record.phases[j].phaseState == "Complete") {
                amountCollected += projectList[i].Record.phases[j].qty - projectList[i].Record.phases[j].outstandingQty
                continue
            }

            if (projectList[i].Record.phases[j].phaseState != "Complete") {
                amountCollected += projectList[i].Record.phases[j].qty - projectList[i].Record.phases[j].outstandingQty
                phase = new Object()
                phase.phaseNumber = j
                phase.endDate = projectList[i].Record.phases[j].endDate
                phase.qty = projectList[i].Record.phases[j].qty
                phase.outstandingQty = projectList[i].Record.phases[j].outstandingQty
                phase.phaseState = projectList[i].Record.phases[j].phaseState
                obj.phase = phase

                break
            }
        }
        obj.amountCollected = amountCollected
        response.push(obj)
    }
    res.send({ lockedAmount: response })
});

router.get('/getNgoProjectTx', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================')
    var channelName = req.header('channelName')
    var chaincodeName = req.header('chaincodeName')

    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com"
    var projectId = req.query.projectId
    var orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com"

    logger.debug('channelName : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "to": orgDLTName,
            "objRef": projectId
        },
        "sort": [{ "date": "desc" }]
    }

    var args = [JSON.stringify(queryString)]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        return res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        newObject.success = true
        return res.send(newObject)
    }
});

router.get('/projectIdTransaction', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "objRef": {
                "$regex": projectId
            },
            "txType": {
                "$in": [
                    "ReleaseFundsFromEscrow",
                    "TransferToken",
                    "FundsToEscrowAccount"
                ]
            }
        }
    }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ newObject })
});

//fetch the Id data uploaded by the IT Dept.
router.get('/getItData', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    var year = req.query.year;
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

router.get('/itReport', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var responseType = req.header('responseType');

    var year = req.query.year
    var next = Number(year)+1
    var thisYear = "April 1, " + year + " 00:00:00"
    var nexYear = "March 31, " + next.toString() + " 00:00:00"

    var date1 = new Date(thisYear)
    var date2 = new Date(nexYear)

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    let result = []

    let queryString = {
        "selector": {
            "_id": year.toString()+"-"+(Number(year)+1).toString()
        }
    }

    var args = []
    args.push(JSON.stringify(queryString))

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    var ItList = JSON.parse(message.toString())
    if(ItList.length<=0){
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
                     "TransferToken"
                  ]
               },
               "$or": [
                  {
                     "from": ItList.Record[i].corporateName
                  },
                  {
                     "to": ItList.Record[i].corporateName
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

        var amountDonated = 0.0
        var amountLocked = 0.0
        var amountTransfered = 0.0

        transactionList.forEach(e => {
            console.log("sgfadhdafh",e.Record)
            if (e.Record.txType == "AssignToken") {
                amountDonated += e.Record.qty
            }
            else if (e.Record.txType == "FundsToEscrowAccount"){
                amountLocked += e.Record.qty
            }
            else if (e.Record.txType == "TransferToken"){
                amountTransfered += e.Record.qty
            }
        })

        resultObject.amountDonated = amountDonated
        resultObject.amountLocked = amountLocked
        resultObject.amountTransfered = amountTransfered

        if (amountDonated < ItList.Record[i].totalLiability) {
            resultObject.compliant = false
        }
        else {
            resultObject.compliant = true
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
    else{
        res.send({success: false, message:'responseType should be json or excel'})
    }
});

//get in excel format
var convertToExcel = (jsonData, fileName) =>{
    
    const ws = XLSX.utils.json_to_sheet(jsonData);
 
    //var f={E1: { t: 's', v: 'compliant' }};
	const wb = {Sheets:{'data':ws}, SheetNames:['data']};
    const excelBuffer = XLSX.write(wb, {bookType:'xlsx', type:'base64'})
    console.log("dbdfshd",excelBuffer)
    // let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    // const data = new Blob([excelBuffer], {type: fileType});
    return({fileData:excelBuffer, fileName:fileName})
    // return excelBuffer;
    
}

module.exports = router;