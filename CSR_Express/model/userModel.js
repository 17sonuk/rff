const bcrypt = require("bcrypt");

const logger = require('../loggers/logger');

const { notificationModel, orgModel, txDescriptionModel } = require('./models')

const userModel = {}

logger.debug('<<<<<<<<<<<<<< user model >>>>>>>>>>>>>>>>>')

// onboarding of user
userModel.registerUser = (obj) => {
    let criteria = [{ userName: obj.userName }, { pan: obj.pan }]
    if (obj.regId) {
        criteria.push({ regId: obj.regId });
    }
    return orgModel.find({ $or: criteria }).then(user => {
        if (user.length > 0) {
            let message = 'duplicate fields - ';
            if (user[0].pan == obj.pan) {
                message += 'pan number, ';
            }
            if (user[0].userName == obj.userName) {
                message += 'userName, ';
            }
            if (obj.regId && user[0].regId == obj.regId) {
                message += 'regId, ';
            }
            message = message.slice(0, -2);
            return { success: false, message };
        }
        else {
            obj.password = bcrypt.hashSync(obj.password, 10);
            return orgModel.create(obj).then(data => {
                if (data) {
                    return { success: true, message: 'user successfully registered...' };
                } else {
                    return null
                }
            })
        }
    })
}

// get user details
userModel.getUserDetails = (userName) => {
    return orgModel.findOne({ userName: userName }, { _id: 0, date: 0 }).then(data => {
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
            for (let i = 0; i < data.length; i++) {
                data[i]['password'] = undefined;
            }
            return data
        } else {
            return null
        }
    })
}

// approve users
userModel.approveUser = (userName, pan) => {
    return orgModel.updateOne({ userName: userName, pan: pan }, { $set: { "status": 'approved' } }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }
    })
}

// approve users
userModel.rejectUser = (userName, pan) => {
    return orgModel.deleteOne({ userName: userName, pan: pan }).then(data => {
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