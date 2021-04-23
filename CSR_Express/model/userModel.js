const logger = require('../loggers/logger');

const collection = require("./connection").orgCollection();
const notificationCollection = require("./connection").notificationCollection();
const txDescriptionCollection = require("./connection").txDescriptionCollection();
// const Mongoose = require("mongoose")

const userModel = {}

logger.debug('<<<<<<<<<<<<<< user model >>>>>>>>>>>>>>>>>')

// onboarding of user
userModel.registerUser = (obj) => {
    // console.log('model-registerUser', obj);
    // return connection.orgCollection().then(collection => {
    let criteria = [{ userName: obj.userName }, { pan: obj.pan }]
    if (obj.regId) {
        criteria.push({ regId: obj.regId });
    }
    return collection.find({ $or: criteria }).then(user => {
        if (user.length > 0) {
            // Mongoose.connection.close()
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
            return collection.create(obj).then(data => {
                // Mongoose.connection.close()
                if (data) {
                    return { success: true, message: 'user successfully registered...' };
                } else {
                    return null
                }
            })
        }
    })
    // })
}

// get user details
userModel.getUserDetails = (userName) => {
    // console.log('model-getUserDetails', name);
    // return connection.orgCollection().then(collection => {
    return collection.findOne({ userName: userName }, { _id: 0, date: 0 }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

// get unapproved users 
userModel.getUnapprovedUserDetails = () => {
    // console.log('model-getUnapprovedUserDetails');
    // return connection.orgCollection().then(collection => {
    return collection.find({ status: 'created' }, { _id: 0 }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            for (let i = 0; i < data.length; i++) {
                data[i]['password'] = undefined;
            }
            return data
        } else {
            return null
        }
    })
    // })
}

// approve users
userModel.approveUser = (userName, pan) => {
    // console.log('model-approveUser');
    // return connection.orgCollection().then(collection => {
    return collection.updateOne({ userName: userName, pan: pan }, { $set: { "status": 'approved' } }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

//get current balancesheet amount
userModel.getAmountFromBalanceSheet = (userName) => {
    // console.log('model-getAmountFromBalanceSheet');
    // return connection.orgCollection().then(collection => {
    return collection.findOne({ userName: userName, role: 'Corporate' }, { _id: 0, file: 1 }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

//create a new notification
userModel.createNotification = (notificationData) => {
    // return connection.notificationCollection().then(collection => {
    return notificationCollection.create(notificationData).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

//create a new tx description
userModel.createTxDescription = (txDescriptionData) => {
    // return connection.txDescriptionCollection().then(collection => {
    return txDescriptionCollection.create(txDescriptionData).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

//get notification
userModel.getNotifications = (username, seen) => {
    // return connection.notificationCollection().then(collection => {
    return notificationCollection.find({ username: username, seen: seen }, { _id: 0, txId: 1, seen: 1 }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

//get description of notification
userModel.getNotificationDescription = (txId) => {
    // return connection.txDescriptionCollection().then(collection => {
    return txDescriptionCollection.findOne({ txId: txId }, { _id: 0, txId: 1, description: 1 }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

// update seen notification
userModel.updateNotification = (username, txId) => {
    // return connection.notificationCollection().then(collection => {
    return notificationCollection.updateOne({ username, txId }, { seen: true }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

module.exports = userModel;