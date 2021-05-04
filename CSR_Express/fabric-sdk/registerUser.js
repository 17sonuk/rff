/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const fs = require('fs');
const path = require('path');
const enrollAdmin = require('./enrollAdmin');
const logger = require('../loggers/logger');

async function main(userName, orgName) {

    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.csr.com`, `connection-${orgName}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caURL = ccp.certificateAuthorities[`ca.${orgName}.csr.com`].url;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), `wallet-${orgName}`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(userName);
    if (userIdentity) {
        logger.debug(`An identity for the user ${userName} already exists in the wallet`);
        throw new Error(`An identity for the user ${userName} already exists in the wallet`);
    }

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        logger.debug('An identity for the admin user "admin" does not exist in the wallet');
        logger.debug('Run the enrollAdmin.js application before retrying');
        try {
            adminIdentity = await enrollAdmin(orgName);
        }
        catch (e) {
            console.log(e, "-------------")
            if (e.message === 'An identity for the admin user "admin" already exists in the wallet') {
                // logger.debug(e.message)
            } else {
                throw new Error('An identity for the admin user "admin" does not exist in the wallet');
            }
        }
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');

    let mspId;
    if (orgName === 'creditsauthority') {
        mspId = 'CreditsAuthorityMSP';
    } else {
        mspId = `${orgName[0].toUpperCase() + orgName.slice(1)}MSP`;
    }

    // Register the user, enroll the user, and import the new identity into the wallet.
    const secret = await ca.register({
        affiliation: `${orgName}.department1`,
        enrollmentID: userName,
        role: 'client'
    }, adminUser);
    const enrollment = await ca.enroll({
        enrollmentID: userName,
        enrollmentSecret: secret
    });
    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: mspId,
        type: 'X.509',
    };
    const walletResponse = await wallet.put(userName, x509Identity);
    logger.debug(`Successfully registered and enrolled admin user ${userName} and imported it into the wallet`);
}

// main("corp203", "corporate");

module.exports = main;