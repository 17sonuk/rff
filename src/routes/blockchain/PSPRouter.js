var express = require('express');
var router = express.Router();
const getErrorMessage = require('../../utils/ErrorMsg');

//razorpay
const Razorpay = require('razorpay');
var { nanoid } = require("nanoid");
var request = require('request');

const razorpay = new Razorpay({
    key_id: 'rzp_test_xWrg0UDvN0bmPb',
    key_secret: 'ESE8VcWS43a2Q8Ymfu1RdUvF'
});

//API for RazorPay payment. It creates an order
router.post('/razorpay', async (req, res) => {
    logger.debug('==================== razorpay ==================');

    var amount = req.body.amount;

    if (!amount) {
        res.json(getErrorMessage('\'amount\''));
        return;
    }

    amount = amount * 100;

    const payment_capture = 1;

    var options = {
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
    res.json({
        key: razorpay.key_id,
        id: response.id,
        currency: response.currency,
        amount: response.amount
    })

});

//API for fetching RazorPay payment details
router.get('/razorpay/payment', (req, res) => {
    logger.debug('==================== razorpay fetch payment details ==================');

    if (req.orgname !== "CreditsAuthority") {
        var errorResponse = {
            "success": false,
            "message": "Unauthorized!"
        }
        res.send(errorResponse);
        return;
    }

    var paymentId = req.query.paymentId;

    if (!paymentId) {
        res.json(getErrorMessage('\'paymentId\''));
        return;
    }

    // https://api.razorpay.com/v1/payments/pay_DG4ZdRK8ZnXC3k

    const httpUrl = 'https://' + razorpay.key_id + ":" + razorpay.key_secret + '@api.razorpay.com/v1/payments/' + paymentId;
    //console.log('http url: ' + httpUrl);
    request(httpUrl, function (error, response, body) {
        console.log('Response:', body);
        res.send(JSON.parse(body));
    });

});

module.exports = router;