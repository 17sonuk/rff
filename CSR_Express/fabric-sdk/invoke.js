/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const logger = require('../loggers/logger');
const userService = require('../service/userService');

require('dotenv').config();
const { ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

async function main(userName, orgName, functionName, chaincodeName, channelName, args) {
    orgName = orgMap[orgName];
    let listener;
    logger.debug(userName + "," + orgName + "," + functionName + "," + chaincodeName + "," + channelName + "," + args);
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.${BLOCKCHAIN_DOMAIN}.com`, `connection-${orgName}.json`);
    // const ccpPath = path.resolve(__dirname, '..', '..', 'FabricMultiHostDeployment', 'setup1', 'vm1', 'api-2.0', 'config', `connection-${orgName}.json`);
    let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), `wallet-${orgName}`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(userName);
    if (!identity) {
        logger.debug(`An identity for the user ${userName} does not exist in the wallet`);
        logger.debug('Run the registerUser.js application before retrying');
        throw new Error(`An identity for the user ${userName} does not exist in the wallet`)
    }

    // Create a new gateway for connecting to our userName node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });
    logger.debug('gateway connected')

    logger.debug('channel: ' + channelName);
    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);
    logger.debug('fetched channel')

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);
    logger.debug('fetched chaincode')

    try {
        // first create a listener to be notified of chaincode code events
        // coming from the chaincode ID "events"
        listener = async (event) => {
            // The payload of the chaincode event is the value placed there by the
            // chaincode. It is a byte data and the application must know how to deserialize.
            // In this case we know that the chaincode will always place the notification object
            // being worked with as the payload for all events produced.
            const payload = JSON.parse(event.payload.toString());
            console.log(`Contract Event Received: ${event.eventName} - ${JSON.stringify(payload)}`);
            // show the information available with the event

            //Store the notification details in mongo.
            var notificationObj = payload;
            var tmpNotification = { 'txId': notificationObj.txId, 'seen': false }

            //for each user store tx details in mongo
            for (let i = 0; i < notificationObj.users.length; i++) {
                tmpNotification['username'] = notificationObj.users[i]
                //save it to mongo
                userService.createNotification(tmpNotification)
                    .then((data) => {
                        logger.debug(JSON.stringify(data, null, 2))
                    })
                    .catch(err => {
                        console.log("create notification", err);
                        logger.error(JSON.stringify(err, null, 2))
                    })
            }

            //save the tx description
            var tmpTxDescription = { 'txId': notificationObj.txId, 'description': notificationObj.description }
            userService.createTxDescription(tmpTxDescription)
                .then((data) => {
                    logger.debug(JSON.stringify(data, null, 2))
                })
                .catch(err => {
                    console.log("create tx description", err);
                    logger.error(JSON.stringify(err, null, 2))
                })

            console.log(`*** Event: ${event.eventName}`);
        };
        // now start the client side event service and register the listener
        console.log(`Start contract event stream to peer in ${orgName}`);
        await contract.addContractListener(listener);
    } catch (eventError) {
        console.log(`Failed: Setup contract events - ${eventError}`);
    }

    // Submit the specified transaction.
    await contract.submitTransaction(functionName, args);
    logger.debug('Transaction has been submitted');

    // Disconnect from the gateway.
    // await gateway.disconnect();

    // formatted according to sonarqube
    gateway.disconnect()

    //  all done with this listener
    contract.removeContractListener(listener);
}

module.exports = {
    main,
};
