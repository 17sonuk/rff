const { v4: uuid } = require('uuid');

const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

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

        const args = JSON.stringify([amount, paymentId, paymentStatus, comments, Date.now().toString(), uuid().toString()]);
        logger.debug('args  : ' + args);

        try {
            await invoke.main(event.metadata.userName, 'corporate', "RequestTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
            return getMessage(true, 'Successfully credited funds');
        } catch (e) {
            generateError(e, next);
        }
    }
    else if (event.metadata.requestType === 'GuestTransfer') {
        console.log('inside GuestTransfer...')
        const amount = payload.amount.toString();
        const projectId = payload.projectId;
        const phaseNumber = payload.phaseNumber.toString();
        const donorDetails = payload.donorDetails;
        const notes = donorDetails.email + " " + "PaymentId - " + event.id + " " + payload.notes;

        logger.debug(notes)
        const args = JSON.stringify([amount, projectId, phaseNumber, notes, Date.now().toString(), event.id]);
        logger.debug('args  : ' + args);

        try {
            await invoke.main('guest', 'corporate', "TransferTokens", CHAINCODE_NAME, CHANNEL_NAME, args);
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

            //save donor details
            if (donorDetails.email) {
                commonService.saveDonor(donorDetails)
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
