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

commonService.getCommunity = async (communityId) => {
    return commonModel.getCommunity(communityId).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("No community")
            err.status = 500
            throw err
        }
    }).catch(er=>{
        throw er
    })
}
// commonService.getCommunity = (name, place) => {
//     return commonModel.getCommunity(name, place).then(data => {
//         if (data) {
//             return data;
//         } else {
//             let err = new Error("No payment details stored for this community")
//             err.status = 500
//             throw err
//         }
//     })
// }

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

commonService.updateCommunity= (communityId,name,place,paymentDetails)=>{
    return commonModel.updateCommunity(communityId,name,place,paymentDetails).then(data=>{
        console.log("data in service :",data)
        if (data) return data;

        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })

}

commonService.getListedCommunity= (communityIds, orgName)=>{
    return commonModel.getListedCommunity(communityIds, orgName).then(data=>{
        console.log("data in service :",data)
        if (data) return data;

        let err = new Error("No data found")
        err.status = 500
        throw err
        
    }).catch(er=>{
        console.log(er)
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })

}

module.exports = commonService;