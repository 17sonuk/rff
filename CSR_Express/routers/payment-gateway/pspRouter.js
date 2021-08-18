const express = require('express');
const router = express.Router();

const { COINBASE_API_KEY, COINBASE_WEBHOOK_SECRET } = process.env;

const logger = require('../../loggers/logger');

const paymentService = require('./paymentService');

const { Client, resources, Webhook } = require('coinbase-commerce-node');
Client.init(COINBASE_API_KEY);
const { Charge } = resources;

const { fieldErrorMessage, generateError, getMessage } = require('../../utils/functions');

// create coinbase charge
router.post('/coinbase/charge', async (req, res, next) => {

    //types: GuestTransfer | FundRequest
    if (!req.body.requestType) {
        return res.json(fieldErrorMessage('\'request type\''));
    }
    if (!req.body.payload) {
        return res.json(fieldErrorMessage('\'payload\''));
    }
    if (!req.body.payload.amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (req.body.requestType === 'FundRequest') {
        if (!req.body.userName)
            return res.json(fieldErrorMessage('\'userName\''));
        if (!req.body.payload.projectId)
            return res.json(fieldErrorMessage('\'projectId\''));
        // if (req.body.payload.phaseNumber === undefined || typeof req.body.payload.phaseNumber !== "number")
        //     return res.json(fieldErrorMessage('\'phaseNumber\''));
        if (!req.body.payload.donorDetails)
            return res.json(fieldErrorMessage('\'donorDetails\''));
        if (!req.body.payload.donorDetails.email)
            return res.json(fieldErrorMessage('\'email\''));
        if (!req.body.payload.donorDetails.name)
            return res.json(fieldErrorMessage('\'name\''));
    }

    const chargeData = {
        name: req.body.requestType,
        description: 'testing coinbase gateway',
        local_price: {
            amount: req.body.payload.amount,
            currency: 'USD'
        },
        pricing_type: 'fixed_price',
        metadata: {
            userName: req.body.userName,
            requestType: req.body.requestType,
            payload: req.body.payload
        }
    }

    const charge = await Charge.create(chargeData)
    res.send(charge)
})


router.use('/coinbase/chargeStatus', async (req, res, next) => {

    const body = req.body;
    logger.debug('COINBASE HOOK BODY.......')
    console.log(body)
    const signature = req.headers['x-cc-webhook-signature'];

    logger.debug('signature................ ' + signature);
    logger.debug('header................ ' + req.headers);

    try {
        // if (body.event.type === 'charge:created') {
        //     console.log('charge created');
        //     //const response = await paymentService.saveTx(body.event.data, next);
        //     return res.send(response)
        // }

        const isVerified = Webhook.verifySigHeader(JSON.stringify(body), signature, COINBASE_WEBHOOK_SECRET);
        console.log(isVerified);
        if (isVerified) {

            if (body.event.type === 'charge:created') {
                console.log('charge created');
                const response = await paymentService.saveTx(body.event.data, next);
                return res.send(response)
            }
            return res.send(`coinbase payment with id ${body.event.id} is in state ${body.event.type}`)
        }
        return res.send(`signature of coinbase payment with id ${body.event.id} couldn't be verified `)
    }
    catch (error) {
        logger.debug(error);
        return generateError(error, next);
    }
})

module.exports = router;