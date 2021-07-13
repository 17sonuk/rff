// const bcrypt = require("bcrypt");

const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: { type: String, maxLength: 200 },
    description: { type: String, maxLength: 200 },
})

//to store communities on mongo
const communitySchema = new Schema({
    name: { type: String, maxLength: 50 },
    place: { type: String, maxLength: 100 },
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
    communities: { type: [String] },
    orgName: { type: String, maxLength: 50 }
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
})

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

//ngo bank details
const bankDetailsSchema = new Schema({
    isUSBank: { type: Boolean, required: true },
    taxId: { type: String, required: true, maxLength: 100 },
    // beneficiaryName: { type: String, required: true, maxLength: 34 },
    // beneficiaryAddress: { type: String, required: true, maxLength: 35 },
    bankName: { type: String, required: true, maxLength: 50 },
    bankAddress: { type: addressSchema, required: true },
    bankPhone: phoneSchema,
    currencyType: { type: String, required: true, maxLength: 20 },
    bankAccountNo: { type: String, maxLength: 100 },
    ABAorRoutingNo: { type: String, maxLength: 100 },
    BICSwiftorCHIPSUISSortCode: { type: String, maxLength: 100 },
    IBANNo: { type: String, maxLength: 100 }
})

//ngo payment details
const paymentSchema = new Schema({
    paymentType: { type: String, enum: ['Paypal', 'Cryptocurrency', 'Bank'], required: true },
    paypalEmailId: { type: String, maxLength: 50 },
    cryptoAddress: { type: String, maxLength: 100 },
    bankDetails: bankDetailsSchema
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
    phone: [phoneSchema],
    paymentDetails: paymentSchema
}, { collection: "OrganisationProfile" })

// orgSchema.pre('validate', function (next) {

//     if (this.role === 'Corporate') {
//         if (!this.subRole) {
//             return next(new Error('Donor type is missing/invalid!'));
//         } else if (this.subRole === 'Institution' && !this.orgName) {
//             return next(new Error('Company/Foundation/Fund Name is missing/invalid!'));
//         }
//     }
//     if (this.role === 'Ngo') {
//         let { addressLine1, addressLine2, city, state, country, zipCode } = this.address
//         if (!addressLine1 || !addressLine2 || !city || !state || !country || !zipCode) {
//             return next(new Error('some address info is missing/invalid!'));
//         }

//         if (this.paymentDetails.paymentType === 'Bank' && (!this.paymentDetails.bankDetails.bankAddress.city || !this.paymentDetails.bankDetails.bankAddress.country)) {
//             return next(new Error('some bank address info is missing/invalid!'));
//         }
//     }
//     next();
// });

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

const donorSchema = new Schema({
    email: { type: String, required: true, maxLength: 100 },
    name: { type: String, maxLength: 100 }
}, { collection: "Donor", timestamps: true })

const citySchema = new Schema({
    name: { type: String, required: true }
})

const stateSchema = new Schema({
    name: { type: String, required: true },
    cities: [citySchema],
})

const countrySchema = new Schema({
    name: { type: String, required: true },
    phone_code: { type: String, maxLength: 50 },
    states: [stateSchema],
}, { collection: "Country" })

module.exports = {
    'notificationModel': models['Notification'] || model('Notification', notificationSchema),
    'orgModel': models['OrganisationProfile'] || model('OrganisationProfile', orgSchema),
    'projectModel': models['Project'] || model('Project', projectSchema),
    'txDescriptionModel': models['TxDescription'] || model('TxDescription', txDescriptionSchema),
    'fileModel': models['File'] || model('File', fileDataSchema),
    'communityModel': models['Community'] || model('Community', communitySchema),
    'donorModel': models['Donor'] || model('Donor', donorSchema),
    'countryModel': models['Country'] || model('Country', countrySchema)
};