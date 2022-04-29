const CryptoJS = require('crypto-js');
const mongoError = require('./mongoError')
const logger = require('../loggers/logger');
const { notificationModel, orgModel, txDescriptionModel, donorModel } = require('./models');
const messages = require('../loggers/messages');
const userModel = {}

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

// // onboarding of user
// userModel.registerUser = async (obj) => {
//     let criteria = [{ userName: obj.userName }, { email: obj.email }]
//     try {
//         let user = await orgModel.find({ $or: criteria })
//         if (user.length > 0) {
//             let message = 'Already used. Please try with other ';
//             if (user[0].email == obj.email) {
//                 message += 'email, ';
//             }
//             if (user[0].userName == obj.userName) {
//                 message += 'userName, ';
//             }
//             message = message.slice(0, -2);
//             return { success: false, message };
//         } else {
//             try {
//                 console.log('mongo user')
//                 let result = await orgModel.create(obj)
//                 if (result) {
//                     return { success: true, message: messages.success.REGISTER_USER };
//                 } else {
//                     return null
//                 }
//             } catch (createError) {
//                 return mongoError(createError)
//             }
//         }
//     } catch (findError) {
//         return mongoError(findError)
//     }
// }


// onboarding of user
userModel.registerUser = async (obj) => {
    let criteria = [{ userName: obj.userName }, { email: obj.email }]
    try {
        let user = await orgModel.find({ $or: criteria })
        if (user.length > 0) {
            let message = 'Already used. Please try with other ';
            if (user[0].active === false && user[0].email === obj.email) {
                obj["active"] = true
                if (user[0].userName === obj.userName) {
                    await orgModel.updateOne({ userName: user[0].userName }, { $set: obj })
                    return { success: true, message: "active" }
                } else {
                    // userService.sendUserNameEmail(req.body.email,data[0].userName);
                    return { success: true, message: "emailUsername",userName:user[0].userName };
                    // Please use the userName emailed to your email account
                    // // let result = await orgModel.create(obj)
                    // let data = await orgModel.find({ userName: obj.userName })
                    // if (data.length > 0) {
                    //     return { success: false, message: message };
                    // }
                    // let result = await orgModel.updateOne({ email: obj.email }, { $set: obj })
                    // if (result) {
                    //     return { success: true, message: messages.success.REGISTER_USER };
                    // } else {
                    //     return null
                    // }
                    // // return { success: false, message: message }
                }
            }
            if (user[0].email == obj.email) {
                message += 'email, ';
            }
            if (user[0].userName == obj.userName) {
                message += 'userName, ';
            }
            message = message.slice(0, -2);
            return { success: false, message };
        } else {
            try {
                console.log('mongo user')
                let result = await orgModel.create(obj)
                if (result) {
                    return { success: true, message: messages.success.REGISTER_USER };
                } else {
                    return null
                }
            } catch (createError) {
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
            return data
        } else {
            return null
        }
    })
}

// get approved institutional donors 
userModel.getApprovedInstitutions = async () => {
    try {
        return await orgModel.find({ status: 'approved', role: 'Corporate', subRole: 'Institution', seen: false }, { _id: 1, orgName: 1, firstName: 1, lastName: 1, email: 1, website: 1 }).sort({ _id: -1 });
    }
    catch (error) {
        let err = new Error(messages.error.BAD_CONNECTION)
        err.status = 500
        throw err
    }
}

// mark institutional donor as seen
userModel.markInstitutionalDonorAsSeen = async (id) => {
    try {
        let data = await orgModel.updateOne({ _id: id }, { $set: { seen: true } });
        return data;
    }
    catch (error) {
        let err = new Error(messages.error.BAD_CONNECTION);
        err.status = 500;
        throw err;
    }
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
            err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err;
        })
}

// delete users
userModel.deleteUser = (userName, mail) => {
    return orgModel.updateOne({ userName: userName }, { $set: { active: false } }).then(data => {
        return donorModel.deleteOne({ email: mail }).then(data => {
            if (data) {
                return data
            } else {
                return null
            }
        })

    })
}

// deactivate users
userModel.deActivateUser = (userName) => {
    return orgModel.updateOne({ userName: userName }, { $set: { active: false } }).then(data => {
        if (data) {
            return data
        } else {
            return null
        }

    })
}

// delete users
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
// userModel.getAmountFromBalanceSheet = (userName) => {
//     return orgModel.findOne({ userName: userName, role: 'Corporate' }, { _id: 0, file: 1 }).then(data => {
//         if (data) {
//             return data
//         } else {
//             return null
//         }
//     })
// }

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

userModel.getNgoOrgName = (userName) => {
    console.log('username:' + userName)
    return orgModel.findOne({ userName: userName }, { _id: 0, orgName: 1 }).then(data => {
        console.log('orgname:' + data)
        if (data) {
            return data.orgName
        } else {
            return x == y
        }
    })
}

userModel.updateUserProfile = (userN, profileData) => {
    console.log(profileData)
    return orgModel.update({ userName: userN }, { $set: profileData }).then((data) => {
        return data;
    }).catch((error) => {
        let err = new Error(messages.error.BAD_CONNECTION)
        err.status = 500
        throw err
    })
}

userModel.updateEmail = (userN, oldEmail, updateData) => {
    console.log(updateData)
    return donorModel.updateOne({ email: oldEmail }, { $set: { email: updateData.newEmail } }).then((data) => {
        // return data;
        return orgModel.updateOne({ userName: userN }, { $set: { email: updateData.newEmail } }).then((data) => {
            return data;
        }).catch((error) => {
            let err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err
        })
    }).catch((error) => {
        let err = new Error(messages.error.BAD_CONNECTION)
        err.status = 500
        throw err
    })

}


module.exports = userModel;