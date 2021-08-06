require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN, CA_USERANME } = process.env;

const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const projectService = require('../../service/projectService')

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

//****************************** Create Project *******************************
// Create Project transaction on chaincode on target peers. - done but errors
router.post('/create', async (req, res, next) => {
    logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');

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
        await invoke.main(req.userName, req.orgName, "CreateProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json({ ...getMessage(true, 'Successfully invoked CreateProject'), 'projectId': projectId });
    }
    catch (e) {
        generateError(e, next)
    }
});

//****************************** Approve Project *******************************
// Approve Project transaction on chaincode on target peers. - done but errors
router.put('/approve', async (req, res, next) => {
    logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');

    //set extra attributes in request body.
    req.body.blockchain["creationDate"] = Date.now();
    const projectId = uuid().toString()

    let args = [JSON.stringify(req.body.blockchain), projectId, uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    let successBlockchain = false;

    try {
        await invoke.main(req.userName, req.orgName, "ApproveProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        successBlockchain = true
        let result = await projectService.updateProject(projectId, req.body.mongo)
        console.log(result)
        logger.debug('Mongo approve project success')
        return res.json(getMessage(true, "Project Approved succesfully"))

        //return res.json({ ...getMessage(true, 'Successfully invoked ApproveProject'), 'projectId': projectId });
    }
    catch (e) {
        if (successBlockchain) {
            generateError(err, next, 500, 'Failed to add contributor in mongo');
        }
        else {
            generateError(e, next)
        }
    }
});

//****************************** Update Project ******************************* - done
router.put('/update', async (req, res, next) => {
    logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const status = req.body.status;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'CHANNEL_NAME\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        return res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!status) {
        return res.json(fieldErrorMessage('\'status\''));
    }

    let args = [projectId, phaseNumber, status, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "UpdateProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked UpdateProject'));
    }
    catch (e) {
        generateError(e, next)
    }
});

//****************************** Project Update Visible To *******************************
// router.put('/updateVisibleTo', async (req, res, next) => {
//     logger.debug('==================== INVOKE UPDATE VISIBLE TO ON CHAINCODE ==================');

//     //extract parameters from request body.
//     const projectId = req.body.projectId;
//     let corporateName = req.body.corporateName;

//     if (!CHAINCODE_NAME) {
//         return res.json(fieldErrorMessage('\'chaincodeName\''));
//     } else if (!CHANNEL_NAME) {
//         return res.json(fieldErrorMessage('\'channelName\''));
//     } else if (!projectId) {
//         return res.json(fieldErrorMessage('\'projectId\''));
//     } else if (!corporateName) {
//         corporateName = "all"
//     }

//     let args = [projectId, corporateName, Date.now().toString(), uuid().toString()];
//     args = JSON.stringify(args);
//     logger.debug('args  : ' + args);

//     try {
//         await invoke(req.userName, req.orgName, "UpdateVisibleTo", CHAINCODE_NAME, CHANNEL_NAME, args);
//         return res.json(getMessage(true, 'Successfully invoked UpdateVisibleTo'));
//     }
//     catch (e) {
//         generateError(e, next)
//     }
// });

//****************************** validate a phase of a project
router.post('/validate-phase', async (req, res, next) => {
    logger.debug('==================== INVOKE VALIDATE PHASE TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const isValid = req.body.isValid;
    const comments = req.body.comments;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        return res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!isValid) {
        return res.json(fieldErrorMessage('\'isValid\''));
    }
    if (isValid === 'false' && !comments) {
        return res.json(fieldErrorMessage('\'comments\''));
    }

    let args = [projectId, phaseNumber, isValid, comments, Date.now().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "ValidatePhase", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked ValidatePhase'));
    }
    catch (e) {
        generateError(e, next);
    }
});

//****************************** add a document hash against a criterion
router.post('/add-document-hash', async (req, res, next) => {
    logger.debug('==================== INVOKE ADD DOCUMENT HASH TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const phaseNumber = req.body.phaseNumber;
    const criterion = req.body.criterion;
    const docHash = req.body.docHash;
    const docName = req.body.docName;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!phaseNumber) {
        return res.json(fieldErrorMessage('\'phaseNumber\''));
    } else if (!criterion) {
        return res.json(fieldErrorMessage('\'criterion\''));
    } else if (!docHash) {
        return res.json(fieldErrorMessage('\'docHash\''));
    } else if (!docName) {
        return res.json(fieldErrorMessage('\'docName\''));
    }

    let args = [projectId, phaseNumber, criterion, docHash, docName, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "AddDocumentHash", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked AddDocumentHash'));
    }
    catch (e) {
        generateError(e, next);
    }
});

// get all projects 
router.get('/all', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllProjects ==================');

    const orgDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    const self = req.query.self;
    const ongoing = req.query.ongoing;
    const newRecords = req.query.newRecords;
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const ngoName = req.query.ngoName;
    const projectType = req.query.projectType;
    const place = req.query.place;

    logger.debug('orgDLTName : ' + orgDLTName);
    logger.debug('query params : self-' + self + ' ongoing-' + ongoing + ' newRecords-' + newRecords + ' pageSize-' + pageSize + ' bookmark-' + bookmark + ' ngoName-' + ngoName);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!self) {
        return res.json(fieldErrorMessage('\'self\''));
    }
    if (!ongoing) {
        return res.json(fieldErrorMessage('\'ongoing\''));
    }
    if (!newRecords) {
        return res.json(fieldErrorMessage('\'newRecords\''));
    }
    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }

    let queryString = {
        "selector": {
            "docType": "Project",
            "approvalState": "Approved"
        },
        "sort": [{ "creationDate": "desc" }]
    }

    if (req.orgName === "creditsauthority" || self !== "true") {
        logger.debug("Get all Projects");
        if (ngoName.length != 0) {
            queryString["selector"]["ngo"] = ngoName + "." + ORG3_NAME + "." + BLOCKCHAIN_DOMAIN + ".com"
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
                            req.userName
                        ]
                    }
                }
            ]
        }
    } else if (req.orgName === "corporate") {
        queryString["selector"]["contributors"] = {}
        queryString["selector"]["contributors"][orgDLTName.replace(/\./g, "\\\\.")] = "exists";
    } else if (req.orgName === "ngo") {
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

    if (projectType) {
        queryString["selector"]["projectType"] = projectType;
    }
    if (place) {
        queryString["selector"]["place"] = place.toLowerCase();
    }

    logger.debug('queryString: ' + JSON.stringify(queryString));

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());
        if (message.toString().includes("Error:")) {
            let errorMessage = message.toString().split("Error:")[1].trim()
            return res.json(getMessage(false, errorMessage))
        }
        else {
            // let responseMetaObj = new Object()
            message['Results'].forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })
            let newObject = message['Results'];
            // newObject.success = true

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let response = {}
                response["totalReceived"] = 0;
                response["ourContribution"] = 0;

                let record = newObject[i]["Record"];
                logger.debug(`Project ${i} : ${JSON.stringify(record, null, 2)}`);

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

            logger.debug(`All : ${JSON.stringify(allRecords, null, 2)}`);
            finalResponse["records"] = allRecords
            return res.json(getMessage(true, finalResponse))
        }
    }
    catch (e) {
        generateError(e, next);
    }
});

//getOngoing project count for csr : 
router.get('/total-ongoing-projects', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalOngoingProjectCount ==================');

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
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

    logger.debug('queryString: ' + JSON.stringify(queryString));

    let args = JSON.stringify(queryString);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), projectCount: message.length })
    }
    catch (e) {
        generateError(e, next);
    }
});

//getOngoing project details for a perticular corporate : (NOT USED IN UI APP)
router.get('/corporate-project-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    const corporate = req.query.corporate;

    logger.debug('corporate : ' + corporate);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        return res.json(fieldErrorMessage('\'corporate\''));
    }

    //let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.' + ORG2_NAME + '\\\\.' + BLOCKCHAIN_DOMAIN + '\\\\.com":{"$exists":true}},"fields":["_id","ngo","projectName"]}'

    let args = queryString;

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);

        logger.debug(`response :  ${message.toString()}`)

        let newObject = message;

        let result = []

        newObject.forEach(e => {
            let returnObject = new Object()
            returnObject.projectId = e.Key
            returnObject.ngo = splitOrgName(e.Record.ngo)
            returnObject.projectName = e.Record.projectName
            result.push(returnObject)
        })
        return res.send(result)
    }
    catch (e) {
        generateError(e, next);
    }
});

//getCorporateProjectTransaction
router.get('/corporate-project-transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectTransaction ==================');
    let corporate = req.orgName === ORG1_NAME ? req.query.corporate : req.userName;
    const projectId = req.query.projectId

    logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        return res.json(fieldErrorMessage('\'corporate\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    }

    corporate += '.' + ORG2_NAME + '.' + BLOCKCHAIN_DOMAIN + ".com";

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
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        for (let i = 0; i < message.length; i++) {
            message[i]['Record']['from'] = splitOrgName(message[i]['Record']['from']);
            message[i]['Record']['to'] = splitOrgName(message[i]['Record']['to']);
        }

        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
    }
    catch (e) {
        generateError(e, next);
    }
});

//gives all corporate names along with their contribution (NOT USED)
router.get('/locked-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getProjectLockedDetails ==================');
    const projectId = req.query.projectId;

    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    }

    // let args = JSON.stringify("queryString");
    // logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "GetAllCorporates", CHAINCODE_NAME, CHANNEL_NAME, '');
        logger.debug(`response1 :  ${JSON.stringify(message, null, 2)}`)

        let corporateList = message

        let result = []

        for (let corporate of corporateList) {

            let queryString = {
                "selector": {
                    "_id": corporate + '_' + projectId
                }
            }

            let args1 = JSON.stringify(queryString);
            logger.debug('args1 : ' + args1);

            let message1 = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args1);
            message1 = JSON.parse(message1.toString());

            message1.forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })

            logger.debug(`response2 :  ${JSON.stringify(message1, null, 2)}`)


            message1.forEach(e => {
                let returnObject = {}
                returnObject.corporate = splitOrgName(e.Record.corporate)
                let totalsum = 0.0
                e.Record.funds.forEach(f => {
                    totalsum += f.qty
                })
                returnObject.quantity = totalsum
                result.push(returnObject)
            })
            return res.json({ ...getMessage(true, "CommonQuery successful"), Records: result })
        }
    }
    catch (e) {
        generateError(e, next)
    }
});

//getOngoing project count for csr : 
router.get('/total-corporate-ongoing-projects', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectOngoingCount ==================');
    // const corporate = req.query.corporate;

    logger.debug('corporate : ' + corporate);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        return res.json(fieldErrorMessage('\'corporate\''));
    }

    // let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let args = '{"selector":{"docType":"Project","projectState": {"$ne": "Completed"} ,"contributors.' + req.userName + '\\\\.' + ORG2_NAME + '\\\\.' + BLOCKCHAIN_DOMAIN + '\\\\.com":{"$exists":true}},"fields":["_id"]}'

    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), projectCount: message.length })
    }
    catch (e) {
        generateError(e, next)
    }
});

// Get Total Amount Locked for ProjectId
router.get('/total-project-locked-amount', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getTotalAmountLockedForProjectId ==================');
    //const corporate = req.query.corporate
    const projectId = req.query.projectId

    //logger.debug('corporate : ' + corporate);
    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    //if (!corporate) {
    //    return res.json(fieldErrorMessage('\'corporate\''));
    //    return;
    //}
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
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
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let result = 0

        message.forEach(e => {
            e.Record.funds.forEach(f => {
                result += f.qty
            })
        })

        return res.json({ ...getMessage(true, 'CommonQuery successful'), lockedAmount: result })
    }
    catch (e) {
        generateError(e, next)
    }
});

//getCorporateProjectTransaction
router.get('/ngo-project-and-locked-details', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectAndLockedAmountDetails ==================');
    // const ngo = req.query.ngo

    // logger.debug('ngo : ' + ngo);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    // if (!ngo) {
    //     return res.json(fieldErrorMessage('\'ngo\''));
    // }

    let queryString = {
        "selector": {
            "docType": "Project",
            "ngo": req.userName + "." + ORG3_NAME + "." + BLOCKCHAIN_DOMAIN + ".com"
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
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let response = []

        for (let i = 0; i < message.length; i++) {

            let obj = Object()
            obj.projectName = message[i].Record.projectName
            obj.totalProjectCost = message[i].Record.totalProjectCost

            //find amount locked for the project

            let queryString1 = {
                "selector": {
                    "project": message[i].Key,
                    "docType": "EscrowDetails"
                },
                "fields": [
                    "funds"
                ]
            }
            let args1 = JSON.stringify(queryString1)

            let message1 = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args1);

            message1 = JSON.parse(message1.toString());

            message1.forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })

            logger.debug(`response :  ${JSON.stringify(message1, null, 2)}`)

            let result = 0

            message1.forEach(e => {
                e.Record.funds.forEach(f => {
                    result += f.qty
                })
            })
            obj.locked = result
            obj.projectId = message[i].Key

            //get current phase details

            let amountCollected = 0
            for (let j = 0; j < message[i].Record.phases.length; j++) {

                if (message[i].Record.phases[j].phaseState == "Complete") {
                    amountCollected += message[i].Record.phases[j].qty - message[i].Record.phases[j].outstandingQty
                    continue
                }

                if (message[i].Record.phases[j].phaseState != "Complete") {
                    amountCollected += message[i].Record.phases[j].qty - message[i].Record.phases[j].outstandingQty
                    let phase = new Object()
                    phase.phaseNumber = j
                    phase.endDate = message[i].Record.phases[j].endDate
                    phase.qty = message[i].Record.phases[j].qty
                    phase.outstandingQty = message[i].Record.phases[j].outstandingQty
                    phase.phaseState = message[i].Record.phases[j].phaseState
                    obj.phase = phase

                    break
                }
            }
            obj.amountCollected = amountCollected
            response.push(obj)
        }
        return res.json({ ...getMessage(true, 'CommonQuery successful'), 'records': response })
    }
    catch (e) {
        generateError(e, next)
    }
});

router.get('/ngo-project-transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getNgoProjectTx ==================')

    const projectId = req.query.projectId
    const orgDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com"

    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
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
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            elem['Record']["from"] = splitOrgName(elem["Record"]["from"])
            elem['Record']["to"] = splitOrgName(elem["Record"]["to"])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
    }
    catch (e) {
        generateError(e, next)
    }
});

router.get('/transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: projectIdTransaction ==================');
    const projectId = req.query.projectId

    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
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
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            elem['Record']["from"] = splitOrgName(elem["Record"]["from"])
            elem['Record']["to"] = splitOrgName(elem["Record"]["to"])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
    }
    catch (e) {
        generateError(e, next)
    }
});

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    const corporate = req.query.args
    const orgDLTName = req.query.args + '.' + ORG2_NAME + '.' + BLOCKCHAIN_DOMAIN + ".com"

    logger.debug('corporate : ' + corporate);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        return res.json(fieldErrorMessage('\'corporate\''));
    }

    let args = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.' + ORG2_NAME + '\\\\.' + BLOCKCHAIN_DOMAIN + '\\\\.com":{"$exists":true}}}'
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        let result = []

        message.forEach(e => {
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
            let timeDifference = endDate - Date.now()
            if (timeDifference < 0) {
                timeDifference = 0
            }
            response["daysLeft"] = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

            result.push(response)
        });
        return res.json({ ...getMessage(true, 'CommonQuery successful'), 'records': result })
    }
    catch (e) {
        generateError(e, next)
    }
});


//delete a project by id
router.post('/delete', async (req, res, next) => {

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const comments = req.body.comments;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'CHANNEL_NAME\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!comments) {
        return res.json(fieldErrorMessage('\'comments\''));
    }


    let args = [projectId, comments, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {

        await invoke.main(req.userName, req.orgName, "DeleteProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        logger.debug('Successfully invoked DeleteProject')

        projectService.deleteProjectById(projectId)
            .then((data) => {
                console.log(data)
                logger.debug('Mongo delete project success')
                return res.json(getMessage(true, "Deleted project successfully"))
            })
            .catch(err => {
                generateError(err, next, 500, 'Failed to delete project in mongo');
            });
    }
    catch (e) {
        generateError(e, next)
    }
});

// get all projects by status
router.get('/get-allprojects', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllProjects ==================');

    const orgDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = req.query.projectStatus;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }
    if (!status) {
        return res.json(fieldErrorMessage('\'status\''));
    }

    let queryString = {
        "selector": {
            "docType": "Project",
            "approvalState": status
        }
    }

    if (orgMap[req.orgName.toLowerCase()] === ORG3_NAME) {
        queryString["selector"]["ngo"] = orgDLTName
    }

    logger.debug('queryString: ' + JSON.stringify(queryString));

    let args = [JSON.stringify(queryString), pageSize, bookmark];
    args = JSON.stringify(args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());
        if (message.toString().includes("Error:")) {
            let errorMessage = message.toString().split("Error:")[1].trim()
            return res.json(getMessage(false, errorMessage))
        }
        else {
            // let responseMetaObj = new Object()
            message['Results'].forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })
            let newObject = message['Results'];
            // newObject.success = true

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let response = {}
                response["totalReceived"] = 0;
                response["ourContribution"] = 0;

                let record = newObject[i]["Record"];
                logger.debug(`Project ${i} : ${JSON.stringify(record, null, 2)}`);

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

            logger.debug(`All : ${JSON.stringify(allRecords, null, 2)}`);
            finalResponse["records"] = allRecords
            return res.json(getMessage(true, finalResponse))
        }
    }
    catch (e) {
        generateError(e, next);
    }
});



//abandon a project by id
router.put('/abandon', async (req, res, next) => {

    //extract parameters from request body.
    const projectId = req.body.projectId;
    const comments = req.body.comments;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'CHANNEL_NAME\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!comments) {
        return res.json(fieldErrorMessage('\'comments\''));
    }


    let args = [projectId, comments, Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {

        await invoke.main(req.userName, req.orgName, "AbandonProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        logger.debug('Successfully invoked AbandonProject')
        return res.json(getMessage(true, "Abandoned project successfully"))
    }
    catch (e) {
        generateError(e, next)
    }
});


module.exports = router;