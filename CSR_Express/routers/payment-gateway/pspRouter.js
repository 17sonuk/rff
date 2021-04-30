const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const { fieldErrorMessage, generateError, getMessage } = require('../../utils/functions');

//razorpay
const Razorpay = require('razorpay');
const { nanoid } = require("nanoid");
let request = require('request');

const razorpay = new Razorpay({
    key_id: 'rzp_test_xWrg0UDvN0bmPb',
    key_secret: 'ESE8VcWS43a2Q8Ymfu1RdUvF'
});

//API for RazorPay payment. It creates an order
router.post('/razorpay', async (req, res) => {
    logger.debug('==================== razorpay ==================');

    let amount = req.body.amount;

    if (!amount) {
        res.json(fieldErrorMessage('\'amount\''));
        return;
    }

    amount = amount * 100;

    const payment_capture = 1;

    let options = {
        amount: amount.toString(),  // amount in the smallest currency unit i.e 5000 paise
        currency: "INR",
        receipt: nanoid(),
        payment_capture: payment_capture
    };

    // const response = await razorpay.orders.create(options, function(err, order) {  
    // 	console.log(order);
    // 	res.send(order);
    // });

    const response = await razorpay.orders.create(options)
    res.json(getMessage(true, {
        key: razorpay.key_id,
        id: response.id,
        currency: response.currency,
        amount: response.amount
    }));

    // res.json({
    //     key: razorpay.key_id,
    //     id: response.id,
    //     currency: response.currency,
    //     amount: response.amount
    // });
});

//API for fetching RazorPay payment details
router.get('/razorpay/payment', (req, res) => {
    logger.debug('==================== razorpay fetch payment details ==================');

    if (req.orgName !== "creditsauthority") {
        return res.json({ success: false, message: "Unauthorized" })
    }

    let paymentId = req.query.paymentId;

    if (!paymentId) {
        return res.json(fieldErrorMessage('\'paymentId\''));
    }

    // https://api.razorpay.com/v1/payments/pay_DG4ZdRK8ZnXC3k

    const httpUrl = 'https://' + razorpay.key_id + ":" + razorpay.key_secret + '@api.razorpay.com/v1/payments/' + paymentId;
    //console.log('http url: ' + httpUrl);
    request(httpUrl, function (error, response, body) {
        logger.debug(`Response: ${body}`);
        if (error) {
            generateError(e, 'Failed to fetch payments', 401, next);
        } else {
            res.json(getMessage(true, body));
            //res.send(JSON.parse(body));
        }
    });
});

module.exports = router;