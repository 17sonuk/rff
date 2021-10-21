const express = require('express');
const router = express.Router();

require('dotenv').config();
const { SMTP_EMAIL, APP_PASSWORD, ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;
const { generateError, getMessage } = require('../../utils/functions');
const userService = require('../../service/userService');
const mongoProjectService = require('../../service/projectService');
const registerUser = require('../../fabric-sdk/registerUser');
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
            return registerUser(req.body.userName, req.body['role'].toLowerCase())
                .then((response) => {
                    userService.sendEmailForDonorRegistration(req);
                    //send registration success message
                    return res.json(getMessage(true, messages.success.REGISTER_USER));
                })
                .catch((err) => {
                    //call delete service to delete user in mongo
                    userService.deleteUser(req.body.userName)
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



// //approve user : not using
// router.post('/approve-user', async (req, res, next) => {
//     try {
//         let orgName = await userService.approveUser(req.body.userName);
//         try {
//             await registerUser(req.body.userName, orgName);
//             transporter.verify()
//                 .then((data) => {
//                     let receiverEmail = ''
//                     orgModel.findOne({ userName: req.body.userName }, { _id: 0, email: 1 })
//                         .then((email) => {
//                             receiverEmail = email
//                             transporter.sendMail({
//                                 from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
//                                 to: receiverEmail.email, // list of receivers // 'c1@gmail.com, c2@outlook.com'
//                                 subject: "Testing csr mail", // Subject line
//                                 text: "Congrats " + req.body.userName + ", You have successfully onboarded to the CSR platform!", // plain text body
//                                 //html: "<b>You have successfully onboarded to the CSR platform</b>", // html body
//                             }).then(info => {
//                                 console.log({ info });
//                             }).catch(console.error);
//                         })
//                 })
//                 .catch(console.error);
//             return res.json(getMessage(true, "User approved successfully!"));
//         } catch (registerError) {
//             if (registerError.status === 400) {
//                 return generateError(registerError, next, 400, `${req.body.userName} is already registered in blockchain`);
//             }
//             try {
//                 await userService.resetUserStatus(req.body.userName)
//                 return generateError(registerError, next, 500, 'Couldn\'t register user in blockchain!');
//             } catch (resetStatusError) {
//                 return generateError(resetStatusError, next);
//             }
//         }
//     } catch (approveErr) {
//         return generateError(approveErr, next);
//     }
// })


// //project completed : not using

// router.post('/project-completed', async (req, res, next) => {
//     try {
//         let projectData = await mongoProjectService.getProjectById(req.body.projectId)
//         try {
//             let emailList = orgModel.find({ userName: { $in: contributorsList } }, { _id: 0, email: 1 })
//             for (let i = 0; i < emailList.length; i++) {
//                 if (i != 0) {
//                     emailList += ', '
//                 }
//             }
//             transporter.verify().then((data) => {
//                 transporter.sendMail({
//                     from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
//                     bcc: emailList, // list of receivers
//                     subject: `${projectData.projectName} is now completed`, // Subject line
//                     text: ` Hi ${donorList.name}, ${projectData.projectName} is now completed, thanks for your contribution `, // plain text body
//                     //html: "<b>You have successfully onboarded to the CSR platform</b>", // html body
//                 }).then(info => {
//                     console.log({ info });
//                 }).catch(console.error);
//             }).catch(console.error);
//             return res.json(getMessage(true, "Project has been completed and donors have been notified!"));
//         } catch (err3) {
//             return generateError(err3, next);
//         }
//     } catch (err4) {
//         return generateError(err4, next);
//     }
// })

// //reject user : not using
// router.post('/reject-user', (req, res, next) => {
//     userService.rejectUser(req.body.userName)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })

// //get profit amount of corporate for Current financial year : not using
// router.get('/profit-corporate', (req, res, next) => {
//     userService.getAmountFromBalanceSheet(req.query.userName)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })


module.exports = router;