const commonModel = require('../model/commonModel');

const commonService = {};

console.log('<<<<<<<<<<<<<< common service >>>>>>>>>>>>>>>>>');

// upload Balance sheet:
commonService.uploadBalanceSheet = (file) => {
    return commonModel.uploadBalanceSheet(file).then(data => {
        if (data) return { success: true, message: 'balance Sheet uploaded successfully' }
        else return { success: false, message: 'Error in uploading the balance sheet' }
    })
}

module.exports = commonService;