/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');
const logger = require('../loggers/logger');

async function main(userName, orgName, functionName, chaincodeName, channelName, args) {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.csr.com`, `connection-${orgName}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), `wallet-${orgName}`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get(userName);
    if (!identity) {
        logger.debug(`An identity for the user ${userName} does not exist in the wallet`);
        logger.debug('Run the registerUser.js application before retrying');
        throw new Error(`An identity for the user ${userName} does not exist in the wallet`);
    }

    // Create a new gateway for connecting to our userName node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: userName, discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork(channelName);

    // Get the contract from the network.
    const contract = network.getContract(chaincodeName);

    // Evaluate the specified transaction.
    let result;
    if (args.length > 0) {
        result = await contract.evaluateTransaction(functionName, args);
    } else {
        result = await contract.evaluateTransaction(functionName);
    }
    logger.debug(`Transaction has been evaluated`);

    // Disconnect from the gateway.
    await gateway.disconnect();
    return result;
}

module.exports = main;
