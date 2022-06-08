const { v4: uuid } = require('uuid');

const { CHAINCODE_NAME, CHANNEL_NAME, ORG2_NAME } = process.env;

const logger = require('../../loggers/logger');
const projectService = require('../../service/projectService');
const commonService = require('../../service/commonService');
const { generateError, getMessage } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');

const paymentService = {};

paymentService.saveTx = async (event, next) => {
    let payload = JSON.parse(event.metadata.payload)

    if (event.metadata.requestType === 'GuestTransfer' || event.metadata.requestType === 'Transfer') {
        const amount = payload.amount.toString();
        const projectId = payload.projectId;
        const donorDetails = payload.donorDetails;
        const paymentMode = event.metadata.paymentMode
        let notes = payload.notes
        if (event.metadata.userName === 'guest') {
            notes = donorDetails.email + "\n" + "PaymentId - " + event.id + "\n" + payload.notes
        }

        const args = JSON.stringify([amount, projectId, notes, Date.now().toString(), uuid().toString(), event.id, paymentMode]);


        try {
            await invoke.main(event.metadata.userName, 'corporate', "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);

            let response = {}
            projectService.addContributor(projectId, event.metadata.userName)
                .then((data) => {
                    response = getMessage(true, "Transferred succesfully")
                })
                .catch(err => {
                    generateError(err, next, 500, 'Failed to add contributor in mongo');
                });

            // send mail
            if (event.metadata.userName == 'guest' && donorDetails.email) {
                commonService.sendEmailToDonor(donorDetails.email, donorDetails.name || 'Guest', amount, projectId, '')
                    .then((data) => {
                        logger.debug('email sent to donor')
                    })
                    .catch(err => {
                        generateError(err, next, 500, 'Failed to send email to donor');
                    })

            } else if (event.metadata.userName != 'guest' && donorDetails.email) {

                let orgDetails = await commonService.getOrgDetails(event.metadata.userName);
                if (orgDetails && orgDetails.email) {
                    let donorName = orgDetails.firstName;
                    if (orgDetails.subRole === 'Institution') {
                        donorName = orgDetails.orgName;
                    }
                    commonService.sendEmailToDonor(orgDetails.email, donorName, amount, projectId, orgDetails.address)
                        .then((data) => {
                            logger.debug('email send to donor')
                        })
                        .catch(err => {
                            generateError(err, next, 500, 'Failed to send email to donor');
                        })
                }
            }

            //save donor details
            if (donorDetails.email) {
                return commonService.saveDonor(donorDetails)
                    .then((data) => {
                        logger.debug('saved donor details')
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
