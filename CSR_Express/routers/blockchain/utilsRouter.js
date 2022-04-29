require('dotenv').config();
const { CHAINCODE_NAME, CHANNEL_NAME } = process.env;

const express = require('express');
const router = express.Router();
const { v4: uuid } = require('uuid');
const XLSX = require('xlsx')

const logger = require('../../loggers/logger');
const messages = require('../../loggers/messages')
const { generateError, getMessage, fieldErrorMessage, splitOrgName } = require('../../utils/functions');

const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const e = require('express');
const { orgModel, donorModel, projectModel } = require('../../model/models')


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
            "fields": ["from", "qty", "to", "objRef", "date", "notes", "paymentId", "paymentMode"]
        }

        args = JSON.stringify(queryTransaction)
        let messageTransaction = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        let transactionList = JSON.parse(messageTransaction.toString())
        console.log("transactionList : ", transactionList)
        let regDonors = []
        let projectIds = []
        let guestEmails = []
        for (let t = 0; t < transactionList.length; t++) {

            // let paymentId = transactionList[t]['Key']
            transactionList[t] = JSON.parse(transactionList[t]['Record'])
            // transactionList[t]["paymentId"] = paymentId
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
                if (orgsObj[username]) {
                    if (orgsObj[username].subRole === 'Institution') {
                        txnObj["Donor"] = orgsObj[username].orgName
                    } else if (orgsObj[username].subRole === 'Individual') {
                        txnObj["Donor"] = orgsObj[username].firstName + " " + orgsObj[username].lastName
                    }
                    txnObj["Email"] = orgsObj[username].email
                } else {
                    txnObj["Donor"] = username
                    txnObj["Email"] = "-"
                }
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
            txnObj["Payment ID"] = txn.paymentId
            txnObj["Payment Mode"] = txn.paymentMode

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
            let excelResponse = convertToExcel(result, `Report_${year}`, year);
            return res.json(getMessage(true, excelResponse));
        }
        else {
            generateError(e, next, 400, messages.error.REPORT_TYPE);
        }
    }
    catch (e) {
        generateError(e, next)
    }
});

//get in excel format
let convertToExcel = (jsonData, fileName, year) => {
    const ws = XLSX.utils.json_to_sheet(jsonData);
    let wb = {
        'Sheets': {},
        'SheetNames': []
    }
    wb['Sheets'][year] = ws
    wb['SheetNames'] = [year]

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' })
    return ({ fileData: excelBuffer, fileName: fileName })
}




module.exports = router;