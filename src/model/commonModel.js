const collection = require("./connection").orgCollection();

const commonModel = {}

console.log('<<<<<<<<<<<<<< common model >>>>>>>>>>>>>>>>>');

// upload Balance Sheet for corporate
commonModel.uploadBalanceSheet = (userName, file) => {
    // console.log('model-uploadBalanceSheet');
    // return connection.orgCollection().then(collection => {
    return collection.updateOne({ userName: userName, role: 'Corporate' }, { $push: { file: file } }).then(data => {
        // Mongoose.connection.close()
        if (data) {
            return data
        } else {
            return null
        }
    })
    // })
}

module.exports = commonModel;