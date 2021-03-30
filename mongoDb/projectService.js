// let projectService = {}

// // upload Balance sheet:
// projectService.uploadBalanceSheet = (file) => {
//     return projectModel.uploadBalanceSheet(file).then(data => {
//         if (data) return { success: true, message: 'balance Sheet uploaded successfully' }
//         else return { success: false, message: 'Error in uploading the balance sheet' }
//     })
// }



// //Create notification
// projectService.createNotification = (project) => {
//     return projectModel.createNotification(project).then(notificationData => {
//         if (notificationData) {
//             return { success: true, message: 'notification created in db' };
//         } else {
//             let err = new Error("Bad Connection")
//             err.status = 500
//             throw err
//         }
//     })
// }

// //Create tx description
// projectService.createTxDescription = (project) => {
//     return projectModel.createTxDescription(project).then(txDescriptionData => {
//         if (txDescriptionData) {
//             return { success: true, message: 'tx description created in db' };
//         } else {
//             let err = new Error("Bad Connection")
//             err.status = 500
//             throw err
//         }
//     })
// }

// module.exports = projectService
