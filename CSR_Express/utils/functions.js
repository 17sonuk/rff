const e = require("cors");

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
    // console.log(error);
    if (error.responses) {
        message = error.responses[0].response.message;
        status = error.responses[0].response.status === 500 ? 400 : error.responses[0].response.status;
    } else {
        // console.log(error.message, Object.keys(error));
        message = (Object.keys(error).includes('message') || error.message) ? error.message : 'Some error occurred';
        status = error.status;
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

module.exports = functions;