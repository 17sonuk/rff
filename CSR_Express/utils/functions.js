const e = require("cors");
const axios = require('axios');
const { stringify } = require("querystring");

const functions = {}

functions.fieldErrorMessage = (field) => {
    return {
        success: false,
        message: `${field} field is missing or Invalid in the request`
    }
}

// functions.FIELD_ERROR_MESSAGE = " field is missing or Invalid in the request"

functions.generateError = (error, next, statusCode = '', customErrMsg = '') => {
    let status, message;
    
    // console.log(error, error.message, Object.keys(error));
    console.log('error message',error.status);
    if (error.responses) {
        message = error.responses[0].response.message;
        status = error.responses[0].response.status === 500 ? 400 : error.responses[0].response.status;
    } else {
        message = (Object.keys(error).includes('message') || error.message) ? error.message : 'Some error occurred';
        
        
        status = error.status || 400;
    }

    if (customErrMsg && statusCode) {
        message = customErrMsg;
        status = statusCode;
    }

    error.message = message;
    error.status = status;

    next(error);
}

functions.getMessage = (bool, message) => {
    return {
        success: bool,
        message: message
    }
}

functions.splitOrgName = orgFullName => orgFullName.split('.')[0];

functions.paypalAuth0AccessToken = async () => {
    try {
        const { data: { access_token } } = await axios({
            url: 'https://api.sandbox.paypal.com/v1/oauth2/token',
            method: 'post',
            headers: {
                Accept: 'application/json',
                'Accept-Language': 'en_US',
                'content-type': 'application/x-www-form-urlencoded',
            },
            auth: {
                username: client_id,
                password: client_secret,
            },
            params: {
                grant_type: 'client_credentials',
            },
        });
        console.log('access_token:::::: ', access_token);
        return access_token;
    } catch (e) {
        console.error(e);
        return false;
    }
}

functions.getPaymentStatus = async (accessToken, orderId) => {
    const response = await axios({
        url: `https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}`,
        method: 'get',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });
    console.log('response::::::::::');
    console.log(response)
}
module.exports = functions;

