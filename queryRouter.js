express = require('express');
var log4js = require('log4js');
var logger = log4js.getLogger('CSR-SDK-WebApp');
var query = require('./app/query.js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const router = express.Router();

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

//it converts the name 'username.org.csr.com' to 'username'
const splitOrgName = orgFullName => orgFullName.split('.')[0];

// get fund raised and contributors for particular ngo
router.get('/getFundsRaisedNgo', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getFundsRaisedNgo ==================');
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
    }
});

// get all projects 
router.get('/getAllProjects', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getAllProjects ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";

    var orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    var self = req.query.self;
    var ongoing = req.query.ongoing;
    var newRecords = req.query.newRecords;
    var pageSize = req.query.pageSize;
    var bookmark = req.query.bookmark;
    var ngoName = req.query.ngoName;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer + ' orgDLTName : ' + orgDLTName);
    logger.debug('query params : self-' + self + ' ongoing-' + ongoing + ' newRecords-' + newRecords + ' pageSize-' + pageSize + ' bookmark-' + bookmark + ' ngoName-' + ngoName);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!self) {
        res.json(getErrorMessage('\'self\''));
        return;
    }
    if (!ongoing) {
        res.json(getErrorMessage('\'ongoing\''));
        return;
    }
    if (!newRecords) {
        res.json(getErrorMessage('\'newRecords\''));
        return;
    }
    if (!pageSize) {
        res.json(getErrorMessage('\'pageSize\''));
        return;
    }

    var queryString = {
        "selector": {
            "docType": "Project"
        },
        "sort": [{ "creationDate": "desc" }]
    }

    if (req.orgname === "CreditsAuthority" || self !== "true") {
        logger.debug("Get all Projects");
        if (ngoName.length != 0) {
            queryString["selector"]["ngo"] = ngoName + ".ngo.csr.com"
        }
    } else if (req.orgname === "Corporate") {
        queryString["selector"]["contributors"] = {}
        queryString["selector"]["contributors"][orgDLTName.replace(/\./g, "\\\\.")] = "exists";
    } else if (req.orgname === "Ngo") {
        queryString["selector"]["ngo"] = orgDLTName
    }

    queryString["selector"]["projectState"] = {};
    if (ongoing === "true") {
        queryString["selector"]["projectState"]["$ne"] = "Completed"
    }
    else if (ongoing === "false") {
        queryString["selector"]["projectState"]["$eq"] = "Completed"
    }
    else {
        queryString["selector"]["projectState"]["$ne"] = ""
    }

    var args = [JSON.stringify(queryString), pageSize, bookmark];
    logger.debug('queryString: ' + args[0]);

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
                    response["currentPhaseStatus"] = e["Record"].phases[f]["phaseState"];
                    response["currentPhaseTarget"] = e["Record"].phases[f]["qty"];
                    response["currentPhaseOutstandingAmount"] = e["Record"].phases[f]["outstandingQty"];
                    response["percentageFundReceived"] = ((e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"]) / e["Record"].phases[f]["qty"]) * 100
                }

                if (e["Record"].phases[f]["contributions"][orgDLTName] !== undefined) {
                    response["ourContribution"] += e["Record"].phases[f]["contributions"][orgDLTName]["contributionQty"]
                }

                if (f === e["Record"].phases.length - 1) {
                    endDate = e["Record"].phases[f]["endDate"]
                }
            }
            response["projectId"] = e["Key"]
            response["contributors"] = Object.keys(e["Record"]["contributors"]).map(splitOrgName)
            response["ngo"] = splitOrgName(e["Record"]["ngo"])
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
        });

	    logger.debug(allRecords);
        finalResponse["allRecords"] = allRecords
        return res.send(finalResponse)
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
        return res.send(newObject)
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

		        Object.keys(newObject["Record"].phases[f]['contributions']).forEach(function(key) {
                    var newkey = splitOrgName(key);
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
        return res.send(newObject)
    }
});

//getOngoing project count for csr : 
router.get('/getTotalOngoingProjectCount', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalOngoingProjectCount ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

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
            "projectState": { 
                "$in": ["Partially Funded", "Created"] 
            } 
        }, 
        "fields": ["_id"] 
    }

    var args = [JSON.stringify(queryString)]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ projectCount: newObject.length })
});

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var corporate = req.query.corporate;
    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com";
    //var peer = req.header('peer');

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
    if (!corporate) {
        res.json(getErrorMessage('\'corporate\''));
        return;
    }

    //let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id","ngo","projectName"]}'
    
    var args = [queryString]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    var result = []

    newObject.forEach(e => {
        returnObject = new Object()
        returnObject.projectId = e.Key
        returnObject.ngo = splitOrgName(e.Record.ngo)
        returnObject.projectName = e.Record.projectName
        result.push(returnObject)
    })

    res.send(result)
});

//getCorporateProjectTransaction
router.get('/getCorporateProjectTransaction', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectTransaction ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate
    var projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);

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
    if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    }

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "from": corporate,
            "txType": {
                "$in": [
                    "ReleaseFundsFromEscrow",
                    "TransferToken",
                    "FundsToEscrowAccount",
                    "FundsToEscrowAccount_snapshot",
                    "TransferToken_snapshot"
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

    var args = [JSON.stringify(queryString)]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())
    
    for(var i=0; i<newObject.length; i++) {
        newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from']);
        newObject[i]['Record']['to'] = splitOrgName(newObject[i]['Record']['to']);
    }

    res.send({ newObject })
});

//gives all corporate names along with their contribution
router.get('/getProjectLockedDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getProjectLockedDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var projectId = req.query.projectId;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('projectId : ' + projectId);

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
    if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    }

    var args = [JSON.stringify("queryString")]
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
            returnObject.corporate = splitOrgName(e.Record.corporate)
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
        return res.send(newObject)
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
	    
            if(parked === "true") {
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
        return res.send(newObject)
    }
});

//totalLockedAmountAndValidityOfCorporate
router.get('/totalLockedAmountAndValidityOfCorporate', async function (req, res) {
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
router.get('/getParkedQtyForCorporate', async function (req, res) {
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
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectOngoingCount ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!corporate) {
        res.json(getErrorMessage('\'corporate\''));
        return;
    }

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","projectState": "Partially Funded","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id"]}'

    var args = [queryString]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ projectCount: newObject.length })
});

//getCorporateProjectTransaction
router.get('/getTotalAmountLockedForProjectId', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalAmountLockedForProjectId ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    //var corporate = req.query.corporate
    var projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    //logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);
    
    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    //if (!corporate) {
    //    res.json(getErrorMessage('\'corporate\''));
    //    return;
    //}
    if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    }

    let queryString = {
        "selector": {
            "project": projectId,
            "docType": "EscrowDetails"
        },
        "fields": [
            "funds"
        ]
    }

    var args = [JSON.stringify(queryString)]
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
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectAndLockedAmountDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var ngo = req.query.ngo

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('ngo : ' + ngo);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!ngo) {
        res.json(getErrorMessage('\'ngo\''));
        return;
    }

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

    var args = [JSON.stringify(queryString)]
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

//get the transactions of the calling ngo for a specific project
router.get('/getNgoProjectTx', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectTx ==================')
    var channelName = req.header('channelName')
    var chaincodeName = req.header('chaincodeName')

    var peer = "peer0." + req.orgname.toLowerCase() + ".csr.com"
    var projectId = req.query.projectId
    var orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com"

    logger.debug('channelName : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)
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

	    for(var i=0; i<newObject.length; i++) {
            newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
            newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
        }

        return res.send(newObject)
    }
});

//get all transactions of a project
router.get('/projectIdTransaction', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: projectIdTransaction ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var projectId = req.query.projectId

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
                    "FundsToEscrowAccount",
                    "FundsToEscrowAccount_snapshot",
                    "TransferToken_snapshot"
                ]
            }
        }
    }

    var args = [JSON.stringify(queryString)]
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    for(var i=0; i<newObject.length; i++) {
        newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
        newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
    }

    res.send({ newObject })
});

//fetch the Id data uploaded by the IT Dept.
router.get('/getItData', async function (req, res) {
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

// generate a report of corporates for the IT Dept
router.get('/itReport', async function (req, res) {
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

    console.log("fhasjhgj", objref)

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
        var creditsContributedFromLocked =0.0

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
        if(creditsToGov == undefined) {
            creditsToGov = 0
        }
        console.log("creditsToGov",creditsToGov)
        let creditsUnspent = creditsReceived - creditsContributed - creditsLocked - creditsToGov

        resultObject.creditsReceived = creditsReceived
        resultObject.creditsLocked = creditsLocked
        resultObject.creditsContributed = creditsContributed
        resultObject.creditsContributedFromLocked = creditsContributedFromLocked
        resultObject.creditsUnspent = creditsUnspent
        resultObject.creditsToGov = creditsToGov
        
        if(liabality >= 0) {
            resultObject.pendingLiability = liabality
        }
        else {
            resultObject.pendingLiability=0
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
router.get('/getNgoReport', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoReport ==================');
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

    //joining path of directory 
    var directoryPath = path.join(__dirname, './fabric-client-kv-ngo');

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
router.get('/getNgoContributionDetails', async function (req, res) {
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
    if(currentMonth < 4) {
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
                "$in": [
                    "TransferToken", 
                    "TransferToken_snapshot", 
                    "FundsToEscrowAccount", 
                    "FundsToEscrowAccount_snapshot"
                ]
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

    for(let i=0; i<newObject.length; i++) {
	    let from = newObject[i]["Record"]["from"]
        let txType = newObject[i]["Record"]["txType"]

        if(response["result"][from] === undefined) {
            response["result"][from] = {"totalTransferred": 0, "totalLocked": 0}
        }
        
        if(txType === "TransferToken" || txType === "TransferToken_snapshot") {
            response["result"][from]["totalTransferred"] += newObject[i]["Record"]["qty"]
        }
        else {
            response["result"][from]["totalLocked"] += newObject[i]["Record"]["qty"]
        }
    }

    Object.keys(response["result"]).forEach(function(key) {
        var newkey = splitOrgName(key);
        response["result"][newkey] = response["result"][key];
        delete response["result"][key];
    });
    
    response["success"] = true;
    res.send(response);
});

module.exports = router;
