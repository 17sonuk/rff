const express = require('express');
const router = express.Router();

require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;

const logger = require('../../loggers/logger');
const { generateError, getMessage } = require('../../utils/functions');

const userService = require('../../service/userService');

const mongoProjectService = require('../../service/projectService');

const registerUser = require('../../fabric-sdk/registerUser');

const { orgModel } = require('../../model/models')

logger.debug('<<<<<<<<<<<<<< user router >>>>>>>>>>>>>>>>>')

const nodemailer = require('nodemailer');

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
    logger.debug(`router-onboarding: ${JSON.stringify(req.body, null, 2)}`);

    return userService.registerUser(req.body)
        .then((data) => {
            console.log('user route data::::: ')
            console.log(data)

            return registerUser(req.body.userName, req.body['role'].toLowerCase())
                .then((response) => {
                    logger.debug('blockchain register successful')
                    userService.sendEmailForDonorRegistration(req);
                    //send registration success message
                    return res.json(getMessage(true, "User onboarded successfully!"));
                })
                .catch((err) => {
                    //call delete service to delete user in mongo
                    userSerive.deleteUser(req.body.userName)
                    return generateError(registerError, next, 500, 'Couldn\'t register user in blockchain! Please report');
                });
            //res.json(data)
        })
        .catch(err => {
            //  console.log("mongodb error",err)
            logger.error('could not register user!')
            return generateError(err, next);
            // next(err)
        })
})

// get username validity
router.post('/checkUserNameValidity', (req, res, next) => {
    logger.debug("router-checkUserNameValidity");
    userService.checkUserNameValidty(req.body.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get user details
router.get('/profile', (req, res, next) => {
    logger.debug("router-profile");
    // if(req.email !== req.query.email){
    //     let err= new Error('Unauthorized user!')
    //     err.status=401
    //     return next(err)
    // }

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
    logger.debug("router-redeemAccount");
    userService.getUserRedeemAccount(req.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/unapproved-users', (req, res, next) => {
    logger.debug(`router-getUnapprovedUsers`);

    userService.getUnapprovedUserDetails()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get unapproved user details
router.get('/getApprovedInstitutions', async (req, res, next) => {
    logger.debug(`router-getApprovedInstitutions`);

    try {
        let result = await userService.getApprovedInstitutions();
        res.json(result)
    }
    catch (error) {
        next(error);
    }
})

//approve user
router.post('/approve-user', async (req, res, next) => {
    logger.debug(`router-approveUser: ${JSON.stringify(req.body, null, 2)}`);

    try {
        let orgName = await userService.approveUser(req.body.userName);
        try {
            await registerUser(req.body.userName, orgName);
            transporter.verify()
                .then((data) => {
                    console.log(data);
                    let receiverEmail = ''
                    orgModel.findOne({ userName: req.body.userName }, { _id: 0, email: 1 })
                        .then((email) => {
                            receiverEmail = email
                            console.log('sending email to :' + receiverEmail.email);
                            transporter.sendMail({
                                from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
                                to: receiverEmail.email, // list of receivers // 'c1@gmail.com, c2@outlook.com'
                                subject: "Testing csr mail", // Subject line
                                text: "Congrats " + req.body.userName + ", You have successfully onboarded to the CSR platform!", // plain text body
                                //html: "<b>You have successfully onboarded to the CSR platform</b>", // html body
                            }).then(info => {
                                console.log({ info });
                            }).catch(console.error);
                        })
                })
                .catch(console.error);
            return res.json(getMessage(true, "User approved successfully!"));
        } catch (registerError) {
            if (registerError.status === 400) {
                return generateError(registerError, next, 400, `${req.body.userName} is already registered in blockchain`);
            }
            try {
                await userService.resetUserStatus(req.body.userName)
                return generateError(registerError, next, 500, 'Couldn\'t register user in blockchain!');
            } catch (resetStatusError) {
                return generateError(resetStatusError, next);
            }
        }
    } catch (approveErr) {
        return generateError(approveErr, next);
    }
})


//project completed

router.post('/project-completed', async (req, res, next) => {
    logger.debug('router-projectCompleted');

    try {
        let projectData = await mongoProjectService.getProjectById(req.body.projectId)
        try {
            let emailList = orgModel.find({ userName: { $in: contributorsList } }, { _id: 0, email: 1 })
            for (let i = 0; i < emailList.length; i++) {
                if (i != 0) {
                    emailList += ', '
                }
            }
            transporter.verify().then((data) => {
                console.log(data);
                console.log('sending email to :' + emailList);
                transporter.sendMail({
                    from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
                    bcc: emailList, // list of receivers
                    subject: `${projectData.projectName} is now completed`, // Subject line
                    text: ` Hi ${donorList.name}, ${projectData.projectName} is now completed, thanks for your contribution `, // plain text body
                    //html: "<b>You have successfully onboarded to the CSR platform</b>", // html body
                }).then(info => {
                    console.log({ info });
                }).catch(console.error);
            }).catch(console.error);
            return res.json(getMessage(true, "Project has been completed and donors have been notified!"));
        } catch (err3) {
            return generateError(err3, next);
        }
    } catch (err4) {
        return generateError(err4, next);
    }
})

//reject user
router.post('/reject-user', (req, res, next) => {
    logger.debug(`router-rejectUser: ${JSON.stringify(req.body, null, 2)}`);

    userService.rejectUser(req.body.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get profit amount of corporate for Current financial year
router.get('/profit-corporate', (req, res, next) => {
    logger.debug(`router-getProfitCorporate: ${JSON.stringify(req.body, null, 2)}`);

    userService.getAmountFromBalanceSheet(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//get notification - true for unseen and false for seen
router.get('/notification/:seen', (req, res, next) => {
    logger.debug("router-getNotification");

    // if (req.userName.startsWith('ca')) {
    //     req.userName = 'ca';
    // }

    let name = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";

    userService.getNotifications(name, req.params.seen)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/notification', (req, res, next) => {
    logger.debug("router-updateNotification");
    // if (req.userName.startsWith('ca')) {
    //     req.userName = 'ca';
    // }

    let name = req.userName + "." + orgMap[req.orgName.toLowerCase()] + "." + BLOCKCHAIN_DOMAIN + ".com";
    userService.updateNotification(name, req.body.txId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/update', (req, res, next) => {
    logger.debug("We  are trying to update the user Profile");
    userService.updateUserProfile(req.userName, req.body).then((data) => {
        res.json(data)
    }).catch(err => next(err))
})
module.exports = router;