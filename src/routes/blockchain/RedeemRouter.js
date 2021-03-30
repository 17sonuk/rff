// //****************************** RedeemRequest *******************************

// app.post('/redeemRequest', async function (req, res) {
//     logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
//     var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
//     var chaincodeName = req.header('chaincodeName');
//     var channelName = req.header('channelName');
//     logger.debug('channelName  : ' + channelName);
//     logger.debug('chaincodeName : ' + chaincodeName);

//     //extract parameters from request body.
//     var qty = req.body.qty;
//     if (!chaincodeName) {
//         res.json(getErrorMessage('\'chaincodeName\''));
//         return;
//     } else if (!channelName) {
//         res.json(getErrorMessage('\'channelName\''));
//         return;
//     } else if (!qty) {
//         res.json(getErrorMessage('\'quantity\''));
//         return;
//     }

//     var args = [uuid().toString(), qty, Date.now().toString(), uuid().toString()]
//     //add current UTC date(in epoch milliseconds) to args
//     // args.push(Date.now().toString());
//     // args.push(uuid().toString());
//     logger.debug('args  : ' + args);

//     let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "redeemRequest", args, req.username, req.orgname);
//     res.send(message);
// });

// //****************************** Approve RedeemRequest *******************************

// app.post('/approveRedeemRequest', async function (req, res) {
//     logger.debug('==================== INVOKE REDEEM TOKEN ON CHAINCODE ==================');
//     var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
//     var chaincodeName = req.header('chaincodeName');
//     var channelName = req.header('channelName');
//     logger.debug('channelName  : ' + channelName);
//     logger.debug('chaincodeName : ' + chaincodeName);

//     //extract parameters from request body.
//     var uid = req.body.id;
//     var bankTxId = req.body.bankTxId;
//     var proofDocName = req.body.proofDocName;
//     var proofDocHash = req.body.proofDocHash;

//     if (!chaincodeName) {
//         res.json(getErrorMessage('\'chaincodeName\''));
//         return;
//     } else if (!channelName) {
//         res.json(getErrorMessage('\'channelName\''));
//         return;
//     } else if (!uid) {
//         res.json(getErrorMessage('\'uid\''));
//         return;
//     }

//     var args = [uid, bankTxId, Date.now().toString(), uuid().toString(), proofDocName, proofDocHash]
//     logger.debug('args  : ' + args);

//     let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "approveRedeemRequest", args, req.username, req.orgname);
//     res.send(message);
// });
