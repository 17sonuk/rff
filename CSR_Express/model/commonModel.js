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

commonModel.saveCommunities = async (communityArr) => {
    let finalList = [];
    for (let i = 0; i < communityArr.length; i++) {
        let res = await communityModel.findOne({ $and: [{ name: communityArr[i].name }, { place: communityArr[i].place }] });
        console.log('community res:', res);
        if (!res) {
            finalList.push(communityArr[i]);
        }
    }
    console.log('finalList: ', finalList)
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

commonModel.getCommunity = async (communityId) => {
    return communityModel.findOne({ _id: communityId }).then(data => {
        console.log("data: ", data)
        if (data) return data

        let err = new Error("Community does not exist")
        err.status = 500
        throw err

    }).catch(error => {
        console.log(error)
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}
// commonModel.getCommunity = async (name, place) => {
//     let res = await communityModel.findOne({ $and: [{ name: name }, { place: place }] });
//     if (res) {
//         if (res.paymentDetails) {
//             return res.paymentDetails
//         } else {
//             return null
//         }
//     } else {
//         let err = new Error("Community does not exist")
//         err.status = 500
//         throw err
//     }
// }

commonModel.deleteCommunities = async (communityIds) => {
    // let myquery = { _id: { $in: communityIds } };
    return communityModel.deleteMany({ _id: { $in: communityIds } })
        .then(data => {
            console.log('deleted response:', data)
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

commonModel.updateCommunity = (communityId, name, place, paymentDetails) => {
    console.log("communityId, paymentDetails: ", communityId, paymentDetails)
    return communityModel.updateOne({ _id: communityId }, { $set: { name: name, place: place, paymentDetails: paymentDetails } }).then(data => {
        console.log("Data: ", data)
        return data
    }).catch((er) => {
        console.log("error: ", er)
        return nil
    })
}


commonModel.getListedCommunity = async (communityIds, orgName) => {
    console.log("communityIds : ", communityIds, orgName)
    if (orgName === 'ngo') {
        var res = await communityModel.find({ _id: { $in: communityIds } })
    } else {
        res = await communityModel.find({ _id: { $in: communityIds } }, { paymentDetails: 0 })
    }
    return res
}

commonModel.getOrgDetails = (userName) => {
    return orgModel.findOne({ userName },{_id:0,firstName:1,orgName:1,subRole:1,email:1}).then(data => {
        return data ? data : null
    })
}

module.exports = commonModel;