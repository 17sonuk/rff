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

async function main(userName, orgName, functionName, chaincodeName, channelName, args) {
    logger.debug(userName + "," + orgName + "," + functionName + "," + chaincodeName + "," + channelName + "," + args);
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.csr.com`, `connection-${orgName}.json`);
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

    // Submit the specified transaction.
    const result = await contract.submitTransaction(functionName, args);
    logger.debug('Transaction has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();
}

module.exports = main;
