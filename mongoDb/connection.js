const { Schema } = require("mongoose");
const Mongoose = require("mongoose")
Mongoose.Promise = global.Promise;
const url = "mongodb://localhost:27017/CSR";

let options = {
    useUnifiedTopology: true,
    useNewUrlParser: true
    // socketTimeoutMS: 10000
}
var notificationModel;
var projectModel;
var txDescriptionModel;
var orgModel;

setInterval(connectFunction, 30000)

function connectFunction() {
    Mongoose.connect(url, options).then((database) => {
        notificationModel = Mongoose.model('Notification', notificationSchema)
        projectModel = Mongoose.model('Project', projectSchema)
        txDescriptionModel = Mongoose.model('TxDescription', txDescriptionSchema)
        orgModel = Mongoose.model('OrganisationProfile', orgSchema)
    }).catch(() => {
        
    })
}

let phaseSchema = Schema({
    phaseName: String,
    description: String,
})

let projectSchema = Schema({
    projectId: String,
    projectName: String,
    projectType: String,
    contributorsList: [String],
    ngo: String,
    place: String,
    description: String,
    images: [String],
    phases: [phaseSchema]
}, { collection: "Project" })

let addressSchema = Schema({
    doorNo: String,
    flat: String,
    street: String,
    pinCode: String,
    zipCode: String,
    country: String,
    state: String,
    district: String,
    locality: String
})

let contactSchema = Schema({
    name: String,
    number: String
})

let fileSchema = Schema({
    currency: String,
    amount: String,
    fileHash: String,
    fileName: String,
    year: String
})

let orgSchema = Schema({
    name: String,
    role: String,
    date: Number,
    status: String,
    description: String,
    pan: String,
    email: [String],
    regId: String,
    address: addressSchema,
    contact: [contactSchema],
    file: [fileSchema]
}, { collection: "OrganisationProfile" })

let notificationSchema = Schema({
    username: String,
    txId: String,
    description: String,
    seen: Boolean
}, { collection: "Notification" })

let txDescriptionSchema = Schema({
    txId: String,
    description: String,
}, { collection: "TxDescription" })

let collection = {};

collection.projectCollection = () => {
    // return Mongoose.connect(url, options).then((database) => {
    //     return database.model('Project', projectSchema)
    // }).catch(() => {
    //     let err = new Error("Could not connect to Database");
    //     err.status = 500;
    //     throw err;
    // })

    return projectModel
}

collection.orgCollection = () => {
    // return Mongoose.connect(url, options).then((database) => {
    //     return database.model('OrganisationProfile', orgSchema)
    // }).catch(() => {
    //     let err = new Error("Could not connect to Database");
    //     err.status = 500;
    //     throw err;
    // })
    return orgModel;
}

collection.notificationCollection = () => {
    // return Mongoose.connect(url, options).then((database) => {
    //     return database.model('Notification', notificationSchema)
    // }).catch(() => {
    //     let err = new Error("Could not connect to Database");
    //     err.status = 500;
    //     throw err;
    // })
    return notificationModel;
}

collection.txDescriptionCollection = () => {
    // return Mongoose.connect(url, options).then((database) => {
    //     return database.model('TxDescription', txDescriptionSchema)
    // }).catch(() => {
    //     let err = new Error("Could not connect to Database");
    //     err.status = 500;
    //     throw err;
    // })
    return txDescriptionModel;
}

module.exports = collection;
