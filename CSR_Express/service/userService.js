const logger = require('../loggers/logger');
const bcrypt = require("bcrypt");
const CryptoJS = require('crypto-js');
const userModel = require('../model/userModel');
const mongoError = require('../model/mongoError')

const userService = {};

logger.debug('<<<<<<<<<<<<<< user service >>>>>>>>>>>>>>>>>')

//Onboarding of user
// mandatory fields
// institute donor: contact first name, contact last name, orgname, username, email
// individual donor: first name, last name, username, email
userService.registerUser = (obj) => {

    let err = new Error()
    err.status = 400

    if (obj.role === 'Corporate') {
        if (!obj.subRole) {
            err.message = 'Donor type is missing/invalid!'
            throw err
        } else if (this.subRole === 'Institution' && !this.orgName) {
            err.message = 'Company/Foundation/Fund Name is missing/invalid!'
            throw err
        }
    }

    //ngo validations
    let errMsg = undefined;

    if (obj['role'] === 'Ngo') {
        let { addressLine1, addressLine2, city, state, country, zipCode } = obj.address
        if (!addressLine1 || !addressLine2 || !city || !state || !country || !zipCode) {
            err.message = 'some address info is missing/invalid!'
            throw err
        }

        if (obj.paymentDetails.paymentType === 'Bank' && (!obj.paymentDetails.bankDetails.bankAddress.city || !obj.paymentDetails.bankDetails.bankAddress.country)) {
            err.message = 'some bank address info is missing/invalid!'
            throw err
        }

        if (!obj['paymentDetails']) {
            errMsg = 'Payment details missing!'
        }
        else if (obj['paymentDetails']['paymentType'] === 'Paypal' && !obj['paymentDetails']['paypalEmailId']) {
            errMsg = 'Paypal email id is missing!'
        }
        else if (obj['paymentDetails']['paymentType'] === 'Cryptocurrency' && !obj['paymentDetails']['cryptoAddress']) {
            errMsg = 'Crypto id is missing'
        }
        else if (obj['paymentDetails']['paymentType'] === 'Bank' && !obj['paymentDetails']['bankDetails']) {
            errMsg = 'Bank details are missing'
        }

        if (errMsg !== undefined) {
            err.message = errMsg
            throw err
        }
    }

    if ((obj['role'] === 'Corporate' && obj['subRole'] === 'Individual') || obj['role'] === 'Ngo') {
        obj['status'] = 'approved';
    } else {
        obj['status'] = 'created';
    }

    //obj['date'] = new Date().getTime();
    return userModel.registerUser(obj).then(data => {
        if (data) {
            console.log('use added!!!!')
            return data;
        }
        console.log('user add failed!!!')
        err.message = 'Bad Connection'
        err.status = 500
        throw err
    })
}

//get username validity
userService.checkUserNameValidty = (userName) => {
    return userModel.getUserDetails(userName, 'userName').then(data => {
        if (data) {
            let err = new Error("User already exists")
            err.status = 500
            throw err
        } else {
            return true;
        }
    })
}

//get user details
userService.getUserDetails = (userName) => {
    return userModel.getUserDetails(userName, 'userName').then(data => {
        if (data) {
            // data.pan = CryptoJS.AES.decrypt(data.pan, "Secret123PaN").toString(CryptoJS.enc.Utf8)
            // data.contact[0].number = CryptoJS.AES.decrypt((data.contact[0].number), "Secret123CoN").toString(CryptoJS.enc.Utf8)
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

// get user redeem account
userService.getUserRedeemAccount = (userName, paymentType) => {
    return userModel.getUserDetails(userName, 'userName').then(data => {
        if (data) {
            if (paymentType === 'Paypal') {
                return data['paymentDetails']['paypalEmailId']
            } else if (paymentType === 'Cryptocurrency') {
                return data['paymentDetails']['cryptoAddress']
            } else if (paymentType === 'Bank') {
                return data['paymentDetails']['bankDetails']
            } else {
                let err = new Error("Invalid payment type")
                err.status = 500
                throw err
            }
        } else {
            let err = new Error("Unauthorized user")
            err.status = 401
            throw err
        }
    })
}

//get user unapproved users
userService.getUnapprovedUserDetails = () => {
    return userModel.getUnapprovedUserDetails().then(data => {
        if (data) {
            // for (let i = 0; i < data.length; i++) {
            //     data[i].pan = CryptoJS.AES.decrypt(data[i].pan, "Secret123PaN").toString(CryptoJS.enc.Utf8)
            //     data[i].contact[0].number = CryptoJS.AES.decrypt((data[i].contact[0].number), "Secret123CoN").toString(CryptoJS.enc.Utf8)
            // }

            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//approve user
userService.approveUser = (userName) => {
    return userModel.approveUser(userName).then(approveResp => {
        if (approveResp && approveResp['nModified'] == 1) {
            return userModel.getUserDetails(userName, 'userName').then(userData => {
                if (userData) {
                    return userData['role'].toLowerCase();
                } else {
                    let err = new Error(`${userName} does not exist in mongo`)
                    err.status = 500
                    throw err
                }
            })
        } else if (approveResp && approveResp['n'] == 1) {
            let err = new Error(`${userName} is already approved`)
            err.status = 500
            throw err
        } else {
            let err = new Error(`${userName} does not exist in mongo`)
            err.status = 500
            throw err
        }
    })
}

//reset user status bcoz register user failed in blockchain, but succeeded in mongo.
userService.resetUserStatus = (userName) => {
    return userModel.resetUserStatus(userName)
        .then(data => {
            if (data) {
                return true;
            } else {
                let err = new Error("Couldn't reset user status")
                err.status = 500
                throw err
            }
        })
        .catch(err => { throw err });
}

//reject user
userService.rejectUser = (userName) => {
    return userModel.rejectUser(userName).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//login user
userService.login = (email) => {
    return userModel.getUserDetails(email).then(data => {
        if (data) {
            //check password
            // if (password == null || password == undefined || password.length == 0) {
            //     return { success: false, message: 'wrong credentials!' };
            // }

            // const result = bcrypt.compareSync(password, data['password']);

            // if (result == false) {
            //     return { success: false, message: 'wrong credentials!' };
            // } else
            if (data['status'] == 'approved') {
                let finalResponse = {
                    'success': true,
                    'message': 'Login successful',
                    'userName': data.userName,
                    'role': data.role,
                    'name': ''
                };
                if ((data['role'] === 'Corporate' && data['subRole'] === 'Institution') || data['role'] === 'Ngo') {
                    finalResponse['name'] = data.orgName;
                } else {
                    finalResponse['name'] = data.firstName + " " + data.lastName;
                }
                return finalResponse;
            } else {
                return { success: false, message: 'Pending for approval. Please try again later.' }
            }
        } else {
            return { success: false, message: 'User does not exist' }
        }
    });
}

// amount of corporate to convert in credits
userService.getAmountFromBalanceSheet = (userName) => {
    return userModel.getAmountFromBalanceSheet(userName).then(data => {
        if (data) {
            let d = new Date();
            let y = d.getFullYear();
            let m = d.getMonth();
            let year_p1 = '';
            let year_p2 = '';
            let year_p3 = '';
            if (m < 3) {
                year_p1 = String(y - 2) + '-' + String(y - 1);
                year_p2 = String(y - 3) + '-' + String(y - 2);
                year_p3 = String(y - 4) + '-' + String(y - 3);
            } else {
                year_p1 = String(y - 1) + '-' + String(y);
                year_p2 = String(y - 2) + '-' + String(y - 1);
                year_p3 = String(y - 3) + '-' + String(y - 2);
            }
            let total = 0;
            let j = 0;
            for (let i = 0; i < data.file.length; i++) {
                if (data.file[i].year == year_p1 || data.file[i].year == year_p2 || data.file[i].year == year_p3) {
                    total += Number(data.file[i].amount); j++;
                }
            }
            if (j == 3) {
                return { success: true, amount: Math.ceil(total / 3) * 0.02 };
            } else if (j < 3) {
                return { success: false, message: 'balance sheets are not avilable.' };
            }

        } else {
            return { success: false, message: 'not getting files from db' };
        }
    })
}

//Create notification
userService.createNotification = (project) => {
    return userModel.createNotification(project).then(notificationData => {
        if (notificationData) {
            return { success: true, message: 'notification created in db' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//Create tx description
userService.createTxDescription = (project) => {
    return userModel.createTxDescription(project).then(txDescriptionData => {
        if (txDescriptionData) {
            return { success: true, message: 'tx description created in db' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get notifications
userService.getNotifications = (username, seen) => {
    return userModel.getNotifications(username, seen).then(async notification => {
        if (notification) {
            for (let i = 0; i < notification.length; i++) {
                await userModel.getNotificationDescription(notification[i].txId).then(data => {
                    if (data) {
                        notification[i]['description'] = data.description
                    }
                })
            }
            return notification
        }
        else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

// update notification
userService.updateNotification = (username, txId) => {
    return userModel.updateNotification(username, txId).then(status => {
        if (status['nModified'] > 0) {
            return { success: true, message: 'notification updated' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

module.exports = userService;