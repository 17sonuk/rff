// const bcrypt = require("bcrypt");

const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: { type: String, maxLength: 50 },
    description: { type: String, maxLength: 200 },
})

const projectSchema = new Schema({
    projectId: { type: String, required: true, unique: true },
    projectName: { type: String, required: true, maxLength: 50 },
    projectType: { type: String, required: true, maxLength: 50 },
    contributorsList: [String],
    ngo: { type: String, required: true },
    place: { type: String, maxLength: 50 },
    description: { type: String, maxLength: 500 },
    images: { type: [String], validate: [imageLimit, 'max 3 images allowed!'] },
    phases: { type: [phaseSchema], validate: [phaseLimit, 'Number of phases should be greater than or equal to 1'] }

}, { collection: "Project" })

function imageLimit(val) {
    return val.length <= 3;
}

function phaseLimit(val) {
    return val.length >= 1;
}

const addressSchema = new Schema({
    doorNo: { type: String, maxLength: 20 },
    flat: { type: String, maxLength: 20 },
    street: { type: String, maxLength: 20 },
    pinCode: { type: String, maxLength: 20 },
    country: { type: String, maxLength: 20 },
    state: { type: String, maxLength: 20 },
    district: { type: String, maxLength: 20 },
    locality: { type: String, maxLength: 20 }
})

const contactSchema = new Schema({
    name: { type: String, maxLength: 50 },
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
    name: { type: String, required: true, maxLength: 50 },
    userName: { type: String, required: true, unique: true, maxLength: 50 },
    role: { type: String, required: true, enum: ['Ngo', 'Corporate'] },
    date: { type: Number, min: 1 },
    status: { type: String, required: true, enum: ['created', 'approved', 'rejected'] },
    description: { type: String, maxLength: 100 },
    pan: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    regId: { type: String, maxLength: 100 },
    address: addressSchema,
    contact: [contactSchema]
}, { collection: "OrganisationProfile" })

const notificationSchema = new Schema({
    username: { type: String, required: true, maxLength: 50 },
    txId: String,
    description: { type: String, maxLength: 100 },
    seen: Boolean
}, { collection: "Notification", timestamps: true })

notificationSchema.index({ username: 1, txId: 1 }, { unique: true })

const txDescriptionSchema = new Schema({
    txId: { type: String, required: true, unique: true },
    description: { type: String, required: true, maxLength: 100 },
}, { collection: "TxDescription", timestamps: true })

const fileDataSchema = new Schema({
    fileName: { type: String, required: true, maxLength: 100 },
    fileHash: { type: String, required: true },
    fileSize: { type: String, required: true },
    fileData: { type: String, required: true },
}, { collection: "File", timestamps: true })


module.exports = {
    'notificationModel': models['Notification'] || model('Notification', notificationSchema),
    'orgModel': models['OrganisationProfile'] || model('OrganisationProfile', orgSchema),
    'projectModel': models['Project'] || model('Project', projectSchema),
    'txDescriptionModel': models['TxDescription'] || model('TxDescription', txDescriptionSchema),
    'fileModel': models['File'] || model('File', fileDataSchema)
};