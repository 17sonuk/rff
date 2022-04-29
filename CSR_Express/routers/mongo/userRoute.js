const express = require('express');
const router = express.Router();

require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const { generateError, getMessage } = require('../../utils/functions');
const userService = require('../../service/userService');
const mongoProjectService = require('../../service/projectService');
const registerUser = require('../../fabric-sdk/registerUser');
const deleteUser = require('../../fabric-sdk/deleteUser');
const { orgModel } = require('../../model/models')
const nodemailer = require('nodemailer');
const messages = require('../../loggers/messages');


const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: SMTP_EMAIL,
        pass: APP_PASSWORD,
    },
});

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

//Onboarding of user
router.post('/onboard', (req, res, next) => {
    return userService.registerUser(req.body)
        .then((data) => {
            if (data.message === "active") {
                return res.json(getMessage(true, messages.success.REGISTER_USER));
            }else if(data.message === "emailUsername"){
                userService.sendUserNameEmail(req.body.email,data.userName);
                res.json({ success: false, message: "Please use the userName emailed to your email account"})
            }
            return registerUser(req.body.userName, req.body['role'].toLowerCase())
                .then((response) => {
                    userService.sendEmailForDonorRegistration(req);
                    //send registration success message
                    return res.json(getMessage(true, messages.success.REGISTER_USER));
                })
                .catch((err) => {
                    //call delete service to delete user in mongo
                    userService.deleteMongoUser(req.body.userName);
                    return generateError(err, next, 500, messages.error.FAILED_REGISTER_USER);
                });
        })
        .catch(err => {
            return generateError(err, next);
        })
})

// get username validity
router.post('/checkUserNameValidity', (req, res, next) => {
    userService.checkUserNameValidty(req.body.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get user details
router.get('/profile', (req, res, next) => {
    let userName = req.userName;
    if (req.orgName === 'creditsauthority') {
        userName = req.query.userName;
    }
    userService.getUserDetails(userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

// get user redeem account
router.get('/redeemAccount', (req, res, next) => {
    userService.getUserRedeemAccount(req.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/unapproved-users', (req, res, next) => {
    userService.getUnapprovedUserDetails()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/getApprovedInstitutions', async (req, res, next) => {
    try {
        let result = await userService.getApprovedInstitutions();
        res.json(result)
    }
    catch (error) {
        next(error);
    }
})

// mark institutional donor as seen
router.put('/markInstitutionalDonorAsSeen', async (req, res, next) => {
    try {
        let result = await userService.markInstitutionalDonorAsSeen(req.query.id);
        res.json(result);
    }
    catch (error) {
        next(error);
    }
})

//get notification - true for unseen and false for seen
router.get('/notification', (req, res, next) => {
    let name = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    userService.getNotifications(name, req.query.seen)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/notification', (req, res, next) => {
    let name = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    userService.updateNotification(name, req.body.txId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/update', (req, res, next) => {
    userService.updateUserProfile(req.userName, req.body).then((data) => {
        res.json(data)
    }).catch(err => next(err))
})


router.put('/updateEmail', (req, res, next) => {
    console.log("inside router", req.userName, req.email, req.body);
    orgModel.find({ email: req.body.newEmail }, { _id: 0, userName: 1 }).then(data => {
        if (data.length > 0) {
            res.json({ success: false, message: "Email already exists" });
        } else {
            userService.updateEmail(req.userName, req.email, req.body, function (err, data) {
                console.log("data from service", data);
                if (err)
                    res.send(err);
                res.json(data);
            })
        }
    }).catch(err => next(err))
})

router.post('/sendUserNameEmail', (req, res, next) => {
    orgModel.find({ email: req.body.email }, { _id: 0, userName: 1 }).then(data => {
        if (data.length > 0) {
            userService.sendUserNameEmail(req.body.email,data[0].userName);
            res.json({ success: true, message: "User Name exists. Please check the email", username:data[0].userName})
        } else {
            res.json({ success: false, message: "No data exists" });
        }
    }).catch(err => next(err))
})

//delete user
router.post('/deActivateUser', (req, res, next) => {
    let uname = req.userName
    let email = req.email
    if (req.orgName === 'creditsauthority') {
        uname = req.body.userName
        email = req.body.email
    }
    return userService.deActivateUser(uname, email).then((data) => {
        res.json(data)
    }).catch(err => next(err))

})

//delete user
router.delete('/delete-user', (req, res, next) => {
    let uname = req.userName
    // let oname = req.orgNames
    let email = req.email
    if (req.orgName === 'creditsauthority') {
        uname = req.body.userName
        // oname = req.body.orgName
        email = req.body.email
    }
    // return deleteUser(uname, oname).then((data) => {
    // console.log("data from delete user from blockchain: ", data)
    return userService.deleteUser(uname, email).then((data) => {
        res.json(data)
    }).catch(err => next(err))

    // }).catch(err => next(err))

})



module.exports = router;