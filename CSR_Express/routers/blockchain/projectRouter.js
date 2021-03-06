require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN, CA_USERANME } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
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
    port: 465,
    secure: true, // Compliant
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

    // const projectId = uuid().toString()
    let projectId = ''
    if (!req.body.projectId) {
        projectId = uuid().toString()
    } else {
        projectId = req.body.projectId;
        delete req.body['projectId'];
    }


    let args = [JSON.stringify(req.body), projectId, uuid().toString()];
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "CreateProject", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json({ ...getMessage(true, messages.success.INVOKE_CREATE_PROJECT), 'projectId': projectId });
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
        return res.json(getMessage(true, messages.success.PROJECT_APPROVAL))
    }
    catch (e) {
        if (successBlockchain) {
            generateError(e, next, 500, messages.error.ADD_CONTRIBUTOR_FAILURE);
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
        return res.json(getMessage(true, messages.success.INVOKE_UPDATE_PROJECT));
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
        // commonService.ProjectCompletionEmail(projectId, req.userName, req.orgName)
        return res.json(getMessage(true, messages.success.VALIDATE_PHASE))
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
        return res.json(getMessage(true, messages.success.INVOKE_DOCUMENT_HASH));
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

    //changes
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

    if (req.orgName === 'corporate') {
        queryString["fields"] = ["date", "docType", "from", "objRef", "phaseNumber", "qty", "to", "txType"]
    }
    const args = JSON.stringify(queryString)
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQuery", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());
        regDonors = []
        message.forEach(elem => {
            elem['Record'] = JSON.parse(elem['Record'])
            elem['Record']["from"] = splitOrgName(elem["Record"]["from"])
            elem['Record']["to"] = splitOrgName(elem["Record"]["to"])
            regDonors.push(elem['Record']['from'])
        })

        let orgs = await orgModel.find({ userName: { $in: regDonors } }, { _id: 0, userName: 1, hide: 1 })
        let orgsObj = {}
        for (let o = 0; o < orgs.length; o++) {
            let org = orgs[o]
            orgsObj[org.userName] = org.hide
        }

        message.forEach(elem => {
            if (orgsObj[elem['Record']['from']]) {
                elem['Record']["hide"] = orgsObj[elem['Record']['from']]
            } else {
                elem['Record']["hide"] = false
            }
        })

        logger.debug(`response :  ${JSON.stringify(message, null, 2)}`)
        return res.json({ ...getMessage(true, 'CommonQuery successful'), "records": message });
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
                return res.json(getMessage(true, messages.success.PROJECT_DELETE))
            })
            .catch(err => {
                generateError(err, next, 500, messages.error.FAILED_PROJECT_DELETE);
            });
    }
    catch (e) {
        generateError(e, next)
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

    if (typeof pageSize === 'string' && typeof parseInt(pageSize) !== 'number') {
        return res.json(fieldErrorMessage('\'pageSize\''));
    }
    let alpha = /^[.0-9a-zA-Z_-]*$/;
    if (typeof bookmark === 'string' && !bookmark.match(alpha)) {
        return res.json(fieldErrorMessage('\'bookmark\''));
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
        if (projectStatus === "Active") {
            delete queryString['selector']['projectState'];

            let time = new Date().getTime()
            queryString['selector']['approvalState'] = "Approved"
            queryString['selector']['$and'] = [
                {
                    "projectState": {
                        "$ne": "Validated"
                    }
                },
                {
                    "$or": [
                        {
                            "actualStartDate": {
                                "$ne": 0
                            }
                        },
                        {
                            "phases.0.startDate": { "$lte": time }
                        }
                    ]
                }
            ]
        }
        if (projectStatus === "Open For Funding") {
            delete queryString['selector']['projectState'];

            queryString['selector']['approvalState'] = "Approved"
            queryString['selector']['$and'] = [
                {
                    "projectState": {
                        "$ne": "Fully Funded"
                    }
                },
                {
                    "projectState": {
                        "$ne": "Validated"
                    }
                }
            ]
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
            if (actualStartDate !== 0) {
                timeDiff = actualStartDate - Date.now()
            }
            if (timeDiff < 0) {
                timeDiff = 0
            }
            response['daysLeftToStart'] = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            timeDiff = Date.now() - startDate
            if (actualStartDate !== 0) {
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
    catch (e) {
        if (e.toString().includes("Invalid bookmark value")) {
            let error = {}
            error.message = "Invalid bookmark value";
            error.status = 400;
            next(error);
        }
        else {
            generateError(e, next);
        }
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
        return res.json(getMessage(true, messages.success.ABANDON_PROJECT))
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
                    return res.json(getMessage(true, messages.error.APPROVED_PROJECT_EDIT))
                }
            }
        }
        console.log('currentPhaseNum: ', currentPhaseNum)
        if (currentPhaseNum === -1) {
            return res.json(getMessage(true, messages.error.INVALID_PHASE_NUMBER))
        }
        projectService.editProject(projectId, projectdetails, currentPhaseNum)
            .then((data) => {
                return res.json(getMessage(true, messages.success.PROJECT_EDIT))
            })
            .catch(err => {
                generateError(err, next, 500, messages.error.FAILED_EDIT_PROJECT);
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
        return res.json(getMessage(true, messages.success.PROJECT_INITIATED));
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