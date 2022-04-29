require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');

const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
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

//tranfer token api
router.post('/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');

    //extract parameters from request body.
    const amount = req.body.amount.toString();
    const projectId = req.body.projectId;
    let notes = req.body.notes ? req.body.notes : "";
    const donorDetails = req.body.donorDetails;
    let paymentMode = req.body.paymentMode;

    if (!CHAINCODE_NAME) {
        return res.json(fieldErrorMessage('\'chaincodeName\''));
    }
    if (!CHANNEL_NAME) {
        return res.json(fieldErrorMessage('\'channelName\''));
    }
    if (!amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (!projectId) {
        return res.json(fieldErrorMessage('\'projectId\''));
    }
    if (!donorDetails) {
        return res.json(fieldErrorMessage('\'donorDetails\''));
    }
    if (!paymentMode) {
        return res.json(fieldErrorMessage('\'paymentMode\''));
    }
    // if (req.userName === 'guest' && !donorDetails.paymentId) {
    //     return res.json(fieldErrorMessage('\'paymentId\''));
    // }

    if (!donorDetails.paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }

    if (req.userName !== 'guest') {
        donorDetails.email = req.email
        donorDetails.name = req.name
    }

    if (req.userName === 'guest') {
        notes = donorDetails.email + "\n" + "PaymentId - " + donorDetails.paymentId + "\n" + notes
    }

    // let args = [amount, projectId, notes, Date.now().toString(), uuid().toString()]
    // if (req.userName === 'guest') {
    //     args[4] = donorDetails.paymentId;
    // }
    let args = [amount, projectId, notes, Date.now().toString(), uuid().toString(), donorDetails.paymentId, paymentMode]
    args = JSON.stringify(args);

    try {
        await invoke.main(req.userName, req.orgName, "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
        logger.debug('Blockchain transfer success')

        // add contributor in mongoDB
        // assumption: mongo service won't fail.
        projectService.addContributor(projectId, req.userName)
            .then((data) => {
                return res.json(getMessage(true, messages.success.TRANSFER_SUCCESS))
            })
            .catch(err => {
                generateError(err, next, 500, messages.error.ADD_CONTRIBUTOR_FAILURE);
            });

        if (donorDetails.email) {
            commonService.saveDonor(donorDetails)
                .then((data) => {
                    logger.debug('saved donor details')
                })
                .catch(err => {
                    generateError(err, next, 500, messages.error.SAVE_DONOR_ERROR);
                })
        }

        // //call a service that sends email to donor
        // if (req.userName !== '') {
        //     if (req.userName === 'guest' && donorDetails.email != "") {
        //         commonService.sendEmailToDonor(donorDetails.email, 'Guest', amount, projectId, '')
        //             .then((data) => {
        //                 logger.debug('email sent to donor')
        //             })
        //             .catch(err => {
        //                 generateError(err, next, 500, 'Failed to send email to donor');
        //             })
        //     }
        //     else if (req.userName !== 'guest') {
        //         let orgDetails = await commonService.getOrgDetails(req.userName);

        //         if (orgDetails && orgDetails.email) {
        //             let donorName = orgDetails.firstName;

        //             if (orgDetails.subRole === 'Institution') {
        //                 donorName = orgDetails.orgName;
        //             }

        //             commonService.sendEmailToDonor(orgDetails.email, donorName, amount, projectId, orgDetails.address)
        //                 .then((data) => {
        //                     logger.debug('email send to donor')
        //                 })
        //                 .catch(err => {
        //                     generateError(err, next, 500, 'Failed to send email to donor');
        //                 })
        //         }
        //     } else {
        //         logger.debug("No email is sent since no email is provided by guest user")
        //     }
        // }
        //call a service that sends email to donor
        if (req.userName === 'guest' && donorDetails.email != "") {
            commonService.sendEmail(donorDetails.email, donorDetails.name || 'Guest', amount, projectId, '')
        }
        else if (req.userName !== 'guest') {
            let orgDetails = await commonService.getOrgDetails(req.userName);
            if (orgDetails) {
                let donorName = orgDetails.firstName;
                if (orgDetails.subRole === 'Institution') {
                    donorName = orgDetails.orgName;
                }
                commonService.sendEmail(orgDetails.email, donorName, amount, projectId, orgDetails.address)
            }
        } else {
            logger.debug("No email is sent since no email is provided by guest user")
        }
    }
    catch (e) {
        generateError(e, next);
    }
});


module.exports = router;