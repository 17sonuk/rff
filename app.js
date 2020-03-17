'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
const uuid = require('uuid');
// const request = require('request');
const projectRouter = require('./mongoDb/projectRouter');
const projectService = require('./mongoDb/projectService');
const queryRouter = require('./queryRouter');
const XLSX = require('xlsx');


require('./config.js');
var hfc = require('fabric-client');

var helper = require('./app/helper.js');
var createChannel = require('./app/create-channel.js');
var join = require('./app/join-channel.js');
var updateAnchorPeers = require('./app/update-anchor-peers.js');
var install = require('./app/install-chaincode.js');
var instantiate = require('./app/instantiate-chaincode.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');


app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(bodyParser.json({ limit: '20mb' }));
//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({
	extended: false
}));

// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
	secret: 'thisismysecret'
}).unless({
	path: ['/users', '/mongo/onboarding', '/mongo/login']
}));
app.use(bearerToken());
app.use(function (req, res, next) {
	logger.debug(' ------>>>>>> new request for %s', req.originalUrl);
	if (req.originalUrl.indexOf('/users') >= 0 || req.originalUrl.indexOf('/mongo/onboarding') >= 0 || req.originalUrl.indexOf('/mongo/login') >= 0) {
		return next();
	}

	var token = req.token;
	jwt.verify(token, app.get('secret'), function (err, decoded) {
		if (err) {
			res.send({
				success: false,
				message: 'Failed to authenticate token. Make sure to include the ' +
					'token returned from /users call in the authorization header ' +
					' as a Bearer token'
			});
			return;
		} else {
			// add the decoded user name and org name to the request object
			// for the downstream code to use
			req.username = decoded.username;
			req.orgname = decoded.orgName;
			logger.debug(util.format('Decoded from JWT token: username - %s, orgname - %s', decoded.username, decoded.orgName));
			return next();
		}
	});
});

app.use('/query', queryRouter);
app.use('/mongo', projectRouter);

var server = http.createServer(app).listen(port, function () { });
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

function getErrorMessage(field) {
	var response = {
		success: false,
		message: field + ' field is missing or Invalid in the request'
	};
	return response;
}

app.post('/users', async function (req, res) {
	var username = req.body.userName;
	var orgName = req.body.orgName;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);
	logger.debug('Org name  : ' + orgName);
	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!orgName) {
		res.json(getErrorMessage('\'orgName\''));
		return;
	}
	var token = jwt.sign({
		exp: Math.floor(Date.now() / 1000) + parseInt(hfc.getConfigSetting('jwt_expiretime')),
		username: username,
		orgName: orgName
	}, app.get('secret'));
	let response = await helper.getRegisteredUser(username, orgName, true);
	logger.debug('-- returned from registering the username %s for organization %s', username, orgName);
	if (response && typeof response !== 'string') {
		logger.debug('Successfully registered the username %s for organization %s', username, orgName);
		response.token = token;
		res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({ success: false, message: response });
	}

});

//****************************** CreateChannel *******************************

// Create Channel
app.post('/channels', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< C R E A T E  C H A N N E L >>>>>>>>>>>>>>>>>');
	logger.debug('End point : /channels');
	var channelName = req.body.channelName;
	var channelConfigPath = req.body.channelConfigPath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('channelConfigPath : ' + channelConfigPath); //../artifacts/channel/mychannel.tx
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!channelConfigPath) {
		res.json(getErrorMessage('\'channelConfigPath\''));
		return;
	}

	let message = await createChannel.createChannel(channelName, channelConfigPath, req.username, req.orgname);
	res.send(message);
});

//****************************** Join Channel *******************************


// Join Channel
app.post('/channels/:channelName/peers', async function (req, res) {
	logger.info('<<<<<<<<<<<<<<<<< J O I N  C H A N N E L >>>>>>>>>>>>>>>>>');
	var channelName = req.params.channelName;
	var peers = req.body.peers;
	logger.debug('channelName : ' + channelName);
	logger.debug('peers : ' + peers);
	logger.debug('username :' + req.username);
	logger.debug('orgname:' + req.orgname);

	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}

	let message = await join.joinChannel(channelName, peers, req.username, req.orgname);
	res.send(message);
});

//****************************** Update Anchor Peer *******************************


// Update anchor peers
app.post('/channels/:channelName/anchorpeers', async function (req, res) {
	logger.debug('==================== UPDATE ANCHOR PEERS ==================');
	var channelName = req.params.channelName;
	var configUpdatePath = req.body.configUpdatePath;
	logger.debug('Channel name : ' + channelName);
	logger.debug('configUpdatePath : ' + configUpdatePath);
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!configUpdatePath) {
		res.json(getErrorMessage('\'configUpdatePath\''));
		return;
	}

	let message = await updateAnchorPeers.updateAnchorPeers(channelName, configUpdatePath, req.username, req.orgname);
	res.send(message);
});

//****************************** Insatall Chaincode *******************************


// Install chaincode on target peers
app.post('/chaincodes', async function (req, res) {
	logger.debug('==================== INSTALL CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodePath = req.body.chaincodePath;
	var chaincodeVersion = req.body.chaincodeVersion;
	var chaincodeType = req.body.chaincodeType;
	logger.debug('peers : ' + peers); // target peers list
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodePath  : ' + chaincodePath);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	if (!peers || peers.length == 0) {
		res.json(getErrorMessage('\'peers\''));
		return;
	}
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodePath) {
		res.json(getErrorMessage('\'chaincodePath\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	let message = await install.installChaincode(peers, chaincodeName, chaincodePath, chaincodeVersion, chaincodeType, req.username, req.orgname)
	res.send(message);
});

//****************************** Instantiate chaincode *******************************


app.post('/channels/:channelName/chaincodes', async function (req, res) {
	logger.debug('==================== INSTANTIATE CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.body.chaincodeName;
	var chaincodeVersion = req.body.chaincodeVersion;
	var channelName = req.params.channelName;
	var chaincodeType = req.body.chaincodeType;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('peers  : ' + peers);
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('chaincodeVersion  : ' + chaincodeVersion);
	logger.debug('chaincodeType  : ' + chaincodeType);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!chaincodeVersion) {
		res.json(getErrorMessage('\'chaincodeVersion\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!chaincodeType) {
		res.json(getErrorMessage('\'chaincodeType\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	let message = await instantiate.instantiateChaincode(peers, channelName, chaincodeName, chaincodeVersion, chaincodeType, fcn, args, req.username, req.orgname);
	res.send(message);
});

//****************************** Invoke chaincode *******************************

// Invoke transaction on chaincode on target peers
app.post('/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
	logger.debug('==================== INVOKE ON CHAINCODE ==================');
	var peers = req.body.peers;
	var chaincodeName = req.params.chaincodeName;
	var channelName = req.params.channelName;
	var fcn = req.body.fcn;
	var args = req.body.args;
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn  : ' + fcn);
	logger.debug('args  : ' + args);
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		res.json(getErrorMessage('\'args\''));
		return;
	}

	//add current UTC date(in epoch milliseconds) to args
	args.push(Date.now().toString());

	if (fcn != "requestTokens") {
		args.push(uuid());
	}

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, fcn, args, req.username, req.orgname);
	res.send(message);
});


//****************************** requestTokens *******************************

// Request Token transaction on chaincode on target peers.
app.post('/requestTokens', async function (req, res) {
	logger.debug('==================== INVOKE REQUEST TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var amount = req.body.amount.toString();
	var bankTxId = req.body.bankTxId;
	var proofDocName = req.body.proofDocName;
	var proofDocHash = req.body.proofDocHash;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!amount) {
		res.json(getErrorMessage('\'amount\''));
		return;
	} else if (!bankTxId) {
		res.json(getErrorMessage('\'bankTxId\''));
		return;
	} else if (!proofDocName) {
		res.json(getErrorMessage('\'proofDocName\''));
		return;
	} else if (!proofDocHash) {
		res.json(getErrorMessage('\'proofDocHash\''));
		return;
	}

	var args = [amount, "corporate.csr.com", bankTxId, proofDocName, proofDocHash]
	//add current UTC date(in epoch milliseconds) to args
	args.push(Date.now().toString());
	args.push(uuid().toString())
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "requestTokens", args, req.username, req.orgname);
	res.send(message);
});

//****************************** AssignTokens *******************************

// Assign Token transaction on chaincode on target peers.
app.post('/assignTokens', async function (req, res) {
	logger.debug('==================== INVOKE ASSIGN TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var bankTxId = req.body.bankTxId;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!bankTxId) {
		res.json(getErrorMessage('\'bankTxId\''));
		return;
	}

	var args = [bankTxId]
	//add current UTC date(in epoch milliseconds) to args
	args.push(Date.now().toString());
	args.push(uuid().toString());
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "assignTokens", args, req.username, req.orgname);
	res.send(message);
});

//****************************** rejectTokens *******************************

// Assign Token transaction on chaincode on target peers.
app.post('/rejectTokens', async function (req, res) {
	logger.debug('==================== INVOKE rejectTokens TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var bankTxId = req.body.bankTxId;
	var comment = req.body.comment;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!bankTxId) {
		res.json(getErrorMessage('\'bankTxId\''));
		return;
	} else if (!comment) {
		res.json(getErrorMessage('\'comment\''));
		return;
	}

	var args = [bankTxId]
	args.push(comment)
	//add current UTC date(in epoch milliseconds) to args
	args.push(Date.now().toString());
	args.push(uuid().toString());
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "rejectTokens", args, req.username, req.orgname);
	res.send(message);
});

//****************************** Transfer Tokens *******************************

//tranfer token api
app.post('/transferTokens', async function (req, res) {
	logger.debug('==================== INVOKE TRANSFER TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var qty = req.body.qty.toString();
	var projectId = req.body.projectId;
	var phaseNumber = req.body.phaseNumber.toString();
	var reviewMsg = req.body.reviewMsg;
	var rating = req.body.rating.toString();

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!qty) {
		res.json(getErrorMessage('\'qty\''));
		return;
	} else if (!projectId) {
		res.json(getErrorMessage('\'projectId\''));
		return;
	} else if (!phaseNumber) {
		res.json(getErrorMessage('\'phaseNumber\''));
		return;
	} else if (!reviewMsg) {
		res.json(getErrorMessage('\'reviewMsg\''));
		return;
	} else if (!rating) {
		res.json(getErrorMessage('\'rating\''));
		return;
	}

	var args = [qty, projectId, phaseNumber, reviewMsg, rating, Date.now().toString(), uuid().toString(), uuid().toString()]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "transferTokens", args, req.username, req.orgname);

	//add contributor in mongoDB
	//assumption: mongo service is fail safe.
	projectService.addContributor(projectId, req.username)
		.then((data) => {
			res.send(message);
		})
		.catch(err => {
			logger.info(err);
			message['mongo'] = 'failed to add contributor in mongo';
			res.send(message);
		});
});

//****************************** Create Project *******************************

// Create Project transaction on chaincode on target peers.
app.post('/project/create', async function (req, res) {
	logger.debug('==================== INVOKE CREATE PROJECT ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//set extra attributes in request body.
	req.body["creationDate"] = Date.now();

	//modify all the criteria as per project object
	for (let i = 0; i < req.body.phases.length; i++) {
		let criteriaList = req.body.phases[i].validationCriteria;
		req.body.phases[i].validationCriteria = new Map();
		for (let j = 0; j < criteriaList.length; j++) {
			req.body.phases[i].validationCriteria[criteriaList[j]] = [];
		}
		logger.debug("criteria>>>>>>")
		logger.debug(req.body.phases[i].validationCriteria);
	}

	let projectId = uuid().toString()
	var args = [JSON.stringify(req.body), projectId, uuid().toString()];
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "createProject", args, req.username, req.orgname);
	message['projectId'] = projectId
	res.send(message);
});

//take a snapshot of all corporate balances on chaincode on target peers.
app.post('/snapshot/create', async function (req, res) {
	logger.debug('==================== INVOKE CREATE SNAPSHOT ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}

	var args = [Date.now().toString(), uuid().toString()];
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "snapshotCurrentCorporateBalances", args, req.username, req.orgname);
	res.send(message);
});

//take a snapshot of all corporate balances on chaincode on target peers.
app.post('/unspent/transfer', async function (req, res) {
	logger.debug('==================== INVOKE TRANSFER UNSPENT FUNDS TO GOVT ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	var govtAddress = req.body.govtAddress.toString();

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!govtAddress) {
		res.json(getErrorMessage('\'govtAddress\''));
		return;
	}

	var args = [govtAddress, Date.now().toString(), uuid().toString()];
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "transferUnspentTokensToGovt", args, req.username, req.orgname);
	res.send(message);
});

// Query on chaincode on target peers
app.get('/channels/:channelName/chaincodes/:chaincodeName', async function (req, res) {
	logger.debug('==================== QUERY BY CHAINCODE ==================');
	var channelName = req.params.channelName;
	var chaincodeName = req.params.chaincodeName;
	let args = req.query.args;
	let fcn = req.query.fcn;
	let peer = req.query.peer;

	logger.debug('channelName : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);
	logger.debug('fcn : ' + fcn);
	logger.debug('args : ' + args);

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	}
	if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	}
	if (!fcn) {
		res.json(getErrorMessage('\'fcn\''));
		return;
	}
	if (!args) {
		logger.debug("no args present!")
		res.json(getErrorMessage('\'args\''));
		return;
	}
	logger.debug(args)
	args = args.replace(/'/g, '"');
	logger.debug(args)
	args = JSON.parse(args);
	logger.debug(args);

	let message = await query.queryChaincode(peer, channelName, chaincodeName, args, fcn, req.username, req.orgname);
	message = message[0]
	var newObject = new Object()
	if (message.toString().includes("Error:")) {
		newObject.success = false
		newObject.message = message.toString().split("Error:")[1].trim()
		return res.send(newObject)
	}
	else {
		newObject = new Object()
		newObject = JSON.parse(message.toString())
		newObject.success = true
		return res.send(newObject)
	}
});

//****************************** RedeemRequest *******************************

app.post('/redeemRequest', async function (req, res) {
	logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var qty = req.body.qty;
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!qty) {
		res.json(getErrorMessage('\'quantity\''));
		return;
	}

	var args = [uuid().toString(), qty, Date.now().toString(), uuid().toString()]
	//add current UTC date(in epoch milliseconds) to args
	// args.push(Date.now().toString());
	// args.push(uuid().toString());
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "redeemRequest", args, req.username, req.orgname);
	res.send(message);
});

//****************************** Approve RedeemRequest *******************************

app.post('/approveRedeemRequest', async function (req, res) {
	logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var uid = req.body.id;
	var bankTxId = req.body.bankTxId;
	var proofDocName = req.body.proofDocName;
	var proofDocHash = req.body.proofDocHash;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!uid) {
		res.json(getErrorMessage('\'uid\''));
		return;
	}

	var args = [uid, bankTxId, Date.now().toString(), uuid().toString(), proofDocName, proofDocHash]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "approveRedeemRequest", args, req.username, req.orgname);
	res.send(message);
});

//****************************** ReserveFunds *******************************

app.post('/reserveFunds', async function (req, res) {
	logger.debug('==================== INVOKE RESERVE FUNDS TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var id = req.body.projectId;
	var qty = req.body.qty;
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!qty) {
		res.json(getErrorMessage('\'quantity\''));
		return;
	} else if (!id) {
		res.json(getErrorMessage('\'projectID\''));
		return;
	}

	var currentdate = new Date(Date.now())
	var date = new Date("July 21, 2019 00:00:00")
	date.setFullYear(currentdate.getFullYear() + 3, 3, 30)
	date.setHours(0, 0, 0)

	var args = [id, qty, Date.now().toString(), uuid().toString(), date.valueOf().toString()]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "reserveFundsForProject", args, req.username, req.orgname);
	res.send(message);
});

//****************************** ReleaseFunds *******************************

app.post('/releaseFunds', async function (req, res) {
	logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var id = req.body.projectId;
	var qty = req.body.qty;
	var rating = req.body.rating;
	var reviewMsg = req.body.messsage;
	var phaseNumber = req.body.Phasenumber;
	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!qty) {
		res.json(getErrorMessage('\'quantity\''));
		return;
	} else if (!id) {
		res.json(getErrorMessage('\'projectID\''));
		return;
	}

	var args = [id, qty, Date.now().toString(), uuid().toString(), rating, reviewMsg, phaseNumber]
	//add current UTC date(in epoch milliseconds) to args
	// args.push(Date.now().toString());
	// args.push(uuid().toString());
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "releaseFundsForProject", args, req.username, req.orgname);

	//add contributor in mongoDB
	//assumption: mongo service is fail safe.
	projectService.addContributor(id, req.username)
		.then((data) => {
			res.send(message);
		})
		.catch(err => {
			logger.info(err);
			message['mongo'] = 'failed to add contributor in mongo';
			res.send(message);
		});
});

//****************************** Update Project *******************************
app.post('/updateProject', async function (req, res) {
	logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var projectId = req.body.projectId;
	var phaseNumber = req.body.phaseNumber;
	var status = req.body.status;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!projectId) {
		res.json(getErrorMessage('\'projectId\''));
		return;
	} else if (!phaseNumber) {
		res.json(getErrorMessage('\'phaseNumber\''));
		return;
	} else if (!status) {
		res.json(getErrorMessage('\'status\''));
		return;
	}

	var args = [projectId, phaseNumber, status, Date.now().toString(), uuid().toString()]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "updateProject", args, req.username, req.orgname);
	res.send(message);
});

//****************************** validate a phase of a project
app.post('/validatePhase', async function (req, res) {
	logger.debug('==================== INVOKE VALIDATE PHASE TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var projectId = req.body.projectId;
	var phaseNumber = req.body.phaseNumber;
	var validated = req.body.validated;
	var rejectionComment = req.body.rejectionComment;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!projectId) {
		res.json(getErrorMessage('\'projectId\''));
		return;
	} else if (!phaseNumber) {
		res.json(getErrorMessage('\'phaseNumber\''));
		return;
	} else if (!validated) {
		res.json(getErrorMessage('\'validated\''));
		return;
	}

	var args = [projectId, phaseNumber, validated, rejectionComment, Date.now().toString(), uuid().toString()]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "validatePhase", args, req.username, req.orgname);
	res.send(message);
});

//****************************** add a document hash against a criterion
app.post('/addDocumentHash', async function (req, res) {
	logger.debug('==================== INVOKE ADD DOCUMENT HASH TOKEN ON CHAINCODE ==================');
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
	var chaincodeName = req.header('chaincodeName');
	var channelName = req.header('channelName');
	logger.debug('channelName  : ' + channelName);
	logger.debug('chaincodeName : ' + chaincodeName);

	//extract parameters from request body.
	var projectId = req.body.projectId;
	var phaseNumber = req.body.phaseNumber;
	var criterion = req.body.criterion;
	var docHash = req.body.docHash;
	var docName = req.body.docName;

	if (!chaincodeName) {
		res.json(getErrorMessage('\'chaincodeName\''));
		return;
	} else if (!channelName) {
		res.json(getErrorMessage('\'channelName\''));
		return;
	} else if (!projectId) {
		res.json(getErrorMessage('\'projectId\''));
		return;
	} else if (!phaseNumber) {
		res.json(getErrorMessage('\'phaseNumber\''));
		return;
	} else if (!criterion) {
		res.json(getErrorMessage('\'criterion\''));
		return;
	} else if (!docHash) {
		res.json(getErrorMessage('\'docHash\''));
		return;
	} else if (!docName) {
		res.json(getErrorMessage('\'docName\''));
		return;
	}

	var args = [projectId, phaseNumber, criterion, docHash, docName, Date.now().toString(), uuid().toString()]
	logger.debug('args  : ' + args);

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "addDocumentHash", args, req.username, req.orgname);
	res.send(message);
});

// Save IT data transaction on chaincode on target peers.
app.post('/addCorporatePan', async function (req, res) {
	logger.debug('==================== INVOKE ADD CORPORATE PAN ON CHAINCODE ==================')
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
	var chaincodeName = req.header('chaincodeName')
	var channelName = req.header('channelName')
	logger.debug('channelName  : ' + channelName)
	logger.debug('chaincodeName : ' + chaincodeName)

	var corporateName = req.body.corporateName
	var panNumber = req.body.panNumber
	var args = [panNumber, corporateName]
	logger.debug('args: ' + args)

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "addCorporatePan", args, req.username, req.orgname)
	res.send(message)
});

// Save IT data transaction on chaincode on target peers.
app.post('/saveItData', async function (req, res) {
	logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
	var chaincodeName = req.header('chaincodeName')
	var channelName = req.header('channelName')
	logger.debug('channelName  : ' + channelName)
	logger.debug('chaincodeName : ' + chaincodeName)

	var year = req.query.year

	for (let i = 0; i < req.body.length; i++) {
		req.body[i].objectType = "Liability"
	}

	var args = [year, JSON.stringify(req.body)]
	logger.debug('args: ' + args)

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "saveItData", args, req.username, req.orgname)
	res.send(message)
});

async function saveITData(req, res, data) {
	logger.debug('==================== INVOKE SAVE IT DATA ON CHAINCODE ==================')
	var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"]
	var chaincodeName = req.header('chaincodeName')
	var channelName = req.header('channelName')
	logger.debug('channelName  : ' + channelName)
	logger.debug('chaincodeName : ' + chaincodeName)

	var year = req.body.year

	for (let i = 0; i < data; i++) {
		req.body[i].objectType = "Liability"
	}

	var args = [year, JSON.stringify(data)]
	logger.debug('args: ' + args)

	let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "saveItData", args, req.username, req.orgname)
	res.send(message)
}

//excel upload
app.post('/uploadexcel', (req, res) => {
	logger.debug('==================== upload excel ==================');
	let wb = XLSX.read(req.body.fileData, { type: 'binary' });
	let sheet = wb.SheetNames[0];
	let rows = XLSX.utils.sheet_to_json(wb.Sheets[sheet]);
	// console.log(rows)
	let temp = Object.keys(rows[0])
	if (!(temp.includes('panNumber') && temp.includes('corporateName') && temp.includes('totalLiability'))) {
		res.send({ success: false, message: 'Column names should be corporateName, panNumber and totalLiability.' })
	}
	else saveITData(req, res, rows)
})

//  Query Get Block by BlockNumber
app.get('/channels/:channelName/blocks/:blockId', async function (req, res) {
	logger.debug('==================== GET BLOCK BY NUMBER ==================');
	let blockId = req.params.blockId;
	let peer = req.query.peer;
	logger.debug('channelName : ' + req.params.channelName);
	logger.debug('BlockID : ' + blockId);
	logger.debug('Peer : ' + peer);
	if (!blockId) {
		res.json(getErrorMessage('\'blockId\''));
		return;
	}

	let message = await query.getBlockByNumber(peer, req.params.channelName, blockId, req.username, req.orgname);
	res.send(message);
});


// Query Get Transaction by Transaction ID
app.get('/channels/:channelName/transactions/:trxnId', async function (req, res) {
	logger.debug('================ GET TRANSACTION BY TRANSACTION_ID ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let trxnId = req.params.trxnId;
	let peer = req.query.peer;
	if (!trxnId) {
		res.json(getErrorMessage('\'trxnId\''));
		return;
	}

	let message = await query.getTransactionByID(peer, req.params.channelName, trxnId, req.username, req.orgname);
	res.send(message);
});

// Query Get Block by Hash
app.get('/channels/:channelName/blocks', async function (req, res) {
	logger.debug('================ GET BLOCK BY HASH ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let hash = req.query.hash;
	let peer = req.query.peer;
	if (!hash) {
		res.json(getErrorMessage('\'hash\''));
		return;
	}

	let message = await query.getBlockByHash(peer, req.params.channelName, hash, req.username, req.orgname);
	res.send(message);
});

//Query for Channel Information
app.get('/channels/:channelName', async function (req, res) {
	logger.debug('================ GET CHANNEL INFORMATION ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getChainInfo(peer, req.params.channelName, req.username, req.orgname);
	res.send(message);
});

//Query for Channel instantiated chaincodes
app.get('/channels/:channelName/chaincodes', async function (req, res) {
	logger.debug('================ GET INSTANTIATED CHAINCODES ======================');
	logger.debug('channelName : ' + req.params.channelName);
	let peer = req.query.peer;

	let message = await query.getInstalledChaincodes(peer, req.params.channelName, 'instantiated', req.username, req.orgname);
	res.send(message);
});

// Query to fetch all Installed/instantiated chaincodes
app.get('/chaincodes', async function (req, res) {
	var peer = req.query.peer;
	var installType = req.query.type;
	logger.debug('================ GET INSTALLED CHAINCODES ======================');

	let message = await query.getInstalledChaincodes(peer, null, 'installed', req.username, req.orgname)
	res.send(message);
});

// Query to fetch channels
app.get('/channels', async function (req, res) {
	logger.debug('================ GET CHANNELS ======================');
	logger.debug('peer: ' + req.query.peer);
	var peer = req.query.peer;
	if (!peer) {
		res.json(getErrorMessage('\'peer\''));
		return;
	}

	let message = await query.getChannels(peer, req.username, req.orgname);
	res.send(message);
});
