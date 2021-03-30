let getErrorMessage = function (field) {
    var response = {
        success: false,
        message: field + ' field is missing or Invalid in the request'
    };
    return response;
}

module.exports = getErrorMessage