const logger = require('../loggers/logger');
const { orgModel, communityModel, donorModel } = require('./models');

const commonModel = {}

logger.debug('<<<<<<<<<<<<<< common model >>>>>>>>>>>>>>>>>');

// upload Balance Sheet for corporate
commonModel.uploadBalanceSheet = (userName, file) => {
    return orgModel.updateOne({ userName: userName, role: 'Corporate' }, { $push: { file: file } }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

commonModel.saveCommunities = (communityArr) => {
    return communityModel.insertMany(communityArr).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

commonModel.getCommunities = () => {
    return communityModel.find().then(data => {
        return data ? data : null
    })
}

commonModel.saveDonor = async (donor) => {
    try {
        let existingDonor = await donorModel.findOne({ email: donor.email })
        if (existingDonor) {
            return "Donor already exists!"
        }
        return donorModel.create(donor).then(data => {
            return data ? data : null
        })
    }
    catch (err) {
        logger.error(err)
        return nil
    }
}

commonModel.getDonors = () => {
    return donorModel.find().then(data => {
        return data ? data : null
    })
}

module.exports = commonModel;