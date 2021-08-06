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

    if (!year) {
        return res.json(fieldErrorMessage('\'year\''));
    }


    let startYear = "January 1, " + year + " 00:00:00"
    let endYear = "December 31, " + year + " 00:00:00"

    let date1 = new Date(startYear)
    let date2 = new Date(endYear)


    let result = {}

    //fetch all projects
    let queryProject = {
        "selector": {
            "docType": "Project"
        },
        "fields": ["projectName", "contributors", "phases"]
    }


    let args = JSON.stringify(queryProject)
    logger.debug(`query string:\n ${args}`);

    try {

        let message = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        let projectList = JSON.parse(message.toString())

        let projectKeyRecord = []

        projectList.forEach(e => {
            e['Key']['Record'] = e['Key']['Record']
            logger.debug("project Record: ", e)
            projectKeyRecord.push(e)
        })

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
            "fields": ["from", "qty", "to", "objRef"]
        }

        args = JSON.stringify(queryTransaction)
        let messageTransaction = await query.main(req.userName, req.orgName, 'CommonQuery', CHAINCODE_NAME, CHANNEL_NAME, args);
        let transactionList = JSON.parse(messageTransaction.toString())

        for (let r = 0; r < projectKeyRecord.length; r++) {

            let reco = JSON.parse(projectKeyRecord[r].Record)
            let projName = reco.projectName
            let key = projectKeyRecord[r].Key
            let donorRecords = {}

            let totalReceived = 0.0

            for (let d = 0; d < transactionList.length; d++) {

                let e = JSON.parse(transactionList[d]['Record'])

                logger.debug("tx Record: ", e)

                if (key === e.objRef) {

                    e.from = splitOrgName(e.from)

                    if (donorRecords[e.from] === undefined) {
                        donorRecords[e.from] = e.qty
                    }
                    else {
                        donorRecords[e.from] += e.qty
                    }
                    totalReceived += e.qty
                }

            }

            let newResultObject = {}
            newResultObject.donors = donorRecords
            newResultObject.totalReceived = totalReceived
            result[projName] = newResultObject
        }

        return res.json(getMessage(true, result));
    }
    catch (e) {
        generateError(e, next)
    }
});

module.exports = router;