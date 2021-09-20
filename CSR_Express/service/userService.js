const logger = require('../loggers/logger');
const bcrypt = require("bcrypt");
const CryptoJS = require('crypto-js');
const userModel = require('../model/userModel');
const mongoError = require('../model/mongoError')
const individualRegEmailTemplate = require('../email-templates/individualRegEmail');
const institutionRegEmailTemplate = require('../email-templates/institutionRegEmail');
const messages = require('../loggers/messages');
const userService = {};
const { v4: uuid } = require('uuid');
require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, PLATFORM_NAME } = process.env;
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: SMTP_EMAIL,
        pass: APP_PASSWORD,
    },
});

//Onboarding of user
// mandatory fields
// institute donor: contact first name, contact last name, orgname, username, email
// individual donor: first name, last name, username, email
userService.registerUser = (obj) => {

    let err = new Error()
    err.status = 400
    const validateEmail = /^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*(?:\.[a-zA-Z]+)+$/;
    if (obj.email === '' || !validateEmail.test(obj.email)) {
        err.message = messages.error.INVALID_EMAIL;
        throw err;
    }

    // do not allow user to set this value
    if (obj.seen !== undefined) {
        err.message = messages.error.INVALID_SEEN;
        throw err;
    }

    if (obj.firstName === '' || (!(typeof obj.firstName == 'string'))) {
        err.message = messages.error.INVALID_FIRST_NAME;
        throw err;
    }

    if (obj.firstName.length > 50) {
        err.message = messages.error.FIRST_NAME_LENGTH;
        throw err;
    }

    if (obj.lastName === '' || (!(typeof obj.lastName == 'string'))) {
        err.message = messages.error.INVALID_LAST_NAME;
        throw err;
    }

    if (obj.lastName.length > 50) {
        err.message = messages.error.LAST_NAME_LENGTH;
        throw err;
    }

    if (!(typeof obj.orgName == 'string') && (obj.subRole == 'Institution' || obj.role == 'Ngo')) {
        err.message = messages.error.INVALID_ORG_NAME;
        throw err;
    }

    if (obj.userName === '' || (!(typeof obj.userName == 'string'))) {
        err.message = messages.error.INVALID_USER_NAME;
        throw err;
    }

    if (obj.userName.length > 50) {
        err.message = messages.error.USER_NAME_LENGTH;
        throw err;
    }

    if (obj.role === 'Corporate') {

        if (!obj.subRole) {
            err.message = messages.error.INVALID_DONOR_TYPE
            throw err
        } else if (this.subRole === 'Institution' && !this.orgName) {
            err.message = messages.error.INVALID_COMPANY_NAME;
            throw err
        }
    }

    //ngo validations
    let errMsg = undefined;

    if (obj['role'] === 'Ngo') {
        let { addressLine1, addressLine2, city, state, country, zipCode } = obj.address
        if (!addressLine1 || !addressLine2 || !city || !state || !country || !zipCode) {
            err.message = messages.error.INVALID_ADDRESS
            throw err
        }

        if (obj.paymentDetails.paymentType === 'Bank' && (!obj.paymentDetails.bankDetails.bankAddress.city || !obj.paymentDetails.bankDetails.bankAddress.country)) {
            err.message = messages.error.INVALID_BANK_ADDRESS
            throw err
        }

        if (!obj['paymentDetails']) {
            errMsg = messages.error.MISSING_PAYMENT_DETAILS
        }
        else if (obj['paymentDetails']['paymentType'] === 'Paypal' && !obj['paymentDetails']['paypalEmailId']) {
            errMsg = messages.error.MISSING_PAYPAL_ID
        }
        else if (obj['paymentDetails']['paymentType'] === 'Cryptocurrency' && !obj['paymentDetails']['cryptoAddress']) {
            errMsg = messages.error.MISSING_CRYPTO_ID
        }
        else if (obj['paymentDetails']['paymentType'] === 'Bank' && !obj['paymentDetails']['bankDetails']) {
            errMsg = messages.error.MISSING_BANK_DETAILS
        }

        if (errMsg !== undefined) {
            err.message = errMsg
            throw err
        }
    }

    obj['status'] = 'approved';
    return userModel.registerUser(obj).then(data => {
        if (data) {
            if (data.success === false) {
                err.message = data.message
                err.status = 500
                throw err
            }
            console.log('user added!!!!')
            return data;
        }
        console.log('user add failed!!!')
        err.message = messages.error.BAD_CONNECTION
        err.status = 500
        throw err
    })
}

//get username validity
userService.checkUserNameValidty = (userName) => {
    return userModel.getUserDetails(userName, 'userName').then(data => {
        if (data) {
            let err = new Error(messages.error.USER_EXISTS)
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
            return data;
        } else {
            let err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err
        }
    })
}

// get user redeem account
userService.getUserRedeemAccount = (userName) => {
    return userModel.getUserDetails(userName, 'userName').then(data => {
        if (data) {
            if (data['paymentDetails']) {
                return data['paymentDetails']
            } else {
                let err = new Error(messages.error.MISSING_PAYMENT_DETAILS)
                err.status = 404
                throw err
            }
        } else {
            let err = new Error(messages.error.UNAUTHORIZED_USER)
            err.status = 401
            throw err
        }
    })
}

//get user unapproved users
// userService.getUnapprovedUserDetails = () => {
//     return userModel.getUnapprovedUserDetails().then(data => {
//         if (data) {
//             return data;
//         } else {
//             let err = new Error(messages.error.BAD_CONNECTION)
//             err.status = 500
//             throw err
//         }
//     })
// }

// get approved institutional donors
userService.getApprovedInstitutions = async () => {
    try {
        return await userModel.getApprovedInstitutions();
    } catch (error) {
        throw error;
    }
}

//approve user
// userService.approveUser = (userName) => {
//     return userModel.approveUser(userName).then(approveResp => {
//         if (approveResp && approveResp['nModified'] == 1) {
//             return userModel.getUserDetails(userName, 'userName').then(userData => {
//                 if (userData) {
//                     return userData['role'].toLowerCase();
//                 } else {
//                     let err = new Error(`${userName} does not exist in mongo`)
//                     err.status = 500
//                     throw err
//                 }
//             })
//         } else if (approveResp && approveResp['n'] == 1) {
//             let err = new Error(`${userName} is already approved`)
//             err.status = 500
//             throw err
//         } else {
//             let err = new Error(`${userName} does not exist in mongo`)
//             err.status = 500
//             throw err
//         }
//     })
// }

//reset user status bcoz register user failed in blockchain, but succeeded in mongo.
// userService.resetUserStatus = (userName) => {
//     return userModel.resetUserStatus(userName)
//         .then(data => {
//             if (data) {
//                 return true;
//             } else {
//                 let err = new Error(messages.error.RESET_USER)
//                 err.status = 500
//                 throw err
//             }
//         })
//         .catch(err => { throw err });
// }

//reject user
// userService.rejectUser = (userName) => {
//     return userModel.rejectUser(userName).then(data => {
//         if (data) {
//             return data;
//         } else {
//             let err = new Error(messages.error.BAD_CONNECTION)
//             err.status = 500
//             throw err
//         }
//     })
// }

//login user
userService.login = (email) => {
    return userModel.getUserDetails(email).then(data => {
        if (data) {
            if (data['status'] == 'approved') {
                let finalResponse = {
                    'success': true,
                    'message': 'Login successful',
                    'userName': data.userName,
                    'role': data.role,
                    'name': '',
                    'email': data.email
                };
                if ((data['role'] === 'Corporate' && data['subRole'] === 'Institution') || data['role'] === 'Ngo') {
                    finalResponse['name'] = data.orgName;
                } else {
                    finalResponse['name'] = data.firstName + " " + data.lastName;
                }
                return finalResponse;
            } else {
                return { success: false, message: messages.error.PENDING_APPROVAL }
            }
        } else {
            return { success: false, message: messages.error.INVALID_USER }
        }
    });
}

// amount of corporate to convert in credits
// userService.getAmountFromBalanceSheet = (userName) => {
//     return userModel.getAmountFromBalanceSheet(userName).then(data => {
//         if (data) {
//             let d = new Date();
//             let y = d.getFullYear();
//             let m = d.getMonth();
//             let year_p1 = '';
//             let year_p2 = '';
//             let year_p3 = '';
//             if (m < 3) {
//                 year_p1 = String(y - 2) + '-' + String(y - 1);
//                 year_p2 = String(y - 3) + '-' + String(y - 2);
//                 year_p3 = String(y - 4) + '-' + String(y - 3);
//             } else {
//                 year_p1 = String(y - 1) + '-' + String(y);
//                 year_p2 = String(y - 2) + '-' + String(y - 1);
//                 year_p3 = String(y - 3) + '-' + String(y - 2);
//             }
//             let total = 0;
//             let j = 0;
//             for (let i = 0; i < data.file.length; i++) {
//                 if (data.file[i].year == year_p1 || data.file[i].year == year_p2 || data.file[i].year == year_p3) {
//                     total += Number(data.file[i].amount); j++;
//                 }
//             }
//             if (j == 3) {
//                 return { success: true, amount: Math.ceil(total / 3) * 0.02 };
//             } else if (j < 3) {
//                 return { success: false, message: 'balance sheets are not available.' };
//             }
//         } else {
//             return { success: false, message: 'not getting files from db' };
//         }
//     })
// }

//Create notification
userService.createNotification = (project) => {
    return userModel.createNotification(project).then(notificationData => {
        if (notificationData) {
            return { success: true, message: messages.success.NOTIFICATION_CREATED };
        } else {
            let err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err
        }
    })
}

//Create tx description
userService.createTxDescription = (project) => {
    return userModel.createTxDescription(project).then(txDescriptionData => {
        if (txDescriptionData) {
            return { success: true, message: messages.success.TRANSACTION_DESCRIPTION };
        } else {
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err
        }
    })
}

// update notification
userService.updateNotification = (username, txId) => {
    return userModel.updateNotification(username, txId).then(status => {
        if (status['nModified'] > 0) {
            return { success: true, message: messages.success.NOTIFICATION_UPDATED };
        } else {
            let err = new Error(messages.error.BAD_CONNECTION)
            err.status = 500
            throw err
        }
    })
}

function isAddressValid(data) {
    let { addressLine1, addressLine2, city, state, country, zipCode } = data
    if (addressLine1 && addressLine2 && city && state && country && zipCode) {
        return true
    } else {
        return false
    }
}

function isPhoneValid(data) {
    let { countryCode, phoneNumber } = data
    if (countryCode && phoneNumber) {
        return true
    } else {
        return false
    }
}

userService.updateUserProfile = async (userName, profileData) => {
    let user = await userModel.getUserDetails(userName, 'userName')

    if (!user) {
        let err = new Error(messages.error.INVALID_USER)
        err.status = 401
        throw err
    }

    if (profileData.role || profileData.subRole || profileData.email || profileData.userName || profileData.orgName || profileData.seen !== undefined) {
        let err = new Error(messages.error.INVALID_UPDATE_FIELDS)
        err.status = 401
        throw err
    }

    if (user.subRole == "Individual" && (profileData.website || profileData.paymentDetails)) {
        let err = new Error(messages.error.INVALID_INDIVIDUAL_DATA)
        err.status = 401
        throw err
    }

    if (user.subRole == "Institution" && profileData.paymentDetails) {
        let err = new Error(messages.error.INVALID_INSTITUTIONAL_DATA)
        err.status = 401
        throw err
    }

    if (user.role == "Ngo" && profileData.website) {
        let err = new Error(messages.error.INVALID_NGO_DATA)
        err.status = 401
        throw err
    }

    if (user.role == 'Ngo' && profileData.address) {
        if (!isAddressValid(profileData.address)) {
            let err = new Error(messages.error.INVALID_ADDRESS)
            err.status = 401
            throw err
        }
    }

    if (user.role == 'Ngo' && profileData.phone) {
        for (let phone of profileData.phone) {
            if (!isPhoneValid(phone)) {
                let err = new Error(messages.error.INVALID_PHONE_DETAILS)
                err.status = 401
                throw err
            }
        }
    }

    if (user.role == 'Ngo' && !profileData.paymentDetails) {
        let err = new Error(messages.error.MISSING_PAYMENT_MODE)
        err.status = 401
        throw err
    }

    if (user.role == 'Ngo') {
        if (!['Paypal', 'Cryptocurrency', 'Bank'].includes(profileData.paymentDetails.paymentType)) {
            let err = new Error(messages.error.INVALID_PAYMENT_MODE)
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Paypal' && !profileData.paymentDetails.paypalEmailId) {
            let err = new Error(messages.error.MISSING_PAYPAL_ID)
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Cryptocurrency' && !profileData.paymentDetails.Cryptocurrency) {
            let err = new Error(messages.error.MISSING_CRYPTO_ID)
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && !profileData.paymentDetails.bankDetails) {
            let err = new Error(messages.error.MISSING_BANK_DETAILS)
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && profileData.paymentDetails.bankDetails.bankAddress) {
            if (!isAddressValid(profileData.paymentDetails.bankDetails.bankAddress)) {
                let err = new Error(messages.error.INVALID_BANK_ADDRESS)
                err.status = 401
                throw err
            }
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && !profileData.paymentDetails.bankDetails.bankPhone) {
            let err = new Error(messages.error.INVALID_PHONE_DETAILS)
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && !([true, false].includes(profileData.paymentDetails.bankDetails.isUSBank) && profileData.paymentDetails.bankDetails.taxId && profileData.paymentDetails.bankDetails.beneficiaryName && profileData.paymentDetails.bankDetails.beneficiaryAddress && profileData.paymentDetails.bankDetails.bankName && profileData.paymentDetails.bankDetails.currencyType && profileData.paymentDetails.bankDetails.bankAccountNo)) {
            let err = new Error(messages.error.MISSING_BANK_DETAILS)
            err.status = 401
            throw err
        }
    }

    return userModel.updateUserProfile(userName, profileData).then(data => {
        if (data['nModified'] > 0) {
            return { success: true, message: messages.success.UPDATE_USER };
        } else {
            let err = new Error(messages.error.FAILED_UPDATE_USER)
            err.status = 500
            throw err
        }
    }).catch(error => {
        let err = new Error(messages.error.TRY_AGAIN)
        err.status = 500
        throw err
    })
}

userService.sendEmailForDonorRegistration = async (req) => {
    if ((req.body['role'] === 'Corporate')) {
        try {
            let htmlBody = ""
            let emailList = ""
            if (req.body['subRole'] === 'Individual') {
                htmlBody = await individualRegEmailTemplate.individualRegEmail(req.body.firstName)
                emailList = req.body.email
            }
            else if (req.body['subRole'] === 'Institution') {
                let orgName = req.body.orgName
                htmlBody = await institutionRegEmailTemplate.institutionRegEmail(req.body.firstName, orgName)
                emailList = req.body.email
            }
            transporter.verify().then((data) => {
                console.log(data);
                console.log('sending email to :' + emailList);
                transporter.sendMail({
                    from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
                    to: emailList, // list of receivers
                    subject: `Thank you for joining ${PLATFORM_NAME}`, // Subject line
                    html: htmlBody, // html body
                }).then(info => {
                    console.log({ info });
                }).catch(console.error);
            }).catch(console.error);

        } catch (emailError) {
            console.error(emailError)
        }
    }
}
userService.deleteUser = (userName) => {
    return userModel.rejectUser(userName).then(data => {
        if (data) return data;

        let err = new Error(messages.error.TRY_AGAIN)
        err.status = 500
        throw err
    })
}
module.exports = userService;