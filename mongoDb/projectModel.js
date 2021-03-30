// // upload Balance Sheet for corporate
// projectDB.uploadBalanceSheet = (userName, file) => {
//     // console.log('model-uploadBalanceSheet');
//     // return connection.orgCollection().then(collection => {
//     let collection = connection.orgCollection()
//     return collection.updateOne({ userName: userName, role: 'Corporate' }, { $push: { file: file } }).then(data => {
//         // Mongoose.connection.close()
//         if (data) {
//             return data
//         } else {
//             return null
//         }
//     })
//     // })
// }

// module.exports = projectDB;
