// const bcrypt = require("bcrypt");

const { model, models, Schema } = require("mongoose");

const phaseSchema = new Schema({
    phaseName: String,
    description: String,
})

const projectSchema = new Schema({
    projectId: { type: String, required: true, unique: true },
    projectName: { type: String, required: true },
    projectType: { type: String, required: true},
    contributorsList: [String],
    ngo: { type: String, required: true },
    place: String,
    description: String,
    images: [String],
    phases: {type:[phaseSchema],validate: [phaseLimit, 'Number of phases should be greater than or equal to 1']}

}, { collection: "Project" })

function phaseLimit(val) {
    return val.length >= 1;
  }

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
    userName: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['Ngo', 'Corporate'] },
    date: Number,
    status: String,
    description: String,
    pan: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    regId: String,
    address: addressSchema,
    contact: [contactSchema]
    //file: [fileSchema]
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
}, { collection: "Notification", timestamps: true })

notificationSchema.index({ username: 1, txId: 1 }, { unique: true })

const txDescriptionSchema = new Schema({
    txId: { type: String, unique: true },
    description: String,
}, { collection: "TxDescription", timestamps: true })

module.exports = {
    'notificationModel': models['Notification'] || model('Notification', notificationSchema),
    'orgModel': models['OrganisationProfile'] || model('OrganisationProfile', orgSchema),
    'projectModel': models['Project'] || model('Project', projectSchema),
    'txDescriptionModel': models['TxDescription'] || model('TxDescription', txDescriptionSchema)
};