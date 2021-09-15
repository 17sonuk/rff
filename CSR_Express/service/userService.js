const logger = require('../loggers/logger');
const bcrypt = require("bcrypt");
const CryptoJS = require('crypto-js');
const userModel = require('../model/userModel');
const mongoError = require('../model/mongoError')

const individualRegEmailTemplate = require('../email-templates/individualRegEmail');
const institutionRegEmailTemplate = require('../email-templates/institutionRegEmail');

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

logger.debug('<<<<<<<<<<<<<< user service >>>>>>>>>>>>>>>>>')

//Onboarding of user
// mandatory fields
// institute donor: contact first name, contact last name, orgname, username, email
// individual donor: first name, last name, username, email
userService.registerUser = (obj) => {

    let err = new Error()
    err.status = 400
    const validateEmail = /^[a-zA-Z0-9]+([._-]+[a-zA-Z0-9]+)*@[a-zA-Z0-9]+(-[a-zA-Z0-9]+)*(?:\.[a-zA-Z]+)+$/;
    if (obj.email === '' || !validateEmail.test(obj.email)) {
        err.message = 'Email is missing/invalid format!';
        throw err;
    }

    // do not allow user to set this value
    if (obj.seen !== undefined) {
        err.message = 'Seen is an invalid field';
        throw err;
    }

    if (obj.firstName === '' || (!(typeof obj.firstName == 'string'))) {
        err.message = 'First name is missing/invalid!';
        throw err;
    }

    if (obj.firstName.length > 50) {
        err.message = 'First name cannot exceed 50 characters';
        throw err;
    }

    if (obj.lastName === '' || (!(typeof obj.lastName == 'string'))) {
        err.message = 'Last name is missing/invalid!';
        throw err;
    }

    if (obj.lastName.length > 50) {
        err.message = 'Last name cannot exceed 50 characters';
        throw err;
    }

    if (!(typeof obj.orgName == 'string') && (obj.subRole == 'Institution' || obj.role == 'Ngo')) {
        err.message = 'Organisation name is invalid!';
        throw err;
    }

    if (obj.userName === '' || (!(typeof obj.userName == 'string'))) {
        err.message = 'User name is missing/invalid!';
        throw err;
    }

    if (obj.userName.length > 50) {
        err.message = 'User name cannot exceed 50 characters';
        throw err;
    }

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

    obj['status'] = 'approved';

    //obj['date'] = new Date().getTime();
    return userModel.registerUser(obj).then(data => {
        if (data) {
            if (data.success === false) {
                err.message = data.message
                err.status = 500
                throw err
            }
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
            return data;
        } else {
            let err = new Error("Bad Connection")
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
                let err = new Error("Payment details missing")
                err.status = 404
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

// get approved institutional donors
userService.getApprovedInstitutions = async () => {
    try {
        return await userModel.getApprovedInstitutions();
    } catch (error) {
        throw error;
    }
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
        let err = new Error("User does not exist")
        err.status = 401
        throw err
    }

    if (profileData.role || profileData.subRole || profileData.email || profileData.userName || profileData.orgName || profileData.seen !== undefined) {
        let err = new Error("These fields cannot be updated: Email, User Name, Organisation Name, Status, Seen")
        err.status = 401
        throw err
    }

    if (user.subRole == "Individual" && (profileData.website || profileData.paymentDetails)) {
        let err = new Error("Individual Donor can not have Website, Payment Details")
        err.status = 401
        throw err
    }

    if (user.subRole == "Institution" && profileData.paymentDetails) {
        let err = new Error("Institution Donor can not have Payment Details")
        err.status = 401
        throw err
    }

    if (user.role == "Ngo" && profileData.website) {
        let err = new Error("Beneficiary can not have Website")
        err.status = 401
        throw err
    }

    if (user.role == 'Ngo' && profileData.address) {
        if (!isAddressValid(profileData.address)) {
            let err = new Error("Some address fields are empty")
            err.status = 401
            throw err
        }
    }

    if (user.role == 'Ngo' && profileData.phone) {
        for (let phone of profileData.phone) {
            if (!isPhoneValid(phone)) {
                let err = new Error("Some phone fields are empty")
                err.status = 401
                throw err
            }
        }
    }

    if (user.role == 'Ngo' && !profileData.paymentDetails) {
        let err = new Error("Please select a payment mode")
        err.status = 401
        throw err
    }

    if (user.role == 'Ngo') {
        if (!['Paypal', 'Cryptocurrency', 'Bank'].includes(profileData.paymentDetails.paymentType)) {
            let err = new Error("Invalid payment mode")
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Paypal' && !profileData.paymentDetails.paypalEmailId) {
            let err = new Error("PayPal email is empty")
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Cryptocurrency' && !profileData.paymentDetails.Cryptocurrency) {
            let err = new Error("Cryto address is empty")
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && !profileData.paymentDetails.bankDetails) {
            let err = new Error("Bank details is empty")
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && profileData.paymentDetails.bankDetails.bankAddress) {
            if (!isAddressValid(profileData.paymentDetails.bankDetails.bankAddress)) {
                let err = new Error("Some bank address details are empty")
                err.status = 401
                throw err
            }
        }

        // use if phone number is mandatory
        // if (profileData.paymentDetails.paymentType === 'Bank' && profileData.paymentDetails.bankDetails.bankPhone) {
        //     if (!isPhoneValid(profileData.paymentDetails.bankDetails.bankPhone)) {
        //     let err = new Error("Some phone details are empty")
        //     err.status = 401
        //     throw err
        //     }
        // }

        if (profileData.paymentDetails.paymentType === 'Bank' && !profileData.paymentDetails.bankDetails.bankPhone) {
            let err = new Error("Some phone details are empty")
            err.status = 401
            throw err
        }

        if (profileData.paymentDetails.paymentType === 'Bank' && !([true, false].includes(profileData.paymentDetails.bankDetails.isUSBank) && profileData.paymentDetails.bankDetails.taxId && profileData.paymentDetails.bankDetails.beneficiaryName && profileData.paymentDetails.bankDetails.beneficiaryAddress && profileData.paymentDetails.bankDetails.bankName && profileData.paymentDetails.bankDetails.currencyType && profileData.paymentDetails.bankDetails.bankAccountNo)) {
            let err = new Error("Some bank details are empty")
            err.status = 401
            throw err
        }
    }

    return userModel.updateUserProfile(userName, profileData).then(data => {
        if (data['nModified'] > 0) {
            return { success: true, message: 'User Profile Updated Successfully' };
        } else {
            let err = new Error("Failed to update Profile Please Try again")
            err.status = 500
            throw err
        }
    }).catch(error => {
        let err = new Error("Something went wrong please try again")
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
            // if (registerError.status === 400) {
            //     return generateError(registerError, next, 400, `${req.body.userName} is already registered in blockchain`);
            // }
            // try {
            //     await userService.resetUserStatus(req.body.userName)

            // } catch (resetStatusError) {
            //     return generateError(resetStatusError, next);
            // }
        }
    }
}
userService.deleteUser = (userName) => {
    return userModel.rejectUser(userName).then(data => {
        if (data) return data;

        let err = new Error("Something went wrong")
        err.status = 500
        throw err
    })
}
module.exports = userService;