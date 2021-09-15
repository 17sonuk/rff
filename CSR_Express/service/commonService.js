require('dotenv').config();
const logger = require('../loggers/logger');
const commonModel = require('../model/commonModel');
const donorEmailTemplate = require('../email-templates/donorEmail');
const initiateEmailTemplate = require('../email-templates/projectInitiationEmail');
const ProjCompletionTemplate = require('../email-templates/projectCompleteEmail');
const MilestoneEmailTemplate = require('../email-templates/milestoneEmail');
const mongoProjectService = require('../service/projectService');
const { orgModel } = require('../model/models');
const nodemailer = require('nodemailer');
const moment = require('moment');
const { SMTP_EMAIL, APP_PASSWORD, CHAINCODE_NAME, CHANNEL_NAME, PLATFORM_NAME } = process.env;
const query = require('../fabric-sdk/query');
const { splitOrgName } = require('../utils/functions');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    auth: {
        user: SMTP_EMAIL,
        pass: APP_PASSWORD,
    },
});

const commonService = {};

// upload Balance sheet:
commonService.uploadBalanceSheet = (file) => {
    return commonModel.uploadBalanceSheet(file).then(data => {
        if (data) return { success: true, message: 'balance Sheet uploaded successfully' }
        return { success: false, message: 'Error in uploading the balance sheet' }
    })
}

commonService.saveCommunities = (communityArr) => {
    return commonModel.saveCommunities(communityArr).then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getCommunities = () => {
    return commonModel.getCommunities().then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getCommunity = async (communityId) => {
    return commonModel.getCommunity(communityId).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("No community")
            err.status = 500
            throw err
        }
    }).catch(er => {
        throw er
    })
}

commonService.deleteCommunities = (communityIds) => {
    return commonModel.deleteCommunities(communityIds).then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.saveDonor = (donor) => {
    return commonModel.saveDonor(donor).then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.getDonors = () => {
    return commonModel.getDonors().then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })
}

commonService.updateCommunity = (communityId, name, place, paymentDetails) => {
    return commonModel.updateCommunity(communityId, name, place, paymentDetails).then(data => {
        if (data) return data;
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })

}

commonService.getListedCommunity = (communityIds, orgName) => {
    return commonModel.getListedCommunity(communityIds, orgName).then(data => {
        if (data) return data;
        let err = new Error("No data found")
        err.status = 500
        throw err

    }).catch(er => {
        let err = new Error("Bad Connection")
        err.status = 500
        throw err
    })

}

commonService.getOrgDetails = (userName) => {
    return commonModel.getOrgDetails(userName).then(data => {
        if (data) return data;
        let err = new Error("No data found")
        err.status = 500
        throw err
    })
}

commonService.sendEmailToDonor = async (email, name, amount, projectId, address) => {
    let projectDetails = await commonModel.getProjectById(projectId);
    if (!projectDetails) {
        let err = new Error("No project found")
        err.status = 500
        throw err;
    }

    let htmlBody = await donorEmailTemplate.donorEmail(name, amount, projectDetails.projectName, 'Rainforest Blockchain Platform', moment().format('MMMM Do YYYY'), address)
    transporter.verify().then(() => {
        transporter.sendMail({
            from: '"CSR Test Mail" <rainforest.csr@gmail.com', // sender address
            to: email, //receiver address'
            subject: `Here is your donation receipt for ${PLATFORM_NAME} - ${projectDetails.projectName}`, // Subject line
            html: htmlBody, // html body
        }).then(info => {
            return { info };
        }).catch(console.error);
    }).catch(console.error);
}

commonService.projectInitiation = async (projectId, username, orgname) => {
    let projectData = await mongoProjectService.getProjectById(projectId)
    let projectName = projectData.projectName
    let desc = projectData.phases[0].description
    let emailList = await orgModel.find({ role: "Corporate" }, { _id: 0, email: 1, firstName: 1 })

    let queryString = {
        "selector": {
            "_id": projectId
        }
    }
    let args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    let message = await query.main(username, orgname, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
    message = JSON.parse(message.toString());

    message.forEach(elem => {
        elem['Record'] = JSON.parse(elem['Record'])
    })

    const endDate = message[0]['Record'].phases[0].endDate

    transporter.verify().then((data) => {
        for (i = 0; i < emailList.length; i++) {
            let htmlBody = initiateEmailTemplate.projectInitiationEmail(projectName, emailList[i].firstName, desc, moment(endDate).format('MMMM MM YYYY'))
            transporter.sendMail({
                from: '"CSR Test Mail" <csr.rainforest@gmail.com', // sender address
                to: emailList[i].email, // list of receivers
                subject: `${projectName} has initiated work - stay tuned for project updates`, // Subject line
                html: htmlBody, // html body
            }).then(info => {
            }).catch(error => {
                console.log(error)
            });
        }
    }).catch(console.error);
}

commonService.getDonorEmailList = (contributors) => {
    return commonModel.getDonorEmailList(contributors).then(data => {
        if (data) return data;
        let err = new Error("No data found")
        err.status = 500
        throw err
    })
}

commonService.ProjectCompletionEmail = async (projectId, username, orgname) => {
    let queryString = {
        "selector": {
            "_id": projectId
        }
    }
    let args = JSON.stringify(queryString)
    logger.debug(`query string:\n ${args}`);

    let message = await query.main(username, orgname, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
    message = JSON.parse(message.toString());

    message.forEach(elem => {
        elem['Record'] = JSON.parse(elem['Record'])
    })

    let redeemString = {
        "selector": {
            "docType": "Redeem",
            "projectId": projectId,
            "status": "Approved"
        },
        "fields": ["qty"]
    }
    args = JSON.stringify(redeemString)
    logger.debug(`query string:\n ${args}`);

    let redeemMsg = await query.main(username, orgname, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
    redeemMsg = JSON.parse(redeemMsg.toString());

    redeemMsg.forEach(ele => {
        ele['Record'] = JSON.parse(ele['Record'])
    })
    let amount = 0.0
    for (let i = 0; i < redeemMsg.length; i++) {
        amount += redeemMsg[i].Record.qty
    }



    if (message.length > 0) {
        if (message[0]['Record']['docType'] === 'Project') {
            message = message[0]
            if (message['Record']['projectState'] === "Validated") {
                let contributorsObj = message['Record']['contributors']
                let contributors = []
                for (let key in contributorsObj) {
                    if (!key.startsWith("guest")) {
                        contributors.push(splitOrgName(key))
                    }
                }
                let donorList = await orgModel.find({ userName: { $in: contributors } }, { _id: 0, email: 1, firstName: 1, orgName: 1, subRole: 1 })
                if (donorList.length > 0) {
                    for (let i = 0; i < donorList.length; i++) {

                        let name = donorList[i].firstName
                        if (donorList[i].subRole === "Institution") {
                            name = donorList[i].orgName
                        }

                        let htmlBody = await ProjCompletionTemplate.projectCompleteEmail(name, message['Record']['projectName'], amount, projectId)

                        transporter.verify().then((data) => {
                            transporter.sendMail({
                                from: '"CSR Test Mail" <rainforest.csr@gmail.com', // sender address
                                to: donorList[i].email, // list of receivers
                                subject: `${PLATFORM_NAME}: ${message['Record']['projectName']} is successfully completed!`, // Subject line
                                html: htmlBody, // html body
                            }).then(info => {
                                console.log({ info });
                            }).catch(console.error);
                        }).catch(console.error);
                    }
                }
            }

        }
    }
}

commonService.MilestoneEmail = async (projectId, phaseNumber, username, orgname) => {
    let queryString = {
        "selector": {
            "_id": projectId
        }
    }
    let args = JSON.stringify(queryString)
    let message = await query.main(username, orgname, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
    message = JSON.parse(message.toString());

    message.forEach(elem => {
        elem['Record'] = JSON.parse(elem['Record'])
    })

    if (message.length > 0) {
        if (message[0]['Record']['docType'] === 'Project') {
            message = message[0]

            let contributorsObj = message['Record']['contributors']
            let contributors = []
            for (let key in contributorsObj) {
                if (!key.startsWith("guest")) {
                    contributors.push(splitOrgName(key))
                }
            }
            let donorList = await orgModel.find({ userName: { $in: contributors } }, { _id: 0, email: 1, firstName: 1, orgName: 1, subRole: 1 })

            if (donorList.length > 0) {
                let projectData = await mongoProjectService.getProjectById(projectId)
                let desc1 = projectData.phases[phaseNumber].description
                for (let i = 0; i < donorList.length; i++) {

                    let name = donorList[i].firstName
                    if (donorList[i].subRole === "Institution") {
                        name = donorList[i].orgName
                    }
                    let amount = message['Record'].phases[phaseNumber]['qty'] - message['Record'].phases[phaseNumber]['outstandingQty']

                    let htmlBody = await MilestoneEmailTemplate.milestoneEmail(name, message['Record']['projectName'], amount, projectId, desc1)

                    transporter.verify().then((data) => {
                        transporter.sendMail({
                            from: '"CSR Test Mail" <rainforest.csr@gmail.com', // sender address
                            to: donorList[i].email, // list of receivers
                            subject: `${PLATFORM_NAME}: ${message['Record']['projectName']} successfully met a project milestone!`, // Subject line
                            html: htmlBody, // html body
                        }).then(info => {
                            console.log({ info });
                        }).catch(console.error);
                    }).catch(console.error);
                }
            }
        }

    }
}

module.exports = commonService;
