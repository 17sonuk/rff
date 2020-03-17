var util = require('util');
var path = require('path');
var hfc = require('fabric-client');

// indicate to the application where the setup file is located so it able
// to have the hfc load it to initalize the fabric client instance
hfc.setConfigSetting('network-connection-profile-path',path.join(__dirname, 'artifacts' ,'network-config.yaml'));
hfc.setConfigSetting('Corporate-connection-profile-path',path.join(__dirname, 'artifacts', 'corporate.yaml'));
hfc.setConfigSetting('CreditsAuthority-connection-profile-path',path.join(__dirname, 'artifacts', 'creditsauthority.yaml'));
hfc.setConfigSetting('Ngo-connection-profile-path',path.join(__dirname, 'artifacts', 'ngo.yaml'));
// some other settings the application might need to know
hfc.addConfigFile(path.join(__dirname, 'config.json'));
