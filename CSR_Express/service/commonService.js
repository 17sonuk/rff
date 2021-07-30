const logger = require('../loggers/logger');
const commonModel = require('../model/commonModel');

const commonService = {};

logger.debug('<<<<<<<<<<<<<< common service >>>>>>>>>>>>>>>>>');

// upload Balance sheet:
commonService.uploadBalanceSheet = (file) => {
    return commonModel.uploadBalanceSheet(file).then(data => {
        if (data) return { success: true, message: 'balance Sheet uploaded successfully' }
        return { success: false, message: 'Error in uploading the balance sheet' }
    })
}

commonService.saveCommunities = (communityArr) => {
    return commonModel.saveCommunities(communityArr).then(data => {
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getCommunities = () => {
    return commonModel.getCommunities().then(data => {
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getCommunity = (name, place) => {
    return commonModel.getCommunity(name, place).then(data => {
        if (data) {
            if (data.paymentDetails.paymentType === 'Paypal') {
                return data.paymentDetails.paypalEmailId
            }
            return data.paymentDetails.bankDetails
        }
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.deleteCommunities = (communityIds) => {
    return commonModel.deleteCommunities(communityIds).then(data => {
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.saveDonor = (donor) => {
    return commonModel.saveDonor(donor).then(data => {
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getDonors = () => {
    return commonModel.getDonors().then(data => {
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

module.exports = commonService;