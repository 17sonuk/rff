// const bcrypt = require("bcrypt");

const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: String,
    description: String,
})

const projectSchema = new Schema({
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

const addressSchema = new Schema({
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

const contactSchema = new Schema({
    name: String,
    number: String
})

const fileSchema = new Schema({
    currency: String,
    amount: String,
    fileHash: String,
    fileName: String,
    year: String
})

const orgSchema = new Schema({
    name: { type: String, required: true },
    userName: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    date: Number,
    status: String,
    description: String,
    pan: { type: String, required: false },
    email: [String],
    regId: String,
    address: addressSchema,
    contact: [contactSchema],
    file: [fileSchema]
}, { collection: "OrganisationProfile" })

//to hash the password before saving to mongodb.
// orgSchema.pre('save', (next) => {
//     this.password = bcrypt.hashSync(this.password, 10);
//     next();
// });

const notificationSchema = new Schema({
    username: String,
    txId: String,
    description: String,
    seen: Boolean
}, { collection: "Notification" })

const txDescriptionSchema = new Schema({
    txId: String,
    description: String,
}, { collection: "TxDescription" })

module.exports = {
    'notificationModel': models['Notification'] || model('Notification', notificationSchema),
    'orgModel': models['OrganisationProfile'] || model('OrganisationProfile', orgSchema),
    'projectModel': models['Project'] || model('Project', projectSchema),
    'txDescriptionModel': models['TxDescription'] || model('TxDescription', txDescriptionSchema)
};