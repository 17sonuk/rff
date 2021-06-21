// const bcrypt = require("bcrypt");

const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: { type: String, maxLength: 50 },
    description: { type: String, maxLength: 200 },
})

const communitySchema = new Schema({
    name: { type: String, maxLength: 50 },
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
    phases: { type: [phaseSchema], validate: [phaseLimit, 'Number of phases should be greater than or equal to 1'] },
    communities: { type: [String] }

}, { collection: "Project" })

function imageLimit(val) {
    return val.length <= 3;
}

function phaseLimit(val) {
    return val.length >= 1;
}

const addressSchema = new Schema({
    addressLine1: { type: String, maxLength: 100 },
    addressLine2: { type: String, maxLength: 100 },
    city: { type: String, maxLength: 30 },
    state: { type: String, maxLength: 30 },
    zipCode: { type: String, maxLength: 10 },
    country: { type: String, maxLength: 30 }

    // doorNo: { type: String, maxLength: 20 },
    // flat: { type: String, maxLength: 20 },
    // district: { type: String, maxLength: 20 },
    // locality: { type: String, maxLength: 20 }
})

// const contactSchema = new Schema({
//     name: { type: String, maxLength: 50 },
//     number: String
// })

const fileSchema = new Schema({
    currency: String,
    amount: String,
    fileHash: String,
    fileName: String,
    year: String
})

const phoneSchema = new Schema({
    countryCode: { type: String, maxLength: 4 },
    phoneNumber: { type: String, maxLength: 10 }
})

//to store user data
const orgSchema = new Schema({
    firstName: { type: String, required: true, maxLength: 50 },
    lastName: { type: String, required: true, maxLength: 50 },
    orgName: { type: String, maxLength: 50 },
    userName: { type: String, required: true, unique: true, maxLength: 50 },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true, enum: ['Ngo', 'Corporate'] },
    subRole: { type: String, enum: ['Institution', 'Individual'] },
    status: { type: String, required: true, enum: ['created', 'approved', 'rejected'] },
    description: { type: String, maxLength: 200 },
    address: addressSchema,
    website: { type: String, maxLength: 50 },
    phone: [phoneSchema]
    // date: { type: Number, min: 1 },
    //regId: { type: String, maxLength: 100 },
    //pan: { type: String, required: false },
    //contact: [contactSchema]
}, { collection: "OrganisationProfile" })

orgSchema.pre('validate', function (next) {

    if (this.role === 'Corporate') {
        if (!this.subRole) {
            next(new Error('Donor type is missing/invalid!'));
        } else if (this.subRole === 'Institution' && !this.orgName) {
            next(new Error('Company/Foundation/Fund Name is missing/invalid!'));
        }
    }
    next();
});

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
    'fileModel': models['File'] || model('File', fileDataSchema),
    'communityModel': models['Community'] || model('Community', communitySchema)
};