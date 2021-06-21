const { orgModel, communityModel } = require('./models');

const commonModel = {}

console.log('<<<<<<<<<<<<<< common model >>>>>>>>>>>>>>>>>');

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

    return communityModel.find(communityArr, 'name').then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

module.exports = commonModel;