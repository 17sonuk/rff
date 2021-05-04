/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const logger = require('../loggers/logger');

async function main(orgName) {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.csr.com`, `connection-${orgName}.json`);
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caInfo = ccp.certificateAuthorities[`ca.${orgName}.csr.com`];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), `wallet-${orgName}`);
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    const identity = await wallet.get('admin');
    if (identity) {
        logger.debug('An identity for the admin user "admin" already exists in the wallet');
        throw new Error('An identity for the admin user "admin" already exists in the wallet');
    }

    let mspId;
    if (orgName === 'creditsauthority') {
        mspId = 'CreditsAuthorityMSP';
    } else {
        mspId = `${orgName[0].toUpperCase() + orgName.slice(1)}MSP`;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({ enrollmentID: 'admin', enrollmentSecret: 'adminpw' });
    const x509Identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: mspId,
        type: 'X.509',
    };
    await wallet.put('admin', x509Identity);
    logger.debug('Successfully enrolled admin user "admin" and imported it into the wallet');
    return x509Identity;
}

// main("ngo");

module.exports = main;