require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN, CA_USERANME } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const logger = require('../../loggers/logger');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');
const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const projectService = require('../../service/projectService')
const commonService = require('../../service/commonService')
let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

const { orgModel, projectModel } = require('../../model/models')
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: SMTP_EMAIL,
        pass: APP_PASSWORD,
    },
});

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
    console.log('body approve: ', req.body)
    //set extra attributes in request body.
    const projectId = req.body.projectId
    req.body.mongo.projectId = projectId
    let args = [JSON.stringify(req.body.blockchain), projectId, uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    let successBlockchain = false;

    try {
        await invoke.main(req.userName, req.orgName, "ApproveProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        successBlockchain = true
        let result = await projectService.updateProjectForApproval(projectId, req.body.mongo)
        console.log(result)
        return res.json(getMessage(true, "Project Approved succesfully"))
    }
    catch (e) {
        if (successBlockchain) {
            generateError(e, next, 500, 'Failed to add contributor in mongo');
        }
        else {
            generateError(e, next)
        }
    }
});

//****************************** Update Project ******************************* - done
router.put('/update', async (req, res, next) => {
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

//****************************** validate phase
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
        logger.debug('Successfully invoked ValidatePhase')

        if (isValid === "true") {
            commonService.MilestoneEmail(projectId, phaseNumber, req.userName, req.orgName)
        }
        commonService.ProjectCompletionEmail(projectId, req.userName, req.orgName)
        return res.json(getMessage(true, "Successfully validated the phase"))
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
    } else if (req.orgName === "corporate") {
        queryString["selector"]["contributors"] = {}
        queryString["selector"]["contributors"][orgDLTName.replace(/\./g, "\\\\.")] = "exists";
    } else if (req.orgName === "ngo") {
        queryString["selector"]["ngo"] = orgDLTName
    }

    queryString["selector"]["projectState"] = {};
    if (ongoing === "true") {
        queryString["selector"]["projectState"]["$ne"] = "Validated"
    }
    else if (ongoing === "false") {
        queryString["selector"]["projectState"]["$eq"] = "Validated"
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
            message['Results'].forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })
            let newObject = message['Results'];
            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let record = newObject[i]["Record"];
                logger.debug(`Project ${i} : ${JSON.stringify(record, null, 2)}`);

                let response = {}
                response["totalReceived"] = record.totalReceived;
                response["ourContribution"] = 0;

                if (record["contributions"][orgDLTName] !== undefined) {
                    response["ourContribution"] += record["contributions"][orgDLTName]["contributionQty"];
                }

                let currentPhase = 0;
                for (let f = 0; f < record.phases.length; f++) {
                    if (record.phases[f]["phaseState"] !== "Created") {
                        currentPhase = f
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
                response["percentageFundReceived"] = (record["totalReceived"] / record['totalProjectCost']) * 100;

                let endDate = record.phases[record.phases.length - 1]['endDate']
                let timeDifference = endDate - Date.now()
                if (timeDifference < 0) {
                    timeDifference = 0
                }
                //daysLeftToStart = no of days between currentDate and Start date of 1st phase.
                //daysPassed = no of days between Start date of 1st phase and current date.
                response['daysLeft'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                let startDate = record.phases[0]['startDate']
                let timeDiff = startDate - Date.now()
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                timeDiff = Date.now() - startDate
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysPassed'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

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
    let corporate = req.orgName === "creditsauthority" ? req.query.corporate : req.userName;
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
                    "TransferToken"
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

//getOngoing project count for csr : 
router.get('/total-corporate-ongoing-projects', async (req, res, next) => {

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!corporate) {
        return res.json(fieldErrorMessage('\'corporate\''));
    }

    let args = '{"selector":{"docType":"Project","projectState": {"$ne": "Validated"} ,"contributors.' + req.userName + '\\\\.' + ORG2_NAME + '\\\\.' + BLOCKCHAIN_DOMAIN + '\\\\.com":{"$exists":true}},"fields":["_id"]}'

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

    let queryString = {
        "selector": {
            "docType": "Transaction",
            "to": orgDLTName,
            "txType": {
                "$in": [
                    "TransferToken",
                ]
            },
        },
        "sort": [{ "date": "desc" }]
    }
    if (projectId) {
        let regex = projectId + "$";

        queryString['selector']['objRef'] = { '$regex': regex }
    }

    let args = JSON.stringify(queryString)
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        let projectMemory = {}
        if (!projectId) {     
            var mongoProject = await projectModel.find({ ngo: req.userName }, { _id: 0, projectId: 1, projectName: 1, projectType: 1 })

            for (let d = 0; d < mongoProject.length; d++) {
                let p = mongoProject[d]
                projectMemory[p.projectId] = p
            }


        }
        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            elem['Record']["from"] = splitOrgName(elem["Record"]["from"])
            elem['Record']["to"] = splitOrgName(elem["Record"]["to"])
            if (!projectId && projectMemory[elem['Record']['objRef']]) {
                elem['Record']["projectName"] = projectMemory[elem['Record']['objRef']].projectName
                elem['Record']["projectType"] = projectMemory[elem['Record']['objRef']].projectType

            }
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
    }
    catch (e) {
        generateError(e, next)
    }
});

router.get('/transactions', async (req, res, next) => {
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
                    "TransferToken"
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
            response["totalReceived"] = e["Record"]["totalReceived"]
            response["ourContribution"] = 0;

            if (e["Record"]["contributions"][orgDLTName.toString()] !== undefined) {
                response["ourContribution"] += e["Record"]["contributions"][orgDLTName.toString()]["contributionQty"]
            }

            for (let f = 0; f < e["Record"].phases.length; f++) {
                if (e["Record"].phases[f]["phaseState"] !== "Created") {
                    response["currentPhase"] = f + 1;
                    response["currentPhaseStatus"] = e["Record"].phases[f]["phaseState"];
                    response["currentPhaseTarget"] = e["Record"].phases[f]["qty"];
                    response["currentPhaseOutstandingAmount"] = e["Record"].phases[f]["outstandingQty"];
                    response["percentageFundReceived"] = ((e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"]) / e["Record"].phases[f]["qty"]) * 100
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
            response["daysLeft"] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

            let startDate = e["Record"].phases[0]['startDate']
            let timeDiff = startDate - Date.now()
            if (timeDiff < 0) {
                timeDiff = 0
            }
            response['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

            timeDiff = Date.now() - startDate
            if (timeDiff < 0) {
                timeDiff = 0
            }
            response['daysPassed'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));


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
    const orgDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const status = decodeURIComponent(req.query.projectStatus);
    const projectType = req.query.projectType;
    const place = req.query.place;

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

    if (status === 'Seeking Validation' || status === 'Validated') {
        delete queryString["selector"]['approvalState'];
        queryString["selector"]['projectState'] = status;
    }

    if (orgMap[req.orgName.toLowerCase()] === ORG3_NAME) {
        queryString["selector"]["ngo"] = orgDLTName
    } else if (orgMap[req.orgName.toLowerCase()] === ORG2_NAME) {
        queryString["selector"]['approvalState'] = 'Abandoned';
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
            message['Results'].forEach(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
            })
            let newObject = message['Results'];
            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let record = newObject[i]["Record"];
                logger.debug(`Project ${i} : ${JSON.stringify(record, null, 2)}`);

                let response = {}
                response["totalReceived"] = record.totalReceived;
                response["ourContribution"] = 0;

                if (record["contributions"][orgDLTName] !== undefined) {
                    response["ourContribution"] += record["contributions"][orgDLTName]["contributionQty"];
                }

                let currentPhase = 0;
                for (let f = 0; f < record.phases.length; f++) {
                    let phaseQty = record.phases[f]["qty"];
                    let phaseOutstandingQty = record.phases[f]["outstandingQty"]

                    response["totalReceived"] += (phaseQty - phaseOutstandingQty)
                    if (record.phases[f]["phaseState"] !== "Created") {
                        currentPhase = f
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
                response['daysLeft'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                let startDate = record.phases[0]['startDate']
                let timeDiff = startDate - Date.now()
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                timeDiff = Date.now() - startDate
                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysPassed'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

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

// get all filtered projects by status,place, projectType, approvalState, projectState,
router.get('/filtered-projects', async (req, res, next) => {
    const orgDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    const self = req.query.self;
    const applyFilter = req.query.applyFilter;
    const pageSize = req.query.pageSize;
    const bookmark = req.query.bookmark;
    const projectStatus = req.query.projectStatus ? decodeURIComponent(req.query.projectStatus) : "";
    const approvalStatus = req.query.approvalStatus ? decodeURIComponent(req.query.approvalStatus) : "";
    const place = req.query.place ? decodeURIComponent(req.query.place) : "";

    const projectType = req.query.projectType;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!self) {
        return res.json(fieldErrorMessage('\'self\''));
    }
    if (!applyFilter) {
        return res.json(fieldErrorMessage('\'applyFilter\''));
    }
    if (!pageSize) {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }

    if (req.orgName === 'creditsauthority' && self === "true") {
        return res.json(fieldErrorMessage('\'self\''));
    }

    if (req.orgName === "corporate" && approvalStatus === "UnApproved") {
        return res.json(fieldErrorMessage('\'approvalStatus\''));
    }

    if (req.userName === 'guest' && self === "true") {
        return res.json(fieldErrorMessage('\'self\''));
    }

    if (req.orgName === 'ngo' && self === "false") {
        return res.json(fieldErrorMessage('\'self\''));
    }

    let queryString = {
        "selector": {
            "docType": "Project"
        }
    }

    if (applyFilter === "false") {
        queryString["selector"]['approvalState'] = "Approved";
        queryString["selector"]['projectState'] = { "$ne": "Validated" }
    } else if (applyFilter === "true") {
        if (approvalStatus) {
            queryString["selector"]['approvalState'] = approvalStatus;
        }
        if (projectStatus) {
            queryString["selector"]['projectState'] = projectStatus;
        }
        if (!approvalStatus && !projectStatus && req.orgName === "corporate") {
            queryString["selector"]['approvalState'] = { "$ne": "UnApproved" }
        }
    }

    if (self === "true") {
        if (req.orgName === "ngo") {
            queryString["selector"]["ngo"] = orgDLTName
        } else if (req.orgName === "corporate") {
            queryString["selector"]["contributors"] = {}
            queryString["selector"]["contributors"][orgDLTName.replace(/\./g, "\\\\.")] = "exists";
        }
    }

    if (projectType) {
        queryString["selector"]["projectType"] = projectType;
    }
    if (place) {
        queryString["selector"]["place"] = place.toLowerCase();
    }
    console.log("query :", queryString)
    console.log("place", place)

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
            let newObject = message['Results'];

            let finalResponse = {}
            let allRecords = []

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];

            //loop over the projects
            for (let i = 0; i < newObject.length; i++) {

                let record = JSON.parse(newObject[i]["Record"]);
                logger.debug(`Project ${i} : ${JSON.stringify(record, null, 2)}`);

                let response = {}
                response = record
                console.log("record: ", record)
                console.log("response: ", response)
                // response["totalReceived"] = 0;
                response["ourContribution"] = 0;

                if (response["contributions"][orgDLTName] !== undefined) {
                    response["ourContribution"] += response["contributions"][orgDLTName]["contributionQty"];
                }

                let currentPhase = 0;
                for (let f = 0; f < response.phases.length; f++) {
                    if (response.phases[f]["phaseState"] !== "Created") {
                        currentPhase = f
                    }
                }

                response['currentPhase'] = currentPhase + 1;
                response['currentPhaseStatus'] = response.phases[currentPhase]['phaseState'];
                response['currentPhaseTarget'] = response.phases[currentPhase]['qty'];
                response['currentPhaseOutstandingAmount'] = response.phases[currentPhase]['outstandingQty'];

                response['projectId'] = newObject[i]['Key']
                response['contributors'] = Object.keys(response['contributors']).map(splitOrgName)
                response['ngo'] = splitOrgName(response['ngo'])
                response['totalPhases'] = response.phases.length
                response["percentageFundReceived"] = (response["totalReceived"] / response['totalProjectCost']) * 100;

                let endDate = response.phases[response.phases.length - 1]['endDate']
                let timeDifference = endDate - Date.now()
                if (timeDifference < 0) {
                    timeDifference = 0
                }
                response['daysLeft'] = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                let actualStartDate = response.actualStartDate
                let startDate = response.phases[0]['startDate']

                let timeDiff = startDate - Date.now()
                if (actualStartDate!==0) {
                    timeDiff = actualStartDate - Date.now()
                }

                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

                timeDiff = Date.now() - startDate
                if (actualStartDate!==0) {
                    timeDiff = Date.now() - actualStartDate
                }

                if (timeDiff < 0) {
                    timeDiff = 0
                }
                response['daysPassed'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

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

//****************************** Edit Project *******************************
router.put('/edit', async (req, res, next) => {
    const projectId = req.body.projectId;
    const projectdetails = req.body.mongo;
    const projectblock = req.body.blockchain;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'CHANNEL_NAME\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    } else if (!projectdetails) {
        return res.json(fieldErrorMessage('\'projectdetails\''));
    }

    let args = [projectId, JSON.stringify(projectblock), Date.now().toString(), uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "EditProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        let queryString = {
            "selector": {
                "_id": projectId
            }
        }
        args = JSON.stringify(queryString)
        logger.debug(`query string:\n ${args}`);

        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
        })
        console.log("message: project data: ", message)
        let currentPhaseNum = -1
        if (message.length > 0) {
            if (message[0]['Record']['docType'] === 'Project') {
                message = message[0]
                if (message['Record']['approvalState'] === "Approved") {

                    for (let f = 0; f < message['Record'].phases.length; f++) {

                        if (message["Record"].phases[f]["phaseState"] !== "Validated") {

                            currentPhaseNum = f;
                            break;
                        }

                    }

                } else {
                    return res.json(getMessage(true, "Only Approved project allowed to edit"))
                }
            }
        }
        console.log('currentPhaseNum: ', currentPhaseNum)
        if (currentPhaseNum === -1) {
            return res.json(getMessage(true, "failed to find current phaseNumber"))
        }
        projectService.editProject(projectId, projectdetails, currentPhaseNum)
            .then((data) => {
                return res.json(getMessage(true, "Edit project successfully"))
            })
            .catch(err => {
                generateError(err, next, 500, 'Failed to edit project in mongo');
            });

    }
    catch (e) {
        generateError(e, next)
    }
});

//projectInitition
router.post('/initiate', async (req, res, next) => {
    logger.debug('router-initiateProject');

    const projectId = req.body.projectId;
    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'CHANNEL_NAME\''));
    } else if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    }

    let args = [projectId, Date.now().toString(), uuid().toString()]
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "UpdateActualStartDate", CHAINCODE_NAME, CHANNEL_NAME, args);
        commonService.projectInitiation(projectId, req.userName, req.orgName)
            .then((data) => {
                logger.info('email sent')
            })
            .catch(err => {
                logger.error('email sending failed')
                console.log(err)
            })
        return res.json(getMessage(true, "Project has been initiated and donors have been notified!"));
    }
    catch (e) {
        generateError(e, next);
    }
})


router.get('/userProfile/transactions', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: projectIdTransaction ==================');
    const projectId = req.query.projectId
    const ngo = req.query.ngo
    const corporate = req.query.corporate


    logger.debug('projectId : ' + projectId);

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }

    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }



    let queryString = {
        "selector": {
            "docType": "Transaction",
            "txType": {
                "$in": [
                    "TransferToken"
                ]
            }
        }
    }

    if (ngo) {
        queryString['selector']['to'] = ngo + "." + orgMap['ngo'] + "." + BLOCKCHAIN_DOMAIN + ".com"
    }
    if (corporate) {
        queryString['selector']['from'] = corporate + "." + orgMap['corporate'] + "." + BLOCKCHAIN_DOMAIN + ".com"
    }
    if (projectId) {
        queryString['selector']['objRef'] = { '$regex': projectId }
        console.log("query: ", queryString)
    }

    const args = JSON.stringify(queryString)
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        let projectMemory = {}
        if (!projectId) {

            if (ngo && !corporate) {
                var mongoProject = await projectModel.find({ 'ngo': ngo }, { _id: 0, projectId: 1, projectName: 1, projectType: 1 })
            } else if (!ngo && corporate) {
                mongoProject = await projectModel.find({ 'contributorsList': corporate }, { _id: 0, projectId: 1, projectName: 1, projectType: 1 })
            } else if (ngo && corporate) {
                mongoProject = await projectModel.find({ 'ngo': ngo, 'contributorsList': corporate }, { _id: 0, projectId: 1, projectName: 1, projectType: 1 })
            } else {
                mongoProject = await projectModel.find({}, { _id: 0, projectId: 1, projectName: 1, projectType: 1 })
            }

            for (let d = 0; d < mongoProject.length; d++) {
                let p = mongoProject[d]
                projectMemory[p.projectId] = p
            }
        }

        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            elem['Record']["from"] = splitOrgName(elem["Record"]["from"])
            elem['Record']["to"] = splitOrgName(elem["Record"]["to"])
            if (!projectId && projectMemory[elem['Record']['objRef']]) {
                elem['Record']["projectName"] = projectMemory[elem['Record']['objRef']].projectName
                elem['Record']["projectType"] = projectMemory[elem['Record']['objRef']].projectType
            }
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)

        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
    }
    catch (e) {
        generateError(e, next)
    }
});

module.exports = router;