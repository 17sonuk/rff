const express = require('express');
const router = express.Router();
const uuid = require('uuid');

const logger = require('../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../utils/functions');

const invoke = require('../fabric-sdk/invoke');
const query = require('../fabric-sdk/query');

//****************************** Create Project *******************************
// Create Project transaction on chaincode on target peers. - done but errors
router.post('/create', async (req, res, next) => {
    logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
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

    const projectId = uuid().toString()
    let args = [JSON.stringify(req.body), projectId, uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "CreateProject", chaincodeName, channelName, args);
        res.json({ ...getMessage(true, 'Successfully invoked CreateProject'), 'projectId': projectId });
    }
    catch (e) {
        generateError(e, 'Failed to invoke CreateProject', 401, next);
    }
});

//****************************** Update Project ******************************* - done
router.put('/update', async (req, res, next) => {
    logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const status = req.body.status;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!status) {
        res.json(fieldErrorMessage('\'status\''));
    }

    let args = [projectId, phaseNumber, status, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "UpdateProject", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked UpdateProject'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke UpdateProject', 401, next);
    }
});

//****************************** Project Update Visible To *******************************
router.put('/updateVisibleTo', async (req, res, next) => {
    logger.debug('==================== INVOKE UPDATE VISIBLE TO ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const corporateName = req.body.corporateName;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    } else if (!corporateName) {
        corporateName = "all"
    }

    let args = [projectId, corporateName, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "UpdateVisibleTo", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked UpdateVisibleTo'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke UpdateVisibleTo', 401, next);
    }
});

//****************************** validate a phase of a project
router.post('/validatePhase', async (req, res, next) => {
    logger.debug('==================== INVOKE VALIDATE PHASE TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const validated = req.body.validated;
    const rejectionComment = req.body.rejectionComment;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!validated) {
        res.json(fieldErrorMessage('\'validated\''));
    }

    let args = [projectId, phaseNumber, validated, rejectionComment, Date.now().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "ValidatePhase", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked ValidatePhase'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke ValidatePhase', 401, next);
    }
});

//****************************** add a document hash against a criterion, done but errors
router.post('/add-document-hash', async (req, res, next) => {
    logger.debug('==================== INVOKE ADD DOCUMENT HASH TOKEN ON CHAINCODE ==================');
    const chaincodeName = req.header('chaincodeName');
    const channelName = req.header('channelName');
    logger.debug('channelName  : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const criterion = req.body.criterion;
    const docHash = req.body.docHash;
    const docName = req.body.docName;

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!criterion) {
        res.json(fieldErrorMessage('\'criterion\''));
    } else if (!docHash) {
        res.json(fieldErrorMessage('\'docHash\''));
    } else if (!docName) {
        res.json(fieldErrorMessage('\'docName\''));
    }

    let args = [projectId, phaseNumber, criterion, docHash, docName, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke(req.userName, req.orgName, "AddDocumentHash", chaincodeName, channelName, args);
        res.json(getMessage(true, 'Successfully invoked AddDocumentHash'));
    }
    catch (e) {
        generateError(e, 'Failed to invoke AddDocumentHash', 401, next);
    }
});

// get all projects 
router.get('/all', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllProjects ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');

    const orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com";
    const self = req.query.self;
    const ongoing = req.query.ongoing;
    const newRecords = req.query.newRecords;
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const ngoName = req.query.ngoName;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('orgDLTName : ' + orgDLTName);
    logger.debug('query params : self-' + self + ' ongoing-' + ongoing + ' newRecords-' + newRecords + ' pageSize-' + pageSize + ' bookmark-' + bookmark + ' ngoName-' + ngoName);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!self) {
        res.json(fieldErrorMessage('\'self\''));
    }
    if (!ongoing) {
        res.json(fieldErrorMessage('\'ongoing\''));
    }
    if (!newRecords) {
        res.json(fieldErrorMessage('\'newRecords\''));
    }
    if (!pageSize) {
        res.json(fieldErrorMessage('\'pageSize\''));
    }

    let queryString = {
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

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);

    try {
        const message = await query(req.userName, req.orgName, "GeneralQueryFunctionPagination", chaincodeName, channelName, args);
        message = message[0]
        let newObject = new Object()
        if (message.toString().includes("Error:")) {
            newObject.success = false
            newObject.message = message.toString().split("Error:")[1].trim()
            res.send(newObject)
        }
        else {
            let responseMetaObj = new Object()

            let msgList = message.toString().split("#");
            logger.debug(msgList[0]);
            logger.debug(msgList[1]);

            responseMetaObj = JSON.parse(msgList[1]);
            newObject = JSON.parse(msgList[0]);
            newObject.success = true

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["RecordsCount"] = responseMetaObj[0]["ResponseMetadata"]["RecordsCount"];
            finalResponse["metaData"]["Bookmark"] = responseMetaObj[0]["ResponseMetadata"]["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let response = {}
                response["totalReceived"] = 0;
                response["ourContribution"] = 0;

                let record = newObject[i]["Record"];
                logger.debug(record);

                let currentPhase = 0;
                for (let f = 0; f < record.phases.length; f++) {
                    let phaseQty = record.phases[f]["qty"];
                    let phaseOutstandingQty = record.phases[f]["outstandingQty"]

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

                let endDate = record.phases[record.phases.length - 1]['endDate']
                let timeDifference = endDate - Date.now()
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
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunctionPagination', 401, next);
    }
});

//getOngoing project count for csr : 
router.get('/total-ongoing-projects', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalOngoingProjectCount ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
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

    let args = JSON.stringify(queryString);
    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        res.send({ projectCount: newObject.length })
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//getOngoing project details for a perticular corporate : 
router.get('/corporate-project-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const corporate = req.query.corporate;
    //const peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        res.json(fieldErrorMessage('\'corporate\''));
    }

    //let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id","ngo","projectName"]}'

    let args = queryString;

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        let result = []

        newObject.forEach(e => {
            returnObject = new Object()
            returnObject.projectId = e.Key
            returnObject.ngo = splitOrgName(e.Record.ngo)
            returnObject.projectName = e.Record.projectName
            result.push(returnObject)
        })
        res.send(result)
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//getCorporateProjectTransaction
router.get('/corporate-project-transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectTransaction ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const peer = req.header('peer');
    const corporate = req.query.corporate + '.corporate.csr.com'
    const projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);
    logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!peer) {
        res.json(fieldErrorMessage('\'peer\''));
    }
    if (!corporate) {
        res.json(fieldErrorMessage('\'corporate\''));
    }
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
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

    let args = JSON.stringify(queryString);

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        for (let i = 0; i < newObject.length; i++) {
            newObject[i]['Record']['from'] = splitOrgName(newObject[i]['Record']['from']);
            newObject[i]['Record']['to'] = splitOrgName(newObject[i]['Record']['to']);
        }

        res.send({ "allRecords": newObject });
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//gives all corporate names along with their contribution
router.get('/locked-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getProjectLockedDetails ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const projectId = req.query.projectId;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!peer) {
        res.json(fieldErrorMessage('\'peer\''));
    }
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
    }

    let args = JSON.stringify("queryString");

    try {
        let message = await query(req.userName, req.orgName, "GetAllCorporates", chaincodeName, channelName, args);

        corporateList = new Object()
        corporateList = message

        result = []

        for (let corporate of corporateList) {

            let queryString = {
                "selector": {
                    "_id": corporate + '_' + projectId
                }
            }

            let args1 = JSON.stringify(queryString);

            try {
                let message1 = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args1);

                console.log("mithun : ", message.toString())

                newObject = new Object()
                newObject = message1;

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
            catch (e) {
                generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
            }
        }
        res.send(result)
    }
    catch (e) {
        generateError(e, 'Failed to query GetAllCorporates', 401, next);
    }
});

//getOngoing project count for csr : 
router.get('/total-corporate-ongoing-projects', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectOngoingCount ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const corporate = req.query.corporate;

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        res.json(fieldErrorMessage('\'corporate\''));
    }

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","projectState": {"$ne": "Completed"} ,"contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}},"fields":["_id"]}'

    let args = queryString

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        res.send({ projectCount: newObject.length })
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//getCorporateProjectTransaction
router.get('/total-project-locked-amount', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalAmountLockedForProjectId ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    //const corporate = req.query.corporate
    const projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    //logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    //if (!corporate) {
    //    res.json(fieldErrorMessage('\'corporate\''));
    //    return;
    //}
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
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

    let args = JSON.stringify(queryString)

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        const result = 0

        newObject.forEach(e => {
            e.Record.funds.forEach(f => {
                result += f.qty
            })
        })

        res.send({ lockedAmount: result })
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//getCorporateProjectTransaction
router.get('/ngo-project-and-locked-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectAndLockedAmountDetails ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const ngo = req.query.ngo

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('ngo : ' + ngo);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!ngo) {
        res.json(fieldErrorMessage('\'ngo\''));
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

    let args = JSON.stringify(queryString)

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);
        response = []

        projectList = new Object()
        projectList = message

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
            let args1 = JSON.stringify(queryString1)

            try {
                let message1 = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args1);

                console.log("mithun : ", message1.toString())

                newObject = new Object()
                newObject = message1;

                const result = 0

                newObject.forEach(e => {
                    e.Record.funds.forEach(f => {
                        result += f.qty
                    })
                })
                obj.locked = result
                obj.projectId = projectList[i].Key

                //get current phase details

                const amountCollected = 0
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
            catch (e) {
                generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
            }
        }
        res.send({ lockedAmount: response })
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

router.get('/ngo-project-transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectTx ==================')
    const channelName = req.header('channelName')
    const chaincodeName = req.header('chaincodeName')

    const projectId = req.query.projectId
    const orgDLTName = req.username + "." + req.orgname.toLowerCase() + ".csr.com"

    logger.debug('channelName : ' + channelName)
    logger.debug('chaincodeName : ' + chaincodeName)
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
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

    let args = JSON.stringify(queryString)

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);
        message = message[0]
        let newObject = new Object()
        if (message.toString().includes("Error:")) {
            newObject.success = false
            newObject.message = message.toString().split("Error:")[1].trim()
            res.send(newObject)
        }
        else {
            newObject = new Object()
            newObject = JSON.parse(message.toString())
            newObject.success = true

            for (let i = 0; i < newObject.length; i++) {
                newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
                newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
            }

            let response = { "allRecords": newObject };
            res.send(response);
        }
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

router.get('/transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: projectIdTransaction ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const projectId = req.query.projectId

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('projectId : ' + projectId);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!projectId) {
        res.json(fieldErrorMessage('\'projectId\''));
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

    const args = JSON.stringify(queryString)

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        for (let i = 0; i < newObject.length; i++) {
            newObject[i]["Record"]["from"] = splitOrgName(newObject[i]["Record"]["from"])
            newObject[i]["Record"]["to"] = splitOrgName(newObject[i]["Record"]["to"])
        }

        res.send({ "allRecords": newObject });
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    const channelName = req.header('channelName');
    const chaincodeName = req.header('chaincodeName');
    const corporate = req.query.args
    const orgDLTName = req.query.args + '.corporate.csr.com'

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!channelName) {
        res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        res.json(fieldErrorMessage('\'corporate\''));
    }

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}}}'

    let args = queryString;

    try {
        let message = await query(req.userName, req.orgName, "GeneralQueryFunction", chaincodeName, channelName, args);

        console.log("mithun : ", message.toString())

        newObject = new Object()
        newObject = message;

        let result = []

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
            const timeDifference = endDate - Date.now()
            if (timeDifference < 0) {
                timeDifference = 0
            }
            response["daysLeft"] = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

            result.push(response)
        });

        res.send(result)
    }
    catch (e) {
        generateError(e, 'Failed to query GeneralQueryFunction', 401, next);
    }
});

module.exports = router;