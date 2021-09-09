const { v4: uuid } = require('uuid');

const { CHAINCODE_NAME, CHANNEL_NAME, ORG2_NAME } = process.env;

const logger = require('../../loggers/logger');
const projectService = require('../../service/projectService');
const commonService = require('../../service/commonService');
const { generateError, getMessage } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');

const paymentService = {};

logger.debug('<<<<<<<<<<<<<< payment service >>>>>>>>>>>>>>>>>')

paymentService.saveTx = async (event, next) => {
    console.log('inside payment service...')
    let payload = JSON.parse(event.metadata.payload)
    console.log(typeof payload)
    console.log(payload)

    if (event.metadata.requestType === 'FundRequest') {
        console.log('inside fund request...')
        //extract fields from event metadata.
        const amount = payload.amount.toString();
        const paymentId = event.id;
        const paymentStatus = "COMPLETED";
        const comments = payload.comments;

        let args = JSON.stringify([amount, paymentId, paymentStatus, comments, Date.now().toString(), uuid().toString()]);
        logger.debug('args  : ' + args);

        try {
            await invoke.main(event.metadata.userName, ORG2_NAME, "RequestTokens", CHAINCODE_NAME, CHANNEL_NAME, args); //to discuss **
            //return getMessage(true, 'Successfully credited funds');

            const projectId = payload.projectId
            //const phaseNumber = payload.phaseNumber.toString();
            const donorDetails = payload.donorDetails;
            args = [amount, projectId, comments, Date.now().toString(), uuid().toString()]
            args = JSON.stringify(args);
            logger.debug('args  : ' + args);

            await invoke.main(event.metadata.userName, ORG2_NAME, "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
            logger.debug('Blockchain transfer success')

            projectService.addContributor(projectId, event.metadata.userName)
                .then((data) => {
                    logger.debug('Mongo add contributors success')
                    // return res.json(getMessage(true, "Transferred succesfully"))
                })
                .catch(err => {
                    generateError(err, next, 500, 'Failed to add contributor in mongo');
                });

            // send mail
            let orgDetails = await commonService.getOrgDetails( event.metadata.userName);
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

            return commonService.saveDonor(donorDetails)
                .then((data) => {
                    logger.debug('saved donor details')
                    logger.debug(data)
                    return getMessage(true, "Transferred succesfully")
                })
                .catch(err => {
                    generateError(err, next, 500, 'Failed to save donor details');
                })
        }
        catch (e) {
            generateError(e, next);
        }
    }
    else if (event.metadata.requestType === 'GuestTransfer') {
        console.log('inside GuestTransfer...')
        const amount = payload.amount.toString();
        const projectId = payload.projectId;
        // const phaseNumber = payload.phaseNumber.toString();
        const donorDetails = payload.donorDetails;
        const notes = donorDetails.email + " " + "PaymentId - " + event.id + " " + payload.notes;

        logger.debug(notes)
        const args = JSON.stringify([amount, projectId, notes, Date.now().toString(), event.id]);
        logger.debug('args  : ' + args);

        try {
            await invoke.main('guest', ORG2_NAME, "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
            logger.debug('Blockchain transfer success')

            let response = {}
            projectService.addContributor(projectId, 'guest')
                .then((data) => {
                    logger.debug('Mongo add contributors success')
                    response = getMessage(true, "Transferred succesfully")
                })
                .catch(err => {
                    generateError(err, next, 500, 'Failed to add contributor in mongo');
                });
            
            // send mail
            if (donorDetails.email) {
                commonService.sendEmailToDonor(donorDetails.email, 'Guest', amount,projectId,'')
                        .then((data) => {
                            logger.debug('email sent to donor')
                            logger.debug(data)
                        })
                        .catch(err => {
                            generateError(err, next, 500, 'Failed to send email to donor');
                        })
             }

            //save donor details
            if (donorDetails.email) {
                return commonService.saveDonor(donorDetails)
                    .then((data) => {
                        logger.debug('saved donor details')
                        logger.debug(data)
                        return response
                    })
                    .catch(err => {
                        generateError(err, next, 500, 'Failed to save donor details');
                    })
            }
            
            return response
        }
        catch (e) {
            generateError(e, next);
        }
    }
    else {
        let err = new Error("invalid request type received")
        err.status = 400
        throw err
    }
}

module.exports = paymentService;
