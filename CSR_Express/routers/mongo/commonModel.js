const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
const { orgModel, communityModel, donorModel } = require('./models');

const commonModel = {}

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

commonModel.saveCommunities = async (communityArr) => {
    let finalList = [];
    for (let i = 0; i < communityArr.length; i++) {
        let res = await communityModel.findOne({ $and: [{ name: communityArr[i].name }, { place: communityArr[i].place }] });
        if (!res) {
            finalList.push(communityArr[i]);
        }
    }
    return communityModel.insertMany(finalList).then(data => {
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

commonModel.getCommunity = (communityId) => {
    return communityModel.findOne({ _id: communityId })
        .then(data => {
            return data;
        })
        .catch(err => {
            let error = new Error(messages.error.MONGO_ERROR);
            error.status = 500;
            throw error;
        })
}

commonModel.getCommunityByNameAndPlace = (name, place) => {
    return communityModel.findOne({ $and: [{ name: name }, { place: place }] })
        .then(data => {
            return data;
        })
        .catch(err => {
            let error = new Error(messages.error.MONGO_ERROR);
            error.status = 500;
            throw error;
        })
}

commonModel.deleteCommunities = async (communityIds) => {
    return communityModel.deleteMany({ _id: { $in: communityIds } })
        .then(data => {
            return data;
        })
        .catch(err => {
            return null
        })
}

commonModel.saveDonor = async (donor) => {
    try {
        let existingDonor = await donorModel.findOne({ email: donor.email })
        if (existingDonor) {
            return messages.error.DONOR_EXIST
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