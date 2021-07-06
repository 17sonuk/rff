const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const { Client, resources, Webhook } = require('coinbase-commerce-node');
Client.init('b3e8de8c-a744-4fd2-80bc-6801b3f3b5e6'); //API KEY
const { Charge } = resources;

const { fieldErrorMessage, generateError, getMessage } = require('../../utils/functions');

// create coinbase charge
router.post('/coinbase/charge', async (req, res) => {

    //types: ProjectTransfer, CreditRequest, RedeemApprove
    if (!req.body.requestType) {
        return res.json(fieldErrorMessage('\'request type\''));
    }
    if (!req.body.amount) {
        return res.json(fieldErrorMessage('\'amount\''));
    }
    if (!req.body.payload) {
        return res.json(fieldErrorMessage('\'payload\''));
    }

    const chargeData = {
        name: req.body.requestType,
        description: 'testing coinbase gateway',
        local_price: {
            amount: req.body.amount,
            currency: 'USD'
        },
        pricing_type: 'fixed_price',
        metadata: {
            requestType: req.body.requestType,
            payload: JSON.stringify(req.body.payload)
        }
    }

    const charge = await Charge.create(chargeData)
    res.send(charge)
})

router.use('/coinbase/chargeStatus', (req, res) => {

    const body = req.body;
    console.log('COINBASE HOOK BODY.......')
    console.log(body)
    const signature = req.headers['x-cc-webhook-signature'];
    console.log('signature................ ' + signature);
    console.log('header................ ' + req.headers);
    const webhookSecret = '48b8d57b-b845-4106-88f8-c579b0c32a8c';

    try {
        const event = Webhook.verifySigHeader(JSON.stringify(body), signature, webhookSecret);
        console.log(event);
        if (event.type === 'charge:pending') {
            console.log('charge pending');
        } else if (event.type === 'charge:confirmed') {
            console.log('charge confirmed');
        } else if (event.type === 'charge:failed') {
            console.log('charge failed');
        }
        res.send('wbehook working');
    } catch (error) {
        console.log(error);
    }

})

module.exports = router;