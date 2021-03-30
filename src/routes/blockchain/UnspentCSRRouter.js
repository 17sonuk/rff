// //****************************** ReserveFunds *******************************
// app.post('/reserveFunds', async function (req, res) {
//     logger.debug('==================== INVOKE RESERVE FUNDS TOKEN ON CHAINCODE ==================');
//     var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
//     var chaincodeName = req.header('chaincodeName');
//     var channelName = req.header('channelName');
//     logger.debug('channelName  : ' + channelName);
//     logger.debug('chaincodeName : ' + chaincodeName);

//     //extract parameters from request body.
//     var id = req.body.projectId;
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
//     } else if (!id) {
//         res.json(getErrorMessage('\'projectID\''));
//         return;
//     }

//     var currentdate = new Date(Date.now())
//     var date = new Date("July 21, 2019 00:00:00")
//     date.setFullYear(currentdate.getFullYear() + 3, 3, 30)
//     date.setHours(0, 0, 0)

//     var args = [id, qty, Date.now().toString(), uuid().toString(), date.valueOf().toString()]
//     logger.debug('args  : ' + args);

//     let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "reserveFundsForProject", args, req.username, req.orgname);
//     res.send(message);
// });

// //****************************** ReleaseFunds *******************************
// app.post('/releaseFunds', async function (req, res) {
//     logger.debug('==================== INVOKE RELEASE FUNDS TOKEN ON CHAINCODE ==================');
//     var peers = ["peer0.corporate.csr.com", "peer0.creditsauthority.csr.com", "peer0.ngo.csr.com"];
//     var chaincodeName = req.header('chaincodeName');
//     var channelName = req.header('channelName');
//     logger.debug('channelName  : ' + channelName);
//     logger.debug('chaincodeName : ' + chaincodeName);

//     //extract parameters from request body.
//     var id = req.body.projectId;
//     var qty = req.body.qty;
//     var rating = req.body.rating;
//     var reviewMsg = req.body.messsage;
//     var phaseNumber = req.body.Phasenumber;
//     if (!chaincodeName) {
//         res.json(getErrorMessage('\'chaincodeName\''));
//         return;
//     } else if (!channelName) {
//         res.json(getErrorMessage('\'channelName\''));
//         return;
//     } else if (!qty) {
//         res.json(getErrorMessage('\'quantity\''));
//         return;
//     } else if (!id) {
//         res.json(getErrorMessage('\'projectID\''));
//         return;
//     }

//     var args = [id, qty, Date.now().toString(), uuid().toString(), rating, reviewMsg, phaseNumber]
//     //add current UTC date(in epoch milliseconds) to args
//     // args.push(Date.now().toString());
//     // args.push(uuid().toString());
//     logger.debug('args  : ' + args);

//     let message = await invoke.invokeChaincode(peers, channelName, chaincodeName, "releaseFundsForProject", args, req.username, req.orgname);

//     //add contributor in mongoDB
//     //assumption: mongo service is fail safe.
//     projectService.addContributor(id, req.username)
//         .then((data) => {
//             res.send(message);
//         })
//         .catch(err => {
//             logger.info(err);
//             message['mongo'] = 'failed to add contributor in mongo';
//             res.send(message);
//         });
// });