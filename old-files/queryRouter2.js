express = require('express');
var log4js = require('log4js');
var logger = log4js.getLogger('CSR-SDK-WebApp');
var query = require('./app/query.js');
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

//it converts the name 'username.org.csr.com' to 'username'
const splitOrgName = orgFullName => orgFullName.split('.')[0];

//getOngoing project details for a perticular corporate : 
router.get('/getCorporateProjectDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE: getCorporateProjectDetails ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var corporate = req.query.args
    var peer = req.header('peer');
    var orgDLTName = req.query.args + '.corporate.csr.com'

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('corporate : ' + corporate);

    if (!chaincodeName) {
        res.json(getErrorMessage('\'chaincodeName\''));
        return;
    }
    if (!channelName) {
        res.json(getErrorMessage('\'channelName\''));
        return;
    }
    if (!corporate) {
        res.json(getErrorMessage('\'corporate\''));
        return;
    }

    let contributor = 'contributors.' + corporate + '\\.corporate\\.csr\\.com'
    let queryString = '{"selector":{"docType":"Project","contributors.' + corporate + '\\\\.corporate\\\\.csr\\\\.com":{"$exists":true}}}'

    let args = []
    args.push(queryString)

    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);

    newObject = new Object()
    newObject = JSON.parse(message.toString())

    var result = []

    newObject.forEach(e => {
        let response = {}
        logger.debug(e["Record"]);
        let endDate = 0;
        response["totalReceived"] = 0;
        response["ourContribution"] = 0;
        for (let f = 0; f < e["Record"].phases.length; f++) {
            response["totalReceived"] += (e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"])

            // if (e["Record"].phases[f]["phaseState"] !== "Created" && e["Record"].phases[f]["phaseState"] !== "Complete") {
            if (e["Record"].phases[f]["phaseState"] !== "Created") {
                response["currentPhase"] = f + 1;
                response["currentPhaseStatus"] = e["Record"].phases[f]["phaseState"];
                response["currentPhaseTarget"] = e["Record"].phases[f]["qty"];
                response["currentPhaseOutstandingAmount"] = e["Record"].phases[f]["outstandingQty"];
                response["percentageFundReceived"] = ((e["Record"].phases[f]["qty"] - e["Record"].phases[f]["outstandingQty"]) / e["Record"].phases[f]["qty"]) * 100
            }

            if (e["Record"].phases[f]["contributions"][orgDLTName.toString()] !== undefined) {
                response["ourContribution"] += e["Record"].phases[f]["contributions"][orgDLTName.toString()]["contributionQty"]
            }

            if (f === e["Record"].phases.length - 1) {
                endDate = e["Record"].phases[f]["endDate"]
            }
        }
        response["projectId"] = e["Key"]
        response["contributors"] = Object.keys(e["Record"]["contributors"]).map(splitOrgName)
        response["ngo"] = splitOrgName(e["Record"]["ngo"])
        response["totalProjectCost"] = e["Record"]["totalProjectCost"]
        response["projectName"] = e["Record"]["projectName"]
        response["projectType"] = e["Record"]["projectType"]
        response["totalPhases"] = e["Record"].phases.length
        var timeDifference = endDate - Date.now()
        if (timeDifference < 0) {
            timeDifference = 0
        }
        response["daysLeft"] = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));

        result.push(response)
    });


    res.send(result)
});

//gives all corporate names along with their contribution
router.get('/getCorporateDetails', async function (req, res) {
    logger.debug('==================== QUERY BY CHAINCODE ==================');
    var channelName = req.header('channelName');
    var chaincodeName = req.header('chaincodeName');
    var peer = req.header('peer');

    logger.debug('channelName : ' + channelName);
    logger.debug('chaincodeName : ' + chaincodeName);
    logger.debug('peer : ' + peer);

    //get all corpoarte present
    let args = []
    args.push(JSON.stringify("queryString"))
    let message = await query.queryChaincode(peer, channelName, chaincodeName, args, "getAllCorporates", req.username, req.orgname);
    corporateList = new Object()
    corporateList = JSON.parse(message.toString())

    console.log("djfjasd",corporateList)

    result = []

    for (let corporate of corporateList) {

        let args = []
        let message
        let queryString

        let resultObject = new Object()

        resultObject.corporate = corporate

        //get amount assigned to corporate
        queryString = { "selector": { "docType": "Transaction", "txType": "AssignToken", "to": corporate }, "fields": ["qty"] }
        args = []
        args.push(JSON.stringify(queryString))
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        let totalAssign = 0.0
        for (let assign of newObject) {
            totalAssign += assign.Record.qty
        }
        resultObject.assignedValue = totalAssign

        //get balance of corporate
        args = []
        args.push(corporate)
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "getBalanceCorporate", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        resultObject.balance = newObject.balance
        resultObject.escrowBalance = newObject.escrowBalance
        resultObject.snapshotBalance = newObject.snapshotBalance

        //get all the projects the corporate is contributed
        let list1 = corporate.split(".")
		let res = list1[0] + "\\\\." + list1[1] + "\\\\." + list1[2] + "\\\\." + list1[3]
        queryString = "{\"selector\":{\"docType\":\"Project\",\"contributors."+ res +"\":{\"$exists\":true}},\"fields\":[\"_id\"]}"
        args = []
        args.push(queryString)
        message = await query.queryChaincode(peer, channelName, chaincodeName, args, "generalQueryFunction", req.username, req.orgname);
        newObject = new Object()
        newObject = JSON.parse(message.toString())
        resultObject.projectCount = newObject.length


        result.push(resultObject)
    }
    res.send(result)
});


module.exports = router;
