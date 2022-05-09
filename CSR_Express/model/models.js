const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: { type: String, maxLength: 200 },
    description: { type: String, maxLength: 200 },
})

const projectSchema = new Schema({
    projectId: { type: String, required: true, unique: true },
    projectName: { type: String, required: true, maxLength: 50 },
    projectType: { type: String, required: true, maxLength: 50 },
    contributorsList: [String],
    ngo: { type: String, required: true },
    place: { type: String, maxLength: 50 },
    projectSummary: { type: String, required: true, maxLength: 200 },
    description: { type: String, maxLength: 2500 },

    // 1) Who benefits from this project?
    question1: { type: String, required: true, maxLength: 1000 },

    // 2) What environmental challenges are faced by the targeted population and how can we help them?
    question2: { type: String, required: true, maxLength: 1000 },

    // 3) What activities will be conducted under this project?
    question3: { type: String, required: true, maxLength: 1000 },

    // 4) What are the expected results from this project?
    question4: { type: String, required: true, maxLength: 1000 },

    // 5) What evidence will be submitted to verify the expected results?
    question5: { type: String, required: true, maxLength: 1000 },

    // 6) How does the community plan to reinvest the proceeds from this project?
    question6: { type: String, required: true, maxLength: 1000 },

    // 7) Comments on the timeline (if any) (optional field)
    question7: { type: String, maxLength: 1000 },

    images: { type: [String], validate: [imageLimit, 'max 3 images allowed!'] },
    phases: { type: [phaseSchema], validate: [phaseLimit, 'Number of phases should be greater than or equal to 1'] },
    communities: { type: [String] },
    orgName: { type: String, maxLength: 50 }
}, { collection: "Project" })

projectSchema.index({ projectId: 1, ngo: 1 }, { unique: true });

function imageLimit(val) {
    return val.length <= 3;
}

function phaseLimit(val) {
    return val.length >= 1;
}

const addressSchema = new Schema({
    addressLine1: { type: String, maxLength: [100, 'Address line 1 cannot exceed 100 characters'] },
    addressLine2: { type: String, maxLength: [100, 'Address line 2 cannot exceed 100 characters'] },
    city: { type: String, maxLength: [30, 'City name cannot exceed 30 characters'] },
    state: { type: String, maxLength: [30, 'State name cannot exceed 30 characters'] },
    zipCode: { type: String, maxLength: [10, 'Zipcode cannot exceed 10 characters'] },
    country: { type: String, maxLength: [30, 'Country name cannot exceed 30 characters'] }
})

const fileSchema = new Schema({
    currency: String,
    amount: String,
    fileHash: String,
    fileName: String,
    year: String
})

const phoneSchema = new Schema({
    countryCode: { type: String, maxLength: [20, 'Country code cannot exceed 20 characters'] },
    phoneNumber: { type: String, maxLength: [20, 'Phone number cannot exceed 20 characters'] }
})

//ngo bank details
const bankDetailsSchema = new Schema({
    isUSBank: { type: Boolean, required: [true, 'Field is required'] },
    taxId: { type: String, required: true, maxLength: [100, 'Tax id cannot exceed 100 characters'] },
    beneficiaryName: { type: String, required: [true, 'Beneficiary name field is required'], maxLength: [34, 'Beneficiary name cannot exceed 34 characters'] },
    beneficiaryAddress: { type: String, required: [true, 'Beneficiary address field is required'], maxLength: [35, 'Beneficiary address cannot exceed 35 characters'] },
    bankName: { type: String, required: [true, 'Bank name field is required'], maxLength: [50, 'Bank name cannot exceed 50 characters'] },
    bankAddress: { type: addressSchema, required: [true, 'Bank address field is required'] },
    bankPhone: phoneSchema,
    currencyType: { type: String, required: [true, 'Currency type field is required'], maxLength: [20, 'Currency type cannot exceed 20 characters'] },
    bankAccountNo: { type: String, maxLength: [100, 'Bank account no. cannot exceed 100 characters'] },
    ABAorRoutingNo: { type: String, maxLength: [100, 'Routing no. cannot exceed 100 characters'] },
    BICSwiftorCHIPSUISSortCode: { type: String, maxLength: [100, 'Code cannot exceed 100 characters'] },
    IBANNo: { type: String, maxLength: [100, 'IBAN no. cannot exceed 100 characters'] }
})

//ngo/community payment details
const paymentSchema = new Schema({
    paymentType: { type: String, enum: ['Paypal', 'Cryptocurrency', 'Bank'], required: [true, 'Payment type field is required'] },
    paypalEmailId: { type: String, maxLength: [50, 'Paypal email id cannot exceed 50 characters'] },
    cryptoAddress: { type: String, maxLength: [100, 'Crypto address cannot exceed 100 characters'] },
    bankDetails: bankDetailsSchema
})

//to store communities on mongo
const communitySchema = new Schema({
    name: { type: String, maxLength: [100, 'Name cannot exceed 100 characters'] },
    place: { type: String, maxLength: [100, 'Place name cannot exceed 100 characters'] },
    paymentDetails: paymentSchema
})

communitySchema.index({ name: 1, place: 1 }, { unique: true });

//to store user data
const orgSchema = new Schema({
    firstName: { type: String, required: [true, 'First name field is required'], maxLength: [50, 'First name cannot exceed 50 characters'] },
    lastName: { type: String, required: [true, 'Last name field is required'], maxLength: [50, 'Last name cannot exceed 50 characters'] },
    orgName: { type: String, maxLength: [50, 'Organisation name cannot exceed 50 characters'] },
    userName: { type: String, required: [true, 'User name field is required'], unique: true, maxLength: [50, 'User name cannot exceed 50 characters'] },
    email: { type: String, required: [true, 'Email field is required'], unique: true },
    role: { type: String, required: [true, 'Role field is required'], enum: ['Ngo', 'Corporate'] },
    subRole: { type: String, enum: ['Institution', 'Individual'] },
    status: { type: String, required: true, enum: ['created', 'approved', 'rejected'] },
    description: { type: String, maxLength: [200, 'Description cannot exceed 200 characters'] },
    address: addressSchema,
    website: { type: String, maxLength: [50, 'Website name cannot exceed 50 characters'] },
    phone: [phoneSchema],
    paymentDetails: paymentSchema,
    seen: { type: Boolean, default: false },
    hide: { type: Boolean, default: false },
    active: { type: Boolean, default: true }
}, { collection: "OrganisationProfile" })

orgSchema.index({ username: 1, email: 1 }, { unique: true });

const notificationSchema = new Schema({
    username: { type: String, required: true, maxLength: 50 },
    txId: String,
    description: { type: String, maxLength: 100 },
    seen: Boolean
}, { collection: "Notification", timestamps: true })

notificationSchema.index({ username: 1, txId: 1 }, { unique: true });

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


//save project
const savephaseSchema = new Schema({
    phaseName: { type: String, maxLength: 200 },
    description: { type: String, maxLength: 200 },
    startDate: { type : Date },
    endDate: { type : Date },
    qty : { type : Number },
    validationCriteria: { type : [String] },
})
const saveprojectSchema = new Schema({
    projectId: { type: String, unique: true },
    projectName: { type: String, maxLength: 50 },
    projectType: { type: String, maxLength: 50 },
    contributorsList: [String],
    ngo: { type: String },
    place: { type: String, maxLength: 50 },
    projectSummary: { type: String, maxLength: 200 },
    description: { type: String, maxLength: 2500 },

    // 1) Who benefits from this project?
    question1: { type: String, maxLength: 1000 },

    // 2) What environmental challenges are faced by the targeted population and how can we help them?
    question2: { type: String, maxLength: 1000 },

    // 3) What activities will be conducted under this project?
    question3: { type: String, maxLength: 1000 },

    // 4) What are the expected results from this project?
    question4: { type: String,  maxLength: 1000 },

    // 5) What evidence will be submitted to verify the expected results?
    question5: { type: String,  maxLength: 1000 },

    // 6) How does the community plan to reinvest the proceeds from this project?
    question6: { type: String, maxLength: 1000 },

    // 7) Comments on the timeline (if any) (optional field)
    question7: { type: String, maxLength: 1000 },

    images: { type: [String] },
    phases: { type: [savephaseSchema] },
    communities: { type: [String] },
    orgName: { type: String, maxLength: 50 }
}, { collection: "SaveProject" })


module.exports = {
    'notificationModel': models['Notification'] || model('Notification', notificationSchema),
    'orgModel': models['OrganisationProfile'] || model('OrganisationProfile', orgSchema),
    'projectModel': models['Project'] || model('Project', projectSchema),
    'txDescriptionModel': models['TxDescription'] || model('TxDescription', txDescriptionSchema),
    'fileModel': models['File'] || model('File', fileDataSchema),
    'communityModel': models['Community'] || model('Community', communitySchema),
    'donorModel': models['Donor'] || model('Donor', donorSchema),
    'countryModel': models['Country'] || model('Country', countrySchema),
    'saveprojectModel': models['SaveProject'] || model('SaveProject', saveprojectSchema)
};
