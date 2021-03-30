'use strict';
var log4js = require('log4js');
var logger = log4js.getLogger('SampleWebApp');
var express = require('express');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var http = require('http');
var util = require('util');
var app = express();
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var bearerToken = require('express-bearer-token');
var cors = require('cors');
const uuid = require('uuid');
const XLSX = require('xlsx');
const getErrorMessage = require('./src/utils/ErrorMsg');

//mongo service
const userService = require('./src/service/UserService');

//new mongo routes
const userMongoRouter = require('./src/routes/mongo/UserRouter');
const projectMongoRouter = require('./src/routes/mongo/ProjectRouter');

//blockchain routes
const projectRouter = require('./src/routes/blockchain/ProjectRouter');
// const pspRouter = require('./src/routes/blockchain/PSPRouter');
// const queryRouter = require('./src/routes/blockchain/QueryRouter');
// const redeemRouter = require('./src/routes/blockchain/RedeemRouter');
// const reportRouter = require('./src/routes/blockchain/ReportRouter');
// const tokenRouter = require('./src/routes/blockchain/TokenRouter');
// const unspentCSRRouter = require('./src/routes/blockchain/UnspentCSRRouter');
// const utilsRouter = require('./src/routes/blockchain/UtilsRouter');

require('./config.js');
var hfc = require('fabric-client');

var helper = require('./app/helper.js');
var invoke = require('./app/invoke-transaction.js');
var query = require('./app/query.js');
var host = process.env.HOST || hfc.getConfigSetting('host');
var port = process.env.PORT || hfc.getConfigSetting('port');

app.options('*', cors());
app.use(cors());
//support parsing of application/json type post data
app.use(express.json({ limit: '20mb' }));
//support parsing of application/x-www-form-urlencoded post data
app.use(express.urlencoded({
	extended: false
}));

// set secret variable
app.set('secret', 'thisismysecret');
app.use(expressJWT({
	secret: 'thisismysecret'
}).unless({
	path: ['/users', '/mongo/user/onboard', '/mongo/user/login']
}));
app.use(bearerToken());
app.use(function (req, res, next) {
	logger.debug(' ------>>>>>> new request for %s', req.originalUrl);
	if (req.originalUrl.indexOf('/users') >= 0 || req.originalUrl.indexOf('/mongo/user/onboard') >= 0 || req.originalUrl.indexOf('/mongo/user/login') >= 0) {
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

//mongo URLs
app.use('/mongo/user', userMongoRouter);
app.use('/mongo/project', projectMongoRouter);

//blockchain URLs
app.use('/project', projectRouter);
// app.use('/psp', pspRouter);
// app.use('/query', queryRouter);
// app.use('/redeem', redeemRouter);
// app.use('/report', reportRouter);
// app.use('/token', tokenRouter);
// app.use('/unspentCSR', tokenRouter);
// app.use('/utils', utilsRouter);

var server = http.createServer(app).listen(port, function () { });
logger.info('****************** SERVER STARTED ************************');
logger.info('***************  http://%s:%s  ******************', host, port);
server.timeout = 240000;

app.post('/users', async function (req, res) {
	var username = req.body.userName;
	var password = req.body.password;
	logger.debug('End point : /users');
	logger.debug('User name : ' + username);

	if (!username) {
		res.json(getErrorMessage('\'username\''));
		return;
	}
	if (!password) {
		res.json(getErrorMessage('\'password\''));
		return;
	}

	//calling mongo login for password authentication
	let mongoResponse = {};
	let orgName;
	if (username.length < 4 && (username.startsWith('ca2') || username.startsWith('it'))) {
		if (password === 'test') {
			mongoResponse = { success: true, message: 'login successful', role: "CreditsAuthority" };
			orgName = 'CreditsAuthority';
		} else {
			logger.debug('Authentication failed for the username %s', username);
			res.json({ success: false, message: 'wrong credentials!' });
			return;
		}
	} else {
		mongoResponse = await userService.login(username, password);
		if (mongoResponse.success === false) {
			logger.debug('Authentication failed for the username %s', username);
			res.json({ success: false, message: mongoResponse.message });
			return;
		} else {
			orgName = mongoResponse.role;
		}
	}
	//mongo authentication ends

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
		response.role = mongoResponse.role;
		response.name = mongoResponse.name;
		res.json(response);
	} else {
		logger.debug('Failed to register the username %s for organization %s with::%s', username, orgName, response);
		res.json({ success: false, message: response });
	}
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
});
