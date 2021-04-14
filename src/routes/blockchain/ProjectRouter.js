const express = require('express');
const router = express.Router();

var log4js = require('log4js');
var logger = log4js.getLogger('CSR-WebApp');
const uuid = require('uuid');

const getErrorMessage = require('../../utils/ErrorMsg');
const splitOrgName = require('../../utils/splitOrgName');

var invoke = require('../../../app/invoke-transaction.js');
var query = require('../../../app/query.js');

//****************************** Create Project *******************************
// Create Project transaction on chaincode on target peers. - done but errors
router.post('/create', async function (req, res) {
    logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //set extra attributes in request body.
    req.body["creationDate"] = Date.now();

    //modify all the criteria as per project object
    for (let i = 0; i < req.body.phases.length; i++) {
        let criteriaList = req.body.phases[i].validationCriteria;
        req.body.phases[i].validationCriteria = new Map();
        for (let j = 0; j < criteriaList.length; j++) {
            req.body.phases[i].validationCriteria[criteriaList[j]] = [];
        }
        logger.debug("criteria>>>>>>")
        logger.debug(req.body.phases[i].validationCriteria);
    }

    let projectId = uuid().toString()
    var args = [JSON.stringify(req.body), projectId, uuid().toString()];
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "createProject", args, req.username, req.orgname);
    message['projectId'] = projectId
    res.send(message);
});

//****************************** Update Project ******************************* - done
router.put('/update', async function (req, res) {
    logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var status = req.body.status;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!status) {
        res.json(getErrorMessage('\'status\''));
        return;
    }

    var args = [projectId, phaseNumber, status, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "updateProject", args, req.username, req.orgname);
    res.send(message);
});

//****************************** Project Update Visible To *******************************
router.put('/updateVisibleTo', async function (req, res) {
    logger.debug('==================== INVOKE UPDATE VISIBLE TO ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var corporateName = req.body.corporateName;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!corporateName) {
        corporateName = "all"
    }

    var args = [projectId, corporateName, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "updateVisibleTo", args, req.username, req.orgname);
    res.send(message);
});

//****************************** validate a phase of a project
router.post('/validatePhase', async function (req, res) {
    logger.debug('==================== INVOKE VALIDATE PHASE TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var validated = req.body.validated;
    var rejectionComment = req.body.rejectionComment;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!validated) {
        res.json(getErrorMessage('\'validated\''));
        return;
    }

    var args = [projectId, phaseNumber, validated, rejectionComment, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "validatePhase", args, req.username, req.orgname);
    res.send(message);
});

//****************************** add a document hash against a criterion, done but errors
router.post('/add-document-hash', async function (req, res) {
    logger.debug('==================== INVOKE ADD DOCUMENT HASH TOKEN ON CHAINCODE ==================');
    var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
    var chaincodeName = req.header('chaincodeName');
    var channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    var projectId = req.body.projectId;
    var phaseNumber = req.body.phaseNumber;
    var criterion = req.body.criterion;
    var docHash = req.body.docHash;
    var docName = req.body.docName;

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    } else if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    } else if (!projectId) {
        res.json(getErrorMessage('\'projectId\''));
        return;
    } else if (!phaseNumber) {
        res.json(getErrorMessage('\'phaseNumber\''));
        return;
    } else if (!criterion) {
        res.json(getErrorMessage('\'criterion\''));
        return;
    } else if (!docHash) {
        res.json(getErrorMessage('\'docHash\''));
        return;
    } else if (!docName) {
        res.json(getErrorMessage('\'docName\''));
        return;
    }

    var args = [projectId, phaseNumber, criterion, docHash, docName, Date.now().toString(), uuid().toString()]
    logger.debug('args  : ' + args);

    let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "addDocumentHash", args, req.username, req.orgname);
    res.send(message);
});

// get all projects 
router.get('/all', async function (req, res) {
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

        if (self !== "true") {
            queryString["selector"]["$or"] = [
                {
                    "visibleTo": null
                    // {"$exists": false}
                },
                {
                    "visibleTo": {
                        "$in": [
                            req.username
                        ]
                    }
                }
            ]
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

    logger.debug('queryString: ' + JSON.stringify(queryString));

    var args = [JSON.stringify(queryString), pageSize, bookmark];

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunctionPagination", req.username, req.orgname);

    message = message[0]
    var newObject = new Object()
    if (message.toString().includes("Error:")) {
        newObject.success = false
        newObject.message = message.toString().split("Error:")[1].trim()
        res.send(newObject)
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

        //loop over the projects
        for (var i = 0; i < newObject.length; i++) {

            var response = {}
            response["totalReceived"] = 0;
            response["ourContribution"] = 0;

            var record = newObject[i]["Record"];
            logger.debug(record);

            var currentPhase = 0;
            for (var f = 0; f < record.phases.length; f++) {
                var phaseQty = record.phases[f]["qty"];
                var phaseOutstandingQty = record.phases[f]["outstandingQty"]

                response["totalReceived"] += (phaseQty - phaseOutstandingQty)

                // if (record.phases[f]["phaseState"] !== "Created" && record.phases[f]["phaseState"] !== "Complete") {
                if (record.phases[f]["phaseState"] !== "Created") {
                    currentPhase = f
                }

                if (record.phases[f]["contributions"][orgDLTName] !== undefined) {
                    response["ourContribution"] += record.phases[f]["contributions"][orgDLTName]["contributionQty"];
                }
            }

            response['currentPhase'] = currentPhase + 1;
            response['currentPhaseStatus'] = record.phases[currentPhase]['phaseState'];
            response['currentPhaseTarget'] = record.phases[currentPhase]['qty'];
            response['currentPhaseOutstandingAmount'] = record.phases[currentPhase]['outstandingQty'];

            response['projectId'] = newObject[i]['Key']
            response['contributors'] = Object.keys(record['contributors']).map(splitOrgName)
            response['ngo'] = splitOrgName(record['ngo'])
            response['totalProjectCost'] = record['totalProjectCost']
            response['projectName'] = record['projectName']
            response['projectType'] = record['projectType']
            response['totalPhases'] = record.phases.length
            response["percentageFundReceived"] = (response["totalReceived"] / record['totalProjectCost']) * 100;

            var endDate = record.phases[record.phases.length - 1]['endDate']
            var timeDifference = endDate - Date.now()
            if (timeDifference < 0) {
                timeDifference = 0
            }
            response['daysLeft'] = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
            allRecords.push(response);
        }

        logger.debug(allRecords);
        finalResponse["allRecords"] = allRecords
        res.send(finalResponse)
    }

});

//getOngoing project count for csr : 
router.get('/total-ongoing-projects', async function (req, res) {
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
router.get('/corporate-project-details', async function (req, res) {
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
router.get('/corporate-project-transactions', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectTransaction ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');
    var corporate = req.query.corporate + '.corporate.csr.com'
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

    for (var i = 0; i < newObject.length; i++) {
        newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from']);
        newObject[i]['Record']['to'] = splitOrgName(newObject[i]['Record']['to']);
    }

    res.send({ "allRecords": newObject });
});

//gives all corporate names along with their contribution
router.get('/locked-details', async function (req, res) {
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

//getOngoing project count for csr : 
router.get('/total-corporate-ongoing-projects', async function (req, res) {
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
    let queryString = '{"selector":{"docType":"Project","projectState": {"$ne": "Completed"} ,"contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id"]}'

    var args = [queryString]

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    console.log("mithun : ", message.toString())

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    res.send({ projectCount: newObject.length })
});

//getCorporateProjectTransaction
router.get('/total-project-locked-amount', async function (req, res) {
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
router.get('/ngo-project-and-locked-details', async function (req, res) {
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

router.get('/ngo-project-transactions', async function (req, res) {
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

    let regex = projectId + "$";
    let queryString = {
        "selector": {
            "docType": "Transaction",
            "to": orgDLTName,
            "objRef": {
                "$regex": regex
            }
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
        res.send(newObject)
    }
    else {
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        newObject.success = true

        for (var i = 0; i < newObject.length; i++) {
            newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
            newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
        }

        let response = { "allRecords": newObject };
        res.send(response);
    }
});

router.get('/transactions', async function (req, res) {
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

    for (var i = 0; i < newObject.length; i++) {
        newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
        newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
    }

    res.send({ "allRecords": newObject });
});

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var corporate = req.query.args
    var peer = req.header('peer');
    var orgDLTName = req.query.args + '.corporate.csr.com'

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
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}}}'

    let args = []
    args.push(queryString)

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    var result = []

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

            if (e["Record"].phases[f]["contributions"][orgDLTName.toString()] !== undefined) {
                response["ourContribution"] += e["Record"].phases[f]["contributions"][orgDLTName.toString()]["contributionQty"]
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

        result.push(response)
    });

    res.send(result)
});

module.exports = router;