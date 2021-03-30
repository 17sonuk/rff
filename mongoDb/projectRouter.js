



// // upload Balance sheet
// router.post('/uploadBalanceSheet', (req, res, next) => {
//     console.log("router-uploadBalanceSheet", req.body);
//     projectService.uploadBalanceSheet(req.body.file)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })

// //get profit amount of corporate for Current financial year
// router.post('/getProfitCorporate', (req, res, next) => {
//     console.log("router-getProfitCorporate", req.body);
//     projectService.getAmountFromBalanceSheet(req.body.userName)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })



// module.exports = router;