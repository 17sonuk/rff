
'use strict';

const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const IdentityService = require('fabric-ca-client');

const fs = require('fs');
const path = require('path');
const logger = require('../loggers/logger');

require('dotenv').config();
const { ORG1_NAME, ORG2_NAME, ORG3_NAME, BLOCKCHAIN_DOMAIN } = process.env;

let orgMap = {
    'creditsauthority': ORG1_NAME,
    'corporate': ORG2_NAME,
    'ngo': ORG3_NAME
}

let reverseOrgMap = {
}

reverseOrgMap[ORG1_NAME] = 'creditsauthority'
reverseOrgMap[ORG2_NAME] = 'corporate'
reverseOrgMap[ORG3_NAME] = 'ngo'

async function main(userName, orgName, checkWallet = true) {
    orgName = orgMap[orgName];
    // load the network configuration
    // const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', `${orgName}.${BLOCKCHAIN_DOMAIN}.com`, `connection-${orgName}.json`);
    const ccpPath = path.resolve(__dirname, '..', '..', '..', 'FabricMultiHostDeployment', 'setup1', 'vm1', 'api-2.0', 'config', `connection-${orgName}.json`);

    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new CA client for interacting with the CA.
    const caURL = ccp.certificateAuthorities[`ca.${orgName}.${BLOCKCHAIN_DOMAIN}.com`].url;
    const ca = new FabricCAServices(caURL);

    // Create a new file system based wallet for managing identities.
    const walletPath = path.join(process.cwd(), `wallet-${orgName}`);
    console.log('wallet path:', walletPath)
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    logger.debug(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the admin user.
    let adminIdentity = await wallet.get('admin');
    if (!adminIdentity) {
        logger.debug('An identity for the admin user "admin" does not exist in the wallet');
        logger.debug('Run the enrollAdmin.js application before retrying');
        let err = new Error('An identity for the admin user "admin" does not exist in the wallet');
        err.status = 500;
        throw err;
    }

    // build a user object for authenticating with the CA
    const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
    const adminUser = await provider.getUserContext(adminIdentity, 'admin');


    // Check to see if we've already enrolled the user.
    const userIdentity = await wallet.get(userName);

    // To check if user exists in wallet while logging in
    if (checkWallet) {
        if (userIdentity) {
            // Revoke the user, then delete the user from wallet.
            await ca.revoke({ enrollmentID: userName }, adminUser);
            const identityService = ca.newIdentityService();
            identityService.delete(userName, adminUser, true).then(async function (response) {

                await wallet.remove(userName);
                logger.debug("Successfully removed user from wallet!");

            }).catch((error) => {
                logger.error(`Getting error: ${error}`);
                return false;
            });
        } else {
            return false;
        }
    }
    

}

module.exports = main;