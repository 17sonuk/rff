require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const XLSX = require('xlsx')

const logger = require('../../loggers/logger');
const { generateError, getMessage, fieldErrorMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const e = require('express');
const { orgModel, donorModel, projectModel } = require('../../model/models')
//take a snapshot of all corporate balances on chaincode on target peers.
router.post('/snapshot/create', async (req, res, next) => {
    logger.debug('==================== INVOKE CREATE SNAPSHOT ON CHAINCODE ==================');

    let args = [Date.now().toString(), uuid().toString()];

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SnapshotCurrentCorporateBalances", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SnapshotCurrentCorporateBalances'));
    }
    catch (e) {
        generateError(e, next)
    }
});

//transfer unspent tokens to government.
router.post('/unspent/transfer', async (req, res, next) => {
    logger.debug('==================== INVOKE TRANSFER UNSPENT FUNDS TO GOVT ON CHAINCODE ==================');

    const govtAddress = req.body.govtAddress.toString();

    if (!govtAddress) {
        return res.json(getErrorMessage('\'govtAddress\''));
    }

    let args = [govtAddress, Date.now().toString(), uuid().toString()];

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "TransferUnspentTokensToGovt", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked TransferUnspentTokensToGovt'));
    }
    catch (e) {
        generateError(e, next)
    }
});

// Save IT data transaction on chaincode on target peers.
router.post('/add-corporate-email', async (req, res, next) => {
    logger.debug('==================== INVOKE ADD CORPORATE EMAIL ON CHAINCODE ==================')

    const corporateName = req.body.corporateName
    const email = req.body.email

    let args = [email, corporateName]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "AddCorporateEmail", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked AddCorporateEmail'));
    }
    catch (e) {
        generateError(e, next)
    }
});

// Save IT data transaction on chaincode on target peers.
router.post('/it-data', async (req, res, next) => {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')

    const year = req.query.year

    for (let i = 0; i < req.body.length; i++) {
        req.body[i].objectType = "Liability"
    }

    var args = [year, JSON.stringify(req.body)]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SaveItData", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SaveItData'));
    }
    catch (e) {
        generateError(e, next)
    }
});

async function saveITData(req, res, next, data) {
    logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')

    const year = req.body.year

    for (let i = 0; i < data; i++) {
        req.body[i].objectType = "Liability"
    }

    let args = [year, JSON.stringify(data)]

    args = JSON.stringify(args);
    logger.debug('args  : ' + args);

    try {
        await invoke.main(req.userName, req.orgName, "SaveItData", CHAINCODE_NAME, CHANNEL_NAME, args);
        return res.json(getMessage(true, 'Successfully invoked SaveItData'));
    }
    catch (e) {
        generateError(e, next)
    }
}

//excel upload
router.post('/upload-excel', async (req, res, next) => {
    logger.debug('==================== upload excel ==================');
    let wb = XLSX.read(req.body.fileData, { type: 'binary' });
    let sheet = wb.SheetNames[0];
    let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
    // console.log(rows)
    let temp = Object.keys(rows[0])
    if (!(temp.includes('email') && temp.includes('corporateName') && temp.includes('totalLiability'))) {
        return res.json(getMessage(false, 'Column names should be corporateName, email and totalLiability.'))
    }
    else {
        saveITData(req, res, next, rows)
    }
});


// it report - for a year
router.get('/yearly-report', async function (req, res, next) {

    const year = req.query.year
    const responseType = req.header('responseType');

    if (!responseType) {
        return res.json(fieldErrorMessage('\'responseType\''));
    }
    if (!year) {
        return res.json(fieldErrorMessage('\'year\''));
    }

    let startYear = "January 1, " + year + " 00:00:00"
    let endYear = "December 31, " + year + " 00:00:00"

    let date1 = new Date(startYear)
    let date2 = new Date(endYear)

    let result = []


    try {

        let queryTransaction = {
            "selector": {
                "docType": "Transaction",
                "txType": "TransferToken",
                "$and": [
                    {
                        "date": {
                            "$gt": date1.valueOf()
                        }
                    },
                    {
                        "date": {
                            "$lt": date2.valueOf()
                        }
                    }
                ]
            },
            "fields": ["from", "qty", "to", "objRef", "date", "notes"]
        }

        args = JSON.stringify(queryTransaction)
        let messageTransaction = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        let transactionList = JSON.parse(messageTransaction.toString())


        let regDonors = []
        let projectIds = []
        let guestEmails = []
        for (let t = 0; t < transactionList.length; t++) {
            transactionList[t] = JSON.parse(transactionList[t]['Record'])
            let username = splitOrgName(transactionList[t].from)
            regDonors.push(username)
            projectIds.push(transactionList[t].objRef)
            guestEmails.push(transactionList[t].notes.split('\n')[0])
        }


        //orgSchema
        let orgs = await orgModel.find({ userName: { $in: regDonors } }, { _id: 0, firstName: 1, lastName: 1, orgName: 1, subRole: 1, email: 1, userName: 1 })
        let orgsObj = {}
        for (let o = 0; o < orgs.length; o++) {
            let org = orgs[o]
            orgsObj[org.userName] = org
        }

        //donorSchema
        let donors = await donorModel.find({ email: { $in: guestEmails } })
        let donorObj = {}
        for (let d = 0; d < donors.length; d++) {
            let donor = donors[d]
            donorObj[donor.email] = donor
        }

        //project
        let projectKeyRecord = await projectModel.find({ projectId: { $in: projectIds } }, { _id: 0, projectName: 1, projectId: 1 })
        let projectMemory = {}
        for (let p = 0; p < projectKeyRecord.length; p++) {
            let project = projectKeyRecord[p]
            projectMemory[project.projectId] = project
        }

        //transaction
        let projectSummary = {}
        for (let t = 0; t < transactionList.length; t++) {
            let txnObj = {}
            let txn = transactionList[t]
            let username = splitOrgName(txn.from)

            txnObj["Gift Date"] = new Date(txn.date).toGMTString()
            txnObj["Project"] = projectMemory[txn.objRef].projectName

            if (username !== "guest") {
                if (orgsObj[username].subRole === 'Institution') {
                    txnObj["Donor"] = orgsObj[username].orgName
                } else if (orgsObj[username].subRole === 'Intividual') {
                    txnObj["Donor"] = orgsObj[username].firstName + " " + orgsObj[username].lastName
                }
                txnObj["Email"] = orgsObj[username].email

            } else {

                let emailId = txn.notes.split('\n')[0]

                if (donorObj[emailId]) {
                    txnObj["Donor"] = donorObj[emailId].name || "Guest"
                    txnObj["Email"] = emailId

                } else {
                    txnObj["Donor"] = "Guest"
                    txnObj["Email"] = ""

                }
            }
            txnObj["Gift Amount"] = txn.qty

            //total amount
            if (projectMemory[txn.objRef]) {

                let projectName = projectMemory[txn.objRef].projectName
                projectSummary[projectName] = projectSummary[projectName] ? projectSummary[projectName] : 0
                projectSummary[projectName] += txn.qty

            }

            result.push(txnObj)

        }


        if (responseType === 'json') {
            return res.json(getMessage(true, {
                "summary": projectSummary,
                "table": result
            }));
        }
        else if (responseType === 'excel') {
            let excelResponse = convertToExcel(result, 'report');
            return res.json(getMessage(true, excelResponse));
        }
        else {
            generateError(e, next, 400, 'Type should be json or excel');
        }
    }
    catch (e) {
        generateError(e, next)
    }
});

//get in excel format
let convertToExcel = (jsonData, fileName) => {

    console.log("jsonData:", jsonData)

    console.log("res data: ", jsonData)
    const ws = XLSX.utils.json_to_sheet(jsonData);

    //var f={E1: { t: 's', v: 'compliant' }};
    const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx',bookSST: true, cellStyles: true, type: 'base64' })
    // cell.s = {alignment:{ wrapText: true }
   
    // const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    logger.debug(`excelBuffer: ${excelBuffer}`)
    // let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
    // const data = new Blob([excelBuffer], {type: fileType});
    return ({ fileData: excelBuffer, fileName: fileName })
    // return excelBuffer;
}




// // it report - for a year
// router.get('/yearly-report', async function (req, res, next) {

//     const year = req.query.year
//     const responseType = req.header('responseType');

//     if (!responseType) {
//         return res.json(fieldErrorMessage('\'responseType\''));
//     }
//     if (!year) {
//         return res.json(fieldErrorMessage('\'year\''));
//     }

//     let startYear = "January 1, " + year + " 00:00:00"
//     let endYear = "December 31, " + year + " 00:00:00"

//     let date1 = new Date(startYear)
//     let date2 = new Date(endYear)

//     // let result = {}
//     let result = []
//     //fetch all projects
//     let queryProject = {
//         "selector": {
//             "docType": "Project"
//         },
//         "fields": ["projectName"]
//     }

//     let args = JSON.stringify(queryProject)
//     logger.debug(`query string:\n ${args}`);

//     try {
//         let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
//         let projectList = JSON.parse(message.toString())

//         let projectKeyRecord = []

//         projectList.forEach(e => {
//             e['Key']['Record'] = e['Key']['Record']
//             logger.debug("project Record: ", e)
//             projectKeyRecord.push(e)
//         })

//         let queryTransaction = {
//             "selector": {
//                 "docType": "Transaction",
//                 "txType": "TransferToken",
//                 "$and": [
//                     {
//                         "date": {
//                             "$gt": date1.valueOf()
//                         }
//                     },
//                     {
//                         "date": {
//                             "$lt": date2.valueOf()
//                         }
//                     }
//                 ]
//             },
//             "fields": ["from", "qty", "to", "objRef", "date", "notes"]
//         }

//         args = JSON.stringify(queryTransaction)
//         let messageTransaction = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
//         let transactionList = JSON.parse(messageTransaction.toString())

//         //orgSchema
//         let orgs = await orgModel.find({ role: 'Corporate' })
//         let orgsObj = {}
//         for (let o = 0; o < orgs.length; o++) {
//             let org = orgs[o]
//             // let { firstName, lastName, orgName, userName, email, subRole } = org
//             orgsObj[org.userName] = org
//             // // donorObj[donors[d].userName]["paymentType"] = donors[d].paymentDetails.paymentType
//             // donorObj[userName]["name"] = donors[d].firstName + " " + donors[d].lastName
//             // if (donors[d].subRole === "Institution") {
//             //     donorObj[donors[d].userName]["name"] = donors[d].orgName
//             // }

//         }
//         //donorSchema
//         let donors = await donorModel.find()
//         let donorObj = {}
//         for (let d = 0; d < donors.length; d++) {
//             let donor = donors[d]
//             donorObj[donor.email] = donor

//         }

//         //project
//         let projectMemory = {}
//         for (let p = 0; p < projectKeyRecord.length; p++) {
//             let project = projectKeyRecord[p]
//             projectMemory[project.Key] = JSON.parse(project.Record)

//         }

//         //transaction
//         let projectSummary = {}
//         for (let t = 0; t < transactionList.length; t++) {
//             let txnObj = {}
//             let txn = JSON.parse(transactionList[t]['Record'])
//             let username = splitOrgName(txn.from)

//             txnObj["Gift Date"] = new Date(txn.date).toGMTString()
//             txnObj["Project"] = projectMemory[txn.objRef].projectName

//             if (username !== "guest") {
//                 txnObj["Donor"] = orgsObj[username].firstName + " " + orgsObj[username].lastName

//                 // txnObj["ContactName"]=donorObj[orgsObj[username].email].name
//                 txnObj["Email"] = orgsObj[username].email
//             } else {

//                 let emailId = txn.notes.split('\n')[0]
//                 if (donorObj[emailId]) {
//                     txnObj["Donor"] = donorObj[emailId].name || "Guest"
//                     txnObj["Email"] = emailId

//                 } else {
//                     txnObj["Donor"] = "Guest"
//                     txnObj["Email"] = ""

//                 }
//             }
//             txnObj["Gift Amount"] = txn.qty

//             // let totalAmount={}
//             if (projectMemory[txn.objRef]) {

//                 let projectName = projectMemory[txn.objRef].projectName
//                 projectSummary[projectName] = projectSummary[projectName] ? projectSummary[projectName] : 0
//                 projectSummary[projectName] += txn.qty
//                 // projectSummary[txn.objRef]["Project Name"]=projectMemory[txn.objRef].projectName
//                 // projectSummary[txn.objRef]["Total GiftAmount"] += txn.qty

//             }

//             result.push(txnObj)

//         }
//         // result.push(donorRecords)

//         // for (let r = 0; r < projectKeyRecord.length; r++) {

//         //     let reco = JSON.parse(projectKeyRecord[r].Record)
//         //     let projName = reco.projectName
//         //     let key = projectKeyRecord[r].Key
//         //     let donorList = []
//         //     let totalReceived = 0.0

//         //     for (let d = 0; d < transactionList.length; d++) {
//         //         let e = JSON.parse(transactionList[d]['Record'])
//         //         logger.debug("tx Record: ", e)

//         //         let donorRecords = {}
//         //         if (key === e.objRef) {
//         //             e.from = splitOrgName(e.from)
//         //             // if (donorRecords[e.from] === undefined) {
//         //             //     donorRecords[e.from]["GiftAmount"] = e.qty
//         //             // }
//         //             // else {
//         //             //     donorRecords[e.from]["GiftAmount"] += e.qty
//         //             // }
//         //             donorRecords["ContactName"] = donorObj[e.from].name
//         //             donorRecords["GiftAmount"] = e.qty
//         //             donorRecords["GiftDate"] = e.date
//         //             if (e.from !== "guest") {
//         //                 // email = await orgModel.findOne({ userName: e.from }, { _id: 0, email: 1 })
//         //                 donorRecords["EmailAddress"] = donorObj[e.from].email
//         //             } else {
//         //                 donorRecords["EmailAddress"] = e.notes.split("\n")[0]
//         //             }
//         //             // donorRecords["PaymentType"] = donorObj[e.from].paymentType

//         //             donorList.push(donorRecords)
//         //             totalReceived += e.qty
//         //         }
//         //     }

//         //     let newResultObject = {}
//         //     newResultObject.donors = donorList
//         //     newResultObject.totalReceived = totalReceived
//         //     result[projName] = newResultObject
//         // }

//         if (responseType === 'json') {
//             return res.json(getMessage(true, {
//                 "summary":projectSummary,
//                 "table":result
//             }));
//         }
//         else if (responseType === 'excel') {
//             let excelResponse = convertToExcel(result, 'report');
//             return res.json(getMessage(true, excelResponse));
//         }
//         else {
//             generateError(e, next, 400, 'Type should be json or excel');
//         }
//     }
//     catch (e) {
//         generateError(e, next)
//     }
// });

// //get in excel format
// let convertToExcel = (jsonData, fileName) => {

//     console.log("jsonData:", jsonData)
//     // jsonData={ 'Test Project 101': { donors: { gaurav: 700 ,Anurag: 300}, totalReceived: 700 },
//     // 'Test Project 102': { donors: { guest: 100}, totalReceived: 100 } }

//     // jsonData={ 'Test Project 101': { donors: [{ContactName:gaurav,GiftAmount: 700,GiftDate:2020-21-01T00..,EmailAddress:gaurav@gmail.com} ,{ContactName:Anrag:,GiftAmount: 300,GiftDate:2020-21-01T00..,EmailAddress:anurag@gmail.com }], totalReceived: 700 },

//     // let res = []
//     // for (let project in jsonData) {
//     //     let temp = []
//     //     for (let i = 0; i < jsonData[project].donors.length; i++) {

//     //         let obj = {}

//     //         if (temp.length == 0) {
//     //             obj["Project"] = project
//     //             obj["Total Received"] = jsonData[project]["totalReceived"]
//     //         } else {
//     //             obj["Project Name"] = ""
//     //             obj["Total Received"] = ""
//     //         }
//     //         obj["ContactName"] = jsonData[project].donors[i].ContactName
//     //         obj["GiftAmount"] = jsonData[project].donors[i].GiftAmount
//     //         obj["GiftDate"] = jsonData[project].donors[i].GiftDate
//     //         obj["EmailAddress"] = jsonData[project].donors[i].EmailAddress
//     //         // obj["PaymentType"] = jsonData[project].donors[i].PaymentType
//     //         temp.push(obj)

//     //     }
//     //     res.push(...temp)


//     // }

//     // let res = []
//     // for (let project in jsonData) {
//     //     let temp = []
//     //     for (let donor in jsonData[project]['donors']) {

//     //         let obj = {}

//     //         if (temp.length == 0) {
//     //             obj["Project"] = project
//     //             obj["Total Received"] = jsonData[project]["totalReceived"]
//     //         } else {
//     //             obj["Project Name"] = ""
//     //             obj["Total Received"] = ""
//     //         }
//     //         obj["ContactName"] = donor
//     //         obj["GiftAmount"] = jsonData[project]['donors'][donor]
//     //         temp.push(obj)

//     //     }
//     //     res.push(...temp)


//     // }
//     console.log("res data: ", jsonData)
//     const ws = XLSX.utils.json_to_sheet(jsonData);

//     //var f={E1: { t: 's', v: 'compliant' }};
//     const wb = { Sheets: { 'data': ws }, SheetNames: ['data'] };
//     // const excelBuffer = XLSX.write(wb, { bookType: 'xlsx',bookSST: true, cellStyles: true, type: 'base64' })

//     const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
//     logger.debug(`excelBuffer: ${excelBuffer}`)
//     // let fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
//     // const data = new Blob([excelBuffer], {type: fileType});
//     return ({ fileData: excelBuffer, fileName: fileName })
//     // return excelBuffer;
// }

module.exports = router;