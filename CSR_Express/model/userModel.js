// const bcrypt = require("bcrypt");
const CryptoJS = require('crypto-js');

const mongoError = require('./mongoError')
const logger = require('../loggers/logger');

const { notificationModel, orgModel, txDescriptionModel } = require('./models')

const userModel = {}

logger.debug('<<<<<<<<<<<<<< user model >>>>>>>>>>>>>>>>>')

// create
userModel.create = async (obj) => {
    try {
        return await orgModel.create(obj)
    }
    catch (e) {
        throw e
    }
}

// find
userModel.find = async (filter, projection = {}) => {
    try {
        return await orgModel.find(filter, projection)
    }
    catch (e) {
        throw e
    }
}

// findOne
userModel.findOne = async (filter, projection = {}) => {
    try {
        return await orgModel.findOne(filter, projection)
    }
    catch (e) {
        throw e
    }
}

// updateOne
userModel.updateOne = async (filter, set) => {
    try {
        return await orgModel.updateOne(filter, set)
    }
    catch (e) {
        throw e
    }
}

// deleteOne
userModel.deleteOne = async (filter) => {
    try {
        return await orgModel.deleteOne(filter)
    }
    catch (e) {
        throw e
    }
}


// onboarding of user
userModel.registerUser = async (obj) => {
    let criteria = [{ userName: obj.userName }, { email: obj.email }]
    // if (obj.regId) {
    //     criteria.push({ regId: obj.regId });
    // }
    try {
        let user = await orgModel.find({ $or: criteria })
        if (user.length > 0) {
            let message = 'duplicate fields - ';
            if (user[0].email == obj.email) {
                message += 'email, ';
            }
            if (user[0].userName == obj.userName) {
                message += 'userName, ';
            }
            // if (obj.regId && user[0].regId == obj.regId) {
            //     message += 'regId, ';
            // }
            message = message.slice(0, -2);
            return { success: false, message };
        } else {
            //obj.phone.phoneNumber = (CryptoJS.AES.encrypt((obj.phone.phoneNumber).toString(), "Secret123CoN"))
            // obj.pan = CryptoJS.AES.encrypt(obj.pan, "Secret123PaN");
            // obj.password = bcrypt.hashSync(obj.password, 10);
            try {
                console.log('mongo user')
                let result = await orgModel.create(obj)
                if (result) {
                    return { success: true, message: 'user successfully registered...' };
                } else {
                    return null
                }
            } catch (createError) {
                // console.log(createError.errors)
                // console.log(createError._message)
                return mongoError(createError)
            }
        }
    } catch (findError) {
        return mongoError(findError)
    }
}

// get user details (we are using this api for login /users and to get profile data /profile)
// for profile we are sending username and for login we are sending email.
userModel.getUserDetails = (value, type = 'email') => {
    let criteria = {}
    criteria[type] = value;
    return orgModel.findOne(criteria, { _id: 0, date: 0 }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

// get unapproved users 
userModel.getUnapprovedUserDetails = () => {
    return orgModel.find({ status: 'created' }, { _id: 0 }).then(data => {
        if (data) {
            // for (let i = 0; i < data.length; i++) {
            //     data[i]['password'] = undefined;
            // }
            return data
        } else {
            return null
        }
    })
}

// approve users
userModel.approveUser = (userName) => {
    return orgModel.updateOne({ userName: userName }, { $set: { "status": 'approved' } }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

//reset user status bcoz register user failed in blockchain, but succeeded in mongo.
userModel.resetUserStatus = (userName) => {
    return orgModel.updateOne({ userName: userName }, { $set: { "status": 'created' } })
        .then(data => {
            if (data['nModified'] == 1) {
                return true;
            } else {
                return null;
            }
        })
        .catch(err => {
            logger.error(err);
            err = new Error("Connection issue!")
            err.status = 500
            throw err;
        })
}

// reject users
userModel.rejectUser = (userName) => {
    return orgModel.deleteOne({ userName: userName }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

//get current balancesheet amount
userModel.getAmountFromBalanceSheet = (userName) => {
    return orgModel.findOne({ userName: userName, role: 'Corporate' }, { _id: 0, file: 1 }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

//create a new notification
userModel.createNotification = (notificationData) => {
    return notificationModel.create(notificationData).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

//create a new tx description
userModel.createTxDescription = (txDescriptionData) => {
    return txDescriptionModel.create(txDescriptionData).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

//get notification
userModel.getNotifications = (username, seen) => {
    return notificationModel.find({ username: username, seen: seen }, { _id: 0, txId: 1, seen: 1 })
        .sort({ createdAt: 'desc' })
        .then(data => {
            if (data) {
                return data
            } else {
                return null
            }
        })
}

//get description of notification
userModel.getNotificationDescription = (txId) => {
    return txDescriptionModel.findOne({ txId: txId }, { _id: 0, txId: 1, description: 1 })
        .sort({ createdAt: 'desc' })
        .then(data => {
            if (data) {
                return data
            } else {
                return null
            }
        })
}

// update seen notification
userModel.updateNotification = (username, txId) => {
    return notificationModel.updateOne({ username, txId }, { seen: true }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

module.exports = userModel;