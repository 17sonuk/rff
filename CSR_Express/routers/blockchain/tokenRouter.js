require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const projectService = require('../../service/projectService');
const commonService = require('../../service/commonService');
const { fieldErrorMessage, generateError, getMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

// Request Token transaction on chaincode on target peers.- done // to discuss **
router.post('/request', async (req, res, next) => {
    logger.debug('==================== INVOKE REQUEST TOKEN ON CHAINCODE ==================');

    //extract fields from request body.
    const amount = req.body.amount.toString();
    const paymentId = req.body.paymentId;
    const paymentStatus = req.body.paymentStatus;
    const comments = !req.body.comments ? "" : req.body.comments;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (!paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }
    if (!paymentStatus) {
        return res.json(fieldErrorMessage('\'paymentStatus\''));
    }

    let args = [amount, paymentId, paymentStatus, comments, Date.now().toString(), uuid().toString()];
    //added current UTC date(in epoch milliseconds) to args
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        if (paymentStatus === 'COMPLETED') {   // to discuss **
            await invoke.main(req.userName, req.orgName, "RequestTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
            return res.json(getMessage(true, 'Successfully credited funds'));
        } else if (paymentStatus === 'PENDING') {
            await invoke.main(req.userName, req.orgName, "RequestTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
            return res.json(getMessage(true, 'Request is pending with Rainforest US. Please wait to receive funds in your wallet.'));
        } else {
            let error = new Error('Some error occured!');
            error.status = 500;
            throw error
        }
    } catch (e) {
        generateError(e, next);
    }
});

// Assign Token transaction on chaincode on target peers. - dome
router.post('/assign', async (req, res, next) => {
    logger.debug('==================== INVOKE ASSIGN TOKEN ON CHAINCODE ==================');

    const paymentId = req.body.paymentId;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }

    let args = [paymentId, Date.now().toString(), uuid().toString()]
    //added current UTC date(in epoch milliseconds) to args
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "AssignTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked AssignTokens'));
    } catch (e) {
        generateError(e, next);
    }
});

// Assign Token transaction on chaincode on target peers. - done
router.post('/reject', async (req, res, next) => {
    logger.debug('==================== INVOKE rejectTokens TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const paymentId = req.body.paymentId;
    const comment = req.body.comment;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    } else if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    } else if (!paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    } else if (!comment) {
        return res.json(fieldErrorMessage('\'comment\''));
    }

    let args = [paymentId, comment, Date.now().toString(), uuid().toString()]
    //added current UTC date(in epoch milliseconds) to args
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "RejectTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked RejectTokens'));
    }
    catch (e) {
        generateError(e, next);
    }
});

//tranfer token api
router.post('/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const projectId = req.body.projectId;
    //const phaseNumber = req.body.phaseNumber.toString();
    let notes = req.body.notes ? req.body.notes : "";
    const donorDetails = req.body.donorDetails;

    if (!CHAINCODE_NAME)
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    if (!CHANNEL_NAME)
        return res.json(fieldErrorMessage('\'channelName\''));
    if (!amount)
        return res.json(fieldErrorMessage('\'amount\''));
    if (!projectId)
        return res.json(fieldErrorMessage('\'projectId\''));
    // if (!phaseNumber)
    //     return res.json(fieldErrorMessage('\'phaseNumber\''));
    if (!donorDetails)
        return res.json(fieldErrorMessage('\'donorDetails\''));
    if (req.userName !== 'guest') {
        // if (!donorDetails.email)
        donorDetails.email = req.email
        //return res.json(fieldErrorMessage('\'donor email id\''));
        // if (!donorDetails.name)
        donorDetails.name = req.name
        // return res.json(fieldErrorMessage('\'donor name\''));
    }
    if (req.userName === 'guest' && !donorDetails.paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }
    if (req.userName === 'guest') {
        notes = donorDetails.email + "\n" + "PaymentId - " + donorDetails.paymentId + "\n" + notes
    }

    logger.debug(notes)
    let args = [amount, projectId, notes, Date.now().toString(), uuid().toString()]
    if (req.userName === 'guest') {
        args[4] = donorDetails.paymentId;
    }
    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        logger.debug('Blockchain transfer success')
        // add contributor in mongoDB
        // assumption: mongo service won't fail.
        projectService.addContributor(projectId, req.userName)
            .then((data) => {
                logger.debug('Mongo add contributors success')
                return res.json(getMessage(true, "Transferred succesfully"))
            })
            .catch(err => {
                generateError(err, next, 500, 'Failed to add contributor in mongo');
            });

        if (donorDetails.email) {
            commonService.saveDonor(donorDetails)
                .then((data) => {
                    logger.debug('saved donor details')
                    logger.debug(data)
                })
                .catch(err => {
                    generateError(err, next, 500, 'Failed to save donor details');
                })
        }
        //call a service that sends email to donor
        if (req.userName !== '') {
            if (req.userName === 'guest' && donorDetails.email != "") {
                commonService.sendEmailToDonor(donorDetails.email, 'Guest', amount,projectId,'')
                    .then((data) => {
                        logger.debug('email sent to donor')
                        logger.debug(data)
                    })
                    .catch(err => {
                        generateError(err, next, 500, 'Failed to send email to donor');
                    })
            }
            else if (req.userName !== 'guest') {
                let orgDetails = await commonService.getOrgDetails(req.userName);
                if (orgDetails && orgDetails.email) {
                    let donorName = orgDetails.firstName;
                    if (orgDetails.subRole === 'Institution') {
                        donorName = orgDetails.orgName;
                    }
                    commonService.sendEmailToDonor(orgDetails.email, donorName, amount,projectId,orgDetails.address)
                        .then((data) => {
                            logger.debug('email send to donor')
                            logger.debug(data)
                        })
                        .catch(err => {
                            generateError(err, next, 500, 'Failed to send email to donor');
                        })
                }

            }else{
                logger.debug("No email is sent since no email is provided by guest user")
            }
        }

    }
    catch (e) {
        generateError(e, next);
    }
});

// get All TokenRequests - done
router.get('/all-requests', async (req, res, next) => {
    logger.debug('==================== QUERY BY CHAINCODE: getAllTokenRequests ==================');
    const userDLTName = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";

    const pageSize = req.query.pageSize;
    let bookmark = req.query.bookmark;
    const status = req.query.status;

    logger.debug('pageSize : ' + pageSize);
    logger.debug('bookmark : ' + bookmark);
    logger.debug('status : ' + status);

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
    if (!bookmark) {
        bookmark = '';
    }

    const queryString = {
        "selector": {
            "docType": "TokenRequest",
            "status": status
        },
        "sort": [{ "date": "asc" }]
    }

    if (req.orgName === 'creditsauthority') {
        logger.debug('CA has requested...')
    }
    else if (req.orgName === 'corporate') {
        queryString['selector']['from'] = userDLTName
    }
    else {
        return res.json(getMessage(false, 'Unauthorised token tx request access...'))
    }

    let args = [JSON.stringify(queryString), String(pageSize), bookmark];
    args = JSON.stringify(args);
    logger.debug('args : ' + args);

    try {
        let message = await query.main(req.userName, req.orgName, "CommonQueryPagination", CHAINCODE_NAME, CHANNEL_NAME, args);
        message = JSON.parse(message.toString());

        logger.debug(JSON.stringify(message, null, 2))

        if (message.toString().includes("Error:")) {
            let errorMessage = message.toString().split("Error:")[1].trim()
            return res.json(getMessage(false, errorMessage))
        }
        else {
            message['Results'] = message['Results'].map(elem => {
                elem['Record'] = JSON.parse(elem['Record'])
                elem['Record']['from'] = splitOrgName(elem['Record']['from'])
                //elem['Record']['role'] = splitOrgName(elem['Record']['role'])
                return elem['Record']
            })

            let finalResponse = {}

            //populate the MetaData
            finalResponse["metaData"] = {}
            finalResponse["metaData"]["recordsCount"] = message["RecordsCount"];
            finalResponse["metaData"]["bookmark"] = message["Bookmark"];
            finalResponse['records'] = message['Results']
            return res.json(getMessage(true, finalResponse));
        }
    }
    catch (e) {
        generateError(e, next);
    }
});

module.exports = router;