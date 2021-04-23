const functions = {}

functions.fieldErrorMessage = (field) => {
    return {
        success: false,
        message: `${field} field is missing or Invalid in the request`
    }
}

// functions.FIELD_ERROR_MESSAGE = " field is missing or Invalid in the request"

functions.generateError = (error, label, code, next) => {
    error.label = label;
    error.status = code;
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