// const bcrypt = require("bcrypt");
// const { Schema } = require("mongoose");
// const Mongoose = require("mongoose")
// require('dotenv').config();

// const dbHost = process.env.DB_HOST;
// const dbPort = process.env.DB_PORT;
// const dbName = process.env.DB_NAME;

// Mongoose.Promise = global.Promise;
// // const url = "mongodb://testUser:test%40123@localhost:27018/csr";
// // const url = "mongodb://localhost:27017/CSR";
// const url = "mongodb://" + dbHost + ":" + dbPort + "/" + dbName;
// // console.log('db url:' + url);
// console.log('<<<<<<<<<<<<<< connection >>>>>>>>>>>>>>>>>')

// let options = {
//     useUnifiedTopology: true,
//     useNewUrlParser: true
//     // socketTimeoutMS: 10000
// }
// var notificationModel;
// var projectModel;
// var txDescriptionModel;
// var orgModel;

// // Mongoose.connect('mongodb://testUser:test%40123@localhost:27018/csr', {useNewUrlParser: true, useUnifiedTopology: true});
// // var db = Mongoose.connection;
// // db.on('error', console.error.bind(console, 'connection error:'));
// // db.once('open', function() {
// //     // we're connected!
// //     console.log('Connection established...');
// //     //notificationModel = Mongoose.model('Notification', notificationSchema)
// //     //projectModel = Mongoose.model('Project', projectSchema)
// //     //txDescriptionModel = Mongoose.model('TxDescription', txDescriptionSchema)
// //     //orgModel = Mongoose.model('OrganisationProfile', orgSchema)
// // });

// //latest working connection
// setInterval(connectFunction, 30000)
// function connectFunction() {
//     Mongoose.connect(url, options)
//         .then((database) => {
//             notificationModel = Mongoose.model('Notification', notificationSchema)
//             projectModel = Mongoose.model('Project', projectSchema)
//             txDescriptionModel = Mongoose.model('TxDescription', txDescriptionSchema)
//             orgModel = Mongoose.model('OrganisationProfile', orgSchema)
//         }).catch(() => {

//         })
// }

// let phaseSchema = Schema({
//     phaseName: String,
//     description: String,
// })

// let projectSchema = Schema({
//     projectId: String,
//     projectName: String,
//     projectType: String,
//     contributorsList: [String],
//     ngo: String,
//     place: String,
//     description: String,
//     images: [String],
//     phases: [phaseSchema]
// }, { collection: "Project" })

// let addressSchema = Schema({
//     doorNo: String,
//     flat: String,
//     street: String,
//     pinCode: String,
//     zipCode: String,
//     country: String,
//     state: String,
//     district: String,
//     locality: String
// })

// let contactSchema = Schema({
//     name: String,
//     number: String
// })

// let fileSchema = Schema({
//     currency: String,
//     amount: String,
//     fileHash: String,
//     fileName: String,
//     year: String
// })

// let orgSchema = Schema({
//     name: { type: String, required: true },
//     userName: { type: String, required: true },
//     password: { type: String, required: true },
//     role: { type: String, required: true },
//     date: Number,
//     status: String,
//     description: String,
//     pan: { type: String, required: false },
//     email: [String],
//     regId: String,
//     address: addressSchema,
//     contact: [contactSchema],
//     file: [fileSchema]
// }, { collection: "OrganisationProfile" })

// //to hash the password before saving to mongodb.
// orgSchema.pre('save', async function (next) {
//     this.password = bcrypt.hashSync(this.password, 10);
//     //console.log('hashed password: ' + this.password);
// });

// let notificationSchema = Schema({
//     username: String,
//     txId: String,
//     description: String,
//     seen: Boolean
// }, { collection: "Notification" })

// let txDescriptionSchema = Schema({
//     txId: String,
//     description: String,
// }, { collection: "TxDescription" })

// //another way to connect to mongo
// // Mongoose.connect(url, options)
// //     .catch((error) => {
// //         let err = new Error("Could not connect to Database")
// //         err.status = 500;
// //         throw err;
// //     })


// notificationModel = Mongoose.model('Notification', notificationSchema)
// projectModel = Mongoose.model('Project', projectSchema)
// txDescriptionModel = Mongoose.model('TxDescription', txDescriptionSchema)
// orgModel = Mongoose.model('OrganisationProfile', orgSchema)


// let collection = {};

// collection.projectCollection = () => {
//     return projectModel
// }

// collection.orgCollection = () => {
//     return orgModel;
// }

// collection.notificationCollection = () => {
//     return notificationModel;
// }

// collection.txDescriptionCollection = () => {
//     return txDescriptionModel;
// }

// module.exports = collection;
