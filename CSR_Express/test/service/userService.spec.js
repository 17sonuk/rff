const chai = require('chai');
const { expect } = require('chai');
var sandbox = require("sinon").createSandbox();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const userService = require('../../service/userService');
const userModel = require('../../model/userModel');
const messages = require('../../loggers/messages');
const individualRegEmailTemplate = require('../../email-templates/individualRegEmail');
const institutionRegEmailTemplate = require('../../email-templates/institutionRegEmail');

describe('TESTING USER SERVICE - REGISTER', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'registerUser');
    });

    afterEach(() => {
        mockObj.restore();
    });

    it('testing response for registerUser', function (done) {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: 'Institution',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves('user successfully registered...');
        userService.registerUser(registerUserData).then(res => {
            expect(registerUserData.status).to.equal('created')
            expect(res).to.equal('user successfully registered...')
            userModel.registerUser.restore();
        })
        done()
    })

    it('testing response for registerUser when role is corporate and subRole is Individual', function (done) {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: 'Individual',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves('user successfully registered...');
        userService.registerUser(registerUserData).then(res => {
            expect(registerUserData.status).to.equal('approved')
            expect(res).to.equal('user successfully registered...')
            userModel.registerUser.restore();
        })

        mockObj.resolves(null);
        try {
            userService.registerUser(registerUserData).then(res => {
                expect(registerUserData.status).to.equal('approved')
                expect(res).to.equal('user successfully registered...')
                userModel.registerUser.restore();

            })
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
        done()
    })

    it('testing response for If role is Ngo and Payment Details is missing', function (done) {
        const registerUserData = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {

            }

        }

        mockObj.resolves('Payment details missing!');
        userService.registerUser(registerUserData).then(res => {
            expect(registerUserData.status).to.equal('approved')
            expect(res.message).to.equal('Payment details missing!')
            userModel.registerUser.restore();
        })
        done()
    })

    it('testing response for If role is Ngo and address details are missing', function (done) {
        const registerUserData1 = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: '',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "info@paypal.com"

            }

        }

        mockObj.resolves(messages.error.INVALID_ADDRESS);
        try {
            userService.registerUser(registerUserData1).then(res => {
                expect(registerUserData.status).to.equal('approved')
                expect(res.message).to.equal(messages.error.INVALID_ADDRESS)
                userModel.registerUser.restore()
            })
        }
        catch (err) {
            expect(err.message).to.equal(messages.error.INVALID_ADDRESS)
        }
        done()
    })

    it('testing response for If payment option is Paypal but paypal Id is missing', function (done) {
        const registerUserData1 = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: 'Paypal',
                paypalEmailId: ""

            }

        }

        mockObj.resolves(messages.error.MISSING_PAYPAL_ID);
        try {
            userService.registerUser(registerUserData1).then(res => {
                expect(registerUserData.status).to.equal('approved')
                expect(res).to.throw(messages.error.MISSING_PAYPAL_ID)
                userModel.registerUser.restore();
            })
        } catch (err) {
            expect(err.message).to.equal(messages.error.MISSING_PAYPAL_ID)
        }
        done()
    })

    it('testing response for If payment option is Cryptocurrency but cryptoAddress is missing', function (done) {
        const registerUserData1 = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "Cryptocurrency",
                cryptoAddress: '',

            }

        }

        mockObj.resolves(messages.error.MISSING_CRYPTO_ID);
        try {
            userService.registerUser(registerUserData1).then(res => {
                expect(registerUserData.status).to.equal('approved')
                expect(res).to.throw(messages.error.MISSING_CRYPTO_ID)
                userModel.registerUser.restore();
            })
        } catch (err) {
            expect(err.message).to.equal(messages.error.MISSING_CRYPTO_ID)
        }
        done()
    })

    it('testing response for registerUser if subRole is missing', function (done) {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: '',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves(messages.error.InvalidDonorType);
        expect(userService.registerUser.bind(userService, registerUserData)).to.throw(messages.error.InvalidDonorType)
        userModel.registerUser.restore();
        done()
    })

    it('testing response for registerUser if subRole is there but org name is missing', async () => {
        const registerUserDataOrg = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: '',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: 'Institution',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves('Company/Foundation/Fund Name is missing/invalid!');
        try {
            let res = await userService.registerUser(registerUserDataOrg)
            expect(res).to.equal('Company/Foundation/Fund Name is missing/invalid!')
        } catch (err) {
            expect(err.message).to.equal('Company/Foundation/Fund Name is missing/invalid!')
        }
        userModel.registerUser.restore();

    })

})



describe('TESTING USER SERVICE - GetUserDetails', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getUserDetails');
    });

    afterEach(() => {
        mockObj.restore();
    });

    it('testing response for userName Validity', async () => {
        mockObj.resolves(null);
        let res = await userService.checkUserNameValidty('ngo3')
        expect(res).to.equal(true)
        userModel.getUserDetails.restore();
    })

    it('testing response for userNameValidity if userName is already exist', async () => {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: '',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }

        mockObj.resolves(registerUserData);
        try {
            let res = await userService.checkUserNameValidty('corp90')
        } catch (err) {
            expect(err.message).to.equal("User already exists")
        }
        userModel.getUserDetails.restore();
    })

    it('testing response for getUserDetails', async () => {
        const registerUserDataUser = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: '',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves(registerUserDataUser);
        let res = await userService.getUserDetails('corp90')
        expect(res).to.equal(registerUserDataUser)
        userModel.getUserDetails.restore();

    })
    it('testing response for getUserDetails if user is not present', async () => {
        mockObj.resolves(null);
        try {
            let res = await userService.getUserDetails('corp934')
            expect(res).to.equal('Bad Connection')
        } catch (err) {
            expect(err.message).to.equal(messages.error.INVALID_USER_NAME)
        }

    })

    it('testing response for getUserRedeemAccount', async () => {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            description: 'desc',
            website: 'test',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '567',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "info@paypal.com",
                cryptoAddress: '1234',
                bankDetails: {
                    isUSbank: "No",
                    taxId: 'P123',
                    beneficiaryName: 'CP',
                    beneficiaryAddress: 'address',
                    bankName: 'Test',
                    bankAddress: 'bankAddress',
                    bankPhone: {
                        countryCode: '+91',
                        phoneNumber: '97654678'
                    },
                    currencyType: "INR",
                    bankAccountNo: '',
                    ABAorRoutingNo: '',
                    BICSwiftorCHIPSUISSortCode: '',
                    IBANNo: ''
                }

            }
        }
        mockObj.resolves(registerUserData);
        userService.getUserRedeemAccount('ngo90').then(res => {
            expect(res).to.equal(registerUserData.paymentDetails)
        })

        const registerUserData2 = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Ngo',
            userName: 'ngo93',
            email: 'info93@ngo.com',
            role: 'Ngo',
            status: '',
            description: 'desc',
            website: 'test',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '567',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves(registerUserData2)
        try {
            let res = await userService.getUserRedeemAccount('ngo93')
            expect(res).to.equal(messages.error.MISSING_PAYMENT_DETAILS)
        } catch (err) {
            expect(err.message).to.equal(messages.error.MISSING_PAYMENT_DETAILS)
        }

        mockObj.resolves(null);
        //If user doesnt exist
        try {
            let res = await userService.getUserRedeemAccount('ngo92', 'Bank')
            expect(res).to.equal("Unauthorized user")
        } catch (err) {
            expect(err.message).to.equal("Unauthorized user")
        }
        userModel.getUserDetails.restore();

    })



})


describe('TESTING USER SERVICE - Login', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getUserDetails');
    });

    afterEach(() => {
        mockObj.restore();
    });

    it('testing response for Login', async () => {
        const registerUserDataLogin = {
            firstName: 'Harry',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp910',
            email: 'info910@corp.com',
            role: 'Corporate',
            subRole: 'Individual',
            status: '',
            description: 'desc',
            website: 'test',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '567',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }

        registerUserDataLogin.status = 'approved'
        mockObj.resolves(registerUserDataLogin);
        let res = await userService.login('info910@corp.com')
        expect(res.success).to.equal(true)
        expect(res.message).to.equal('Login successful')
        expect(res.name).to.equal(registerUserDataLogin.firstName + " " + registerUserDataLogin.lastName)

        registerUserDataLogin.status = 'approved'
        registerUserDataLogin['subRole'] = 'Institution'
        let res1 = await userService.login('info910@corp.com')
        expect(res1.name).to.equal(registerUserDataLogin.orgName)

        registerUserDataLogin.status = 'created'
        mockObj.resolves(registerUserDataLogin);
        let res2 = await userService.login('info910@corp.com')
        expect(res2.success).to.equal(false)
        expect(res2.message).to.equal(messages.error.PENDING_APPROVAL)

        //If data is not present
        mockObj.resolves(null);
        let res3 = await userService.login('info911@corp.com')
        expect(res3.success).to.equal(false)
        expect(res3.message).to.equal('User does not exist')

    })
})

describe('TESTING USER SERVICE - Notification', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'createNotification');
    });

    afterEach(() => {
        mockObj.restore();
    });

    it('testing response for Notification', async () => {

        const Notif = {
            userName: 'corp911',
            txId: "t101",
            description: "Description",
            seen: true
        }
        mockObj.resolves(Notif);
        let res = await userService.createNotification('P1')
        expect(res.success).to.equal(true)
        expect(res.message).to.equal(messages.success.NOTIFICATION_CREATED)

        //If Notification is not presnt
        mockObj.resolves(null);
        try {
            let res = await userService.createNotification('P1')
            expect(res.success).to.equal(true)
            expect(res.message).to.equal('Bad Connection')
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })

})

describe('TESTING USER SERVICE - TxDescription', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'createTxDescription');
    });

    afterEach(() => {
        mockObj.restore();
    });

    it('testing response for Notification', async () => {
        const TxDesc = {
            txId: 't101',
            description: 'Desc'
        }
        mockObj.resolves(TxDesc);
        let res = await userService.createTxDescription('P1')
        expect(res.success).to.equal(true)
        expect(res.message).to.equal(messages.success.TRANSACTION_DESCRIPTION)

        //If Notification is not presnt
        mockObj.resolves(null);
        try {
            let res = await userService.createTxDescription('P1')
            expect(res.success).to.equal(true)
            expect(res.message).to.equal('tx description created in db')
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING USER SERVICE - getNotification', () => {
    let mockObj = ""
    let mockObj1 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getNotifications');
        mockObj1 = sandbox.stub(userModel, 'getNotificationDescription');
    });

    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
    });

    it('testing response for gettingNotification', async () => {

        const Notif = {
            userName: 'corp911',
            txId: "t101",
            description: "Description",
            seen: true
        }

        const TxDesc = {
            txId: 't101',
            description: 'Description'
        }
        mockObj.resolves(Notif);
        mockObj1.resolves(TxDesc)
        let res = await userService.getNotifications('corp911', true)
        expect(res.description).to.equal(Notif.description)
        expect(res.userName).to.equal(Notif.userName)


        //If Notification is not presnt
        mockObj.resolves(null);
        try {
            let res = await userService.getNotifications('corp911', true)
            expect(res.description).to.equal(Notif.description)
            expect(res.userName).to.equal(Notif.userName)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })

})

describe('TESTING USER SERVICE - UpdateNotification', () => {
    let mockObj = ""

    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'updateNotification');

    });

    afterEach(() => {
        mockObj.restore();

    });

    it('testing response for UpdateNotification', async () => {
        const data1 = {
            n: '1',
            nModified: '1',
            ok: '1'
        }

        mockObj.resolves(data1);
        let res = await userService.updateNotification('corp911', 't101')
        expect(res.success).to.equal(true)
        expect(res.message).to.equal(messages.success.NOTIFICATION_UPDATED)

        data1.nModified = 0
        mockObj.resolves(data1);
        try {
            let res = await userService.updateNotification('corp911', 't101')
            expect(res.success).to.equal(true)
            expect(res.message).to.equal('notification updated')
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }


    })
})


describe('TESTING USER SERVICE - getApprovedInstitutions', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getApprovedInstitutions');
    });

    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getApprovedInstitutions', async () => {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: 'Institution',
            status: 'created',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves(registerUserData);
        let res = await userService.getApprovedInstitutions()
        expect(res).to.equal(registerUserData)

        //If there is no Unapproved users
        mockObj.resolves(null);
        try {
            let res = await userService.getApprovedInstitutions()
            expect(res).to.equal(null)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }

    })
})

describe('TESTING USER SERVICE - deleteUser', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'rejectUser');
    });

    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for deleteUser', async () => {
        const registerUserData = {
            firstName: 'Charles',
            lastName: 'Mack',
            orgName: 'Corporate',
            userName: 'corp90',
            email: 'info90@corp.com',
            role: 'Corporate',
            subRole: 'Institution',
            status: 'created',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: '',
                zipCode: '',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ]
        }
        mockObj.resolves(registerUserData);
        let res = await userService.deleteUser("corp90")
        expect(res).to.equal(registerUserData)

        //If there is no Unapproved users
        mockObj.resolves(null);
        try {
            let res = await userService.deleteUser("corp90")
            expect(res).to.equal(null)
        } catch (err) {
            expect(err.message).to.equal(messages.error.TRY_AGAIN)
        }

    })
})


describe('TESTING USER SERVICE - updateUserProfile', () => {
    let mockObj = ""
    let mockObj1 = ""

    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getUserDetails');
        mockObj1 = sandbox.stub(userService, 'updateUserProfile');
    });

    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();


    });
    it('testing response for updateUserProfile', async () => {
        let re = { success: true, message: messages.success.UPDATE_USER }
        let userData = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            status: '',
            // subRole: 'Institution',

            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "Cryptocurrency",
                // Cryptocurrency:"$21"
                cryptoAddress: '1234'

            }
        }
        const registerUserData1 = {
            firstName: 'Rihana',
            lastName: 'John',
            // orgName: 'Ngo',
            // userName: 'ngo90',
            // email: 'info90@ngo.com',
            // role: 'Ngo',
            // status: '',
            // subRole: 'Institution's,

            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "Cryptocurrency",
                // Cryptocurrency:"$21"
                cryptoAddress: '1234'

            }
        }
        mockObj.resolves(userData)
        mockObj1.resolves(re)

        let res = await userService.updateUserProfile('ngo90', registerUserData1)
        expect(res).to.equal(re)

        //When data is not present
        mockObj.resolves(null)
        mockObj1.resolves(null)

        try {
            let res1 = await userService.updateUserProfile('n67', registerUserData1)
            console.log("err: ", res1)

            expect(res1).to.equal(null)
        } catch (err) {
            console.log("err: ", err)
            expect(err.status).to.equal(401)
        }
    })
})

describe('TESTING USER SERVICE - getUserRedeemAccount', () => {
    let mockObj = ""
    // let mockObj1 = ""

    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'getUserDetails');
        // mockObj1 = sandbox.stub(userModel, 'updateUserProfile');


    });

    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();


    });
    it('testing response for getUserRedeemAccount', async () => {
        // let re = { success: true, message: messages.success.UPDATE_USER }
        let registerUserData1 = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo90',
            email: 'info90@ngo.com',
            role: 'Ngo',
            subRole: 'Institution',

            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '6789',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '9765457990'
                }
            ],
            paymentDetails: {
                paymentType: "Cryptocurrency",
                cryptoAddress: '1234',

            }
        }
        mockObj.resolves(registerUserData1)
        // mockObj1.resolves(re)

        let res = await userService.getUserRedeemAccount('ngo90')
        expect(res).to.equal(registerUserData1.paymentDetails)

        //When data is not present
        mockObj.resolves(null)
        try {
            let res1 = await userService.getUserRedeemAccount('ngo95')
            expect(res1.status).to.equal(401)
        } catch (err) {
            expect(err.message).to.equal(messages.error.UNAUTHORIZED_USER)
        }
    })
})

describe('TESTING USER SERVICE - markInstitutionalDonorAsSeen', () => {
    let mockObj = ""

    beforeEach(() => {
        mockObj = sandbox.stub(userModel, 'markInstitutionalDonorAsSeen');

    });

    afterEach(() => {
        mockObj.restore();

    });

    it('testing response for markInstitutionalDonorAsSeen', async () => {
        const data1 = {
            n: '1',
            nModified: '1',
            ok: '1'
        }

        mockObj.resolves(data1);
        let res = await userService.markInstitutionalDonorAsSeen('t101')
        expect(res.success).to.equal(true)
        expect(res.message).to.equal(messages.success.UPDATE_USER)

        data1.nModified = 0
        mockObj.resolves(data1);
        try {
            let res = await userService.markInstitutionalDonorAsSeen('t10')
            expect(res.success).to.equal(true)
            expect(res.message).to.equal(messages.error.FAILED_UPDATE_USER)
        } catch (err) {
            expect(err.message).to.equal(messages.error.FAILED_UPDATE_USER)
        }


    })
})

describe('TESTING USER SERVICE - sendEmailForDonorRegistration', () => {
    let mockObj = ""
    let mockObj1 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(individualRegEmailTemplate, 'individualRegEmail');
        mockObj1 = sandbox.stub(institutionRegEmailTemplate, 'institutionRegEmail');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing response for sendEmailForDonorRegistration', async () => {
        // let emails=[]
        const req = {
            body: {
                'email': [],
                'role': 'Corporate',
                'subRole': 'Individual'
            }

        }
        mockObj.resolves(`<html>hi</html>`);
        
        await userService.sendEmailForDonorRegistration(req)
        // expect(res.status).to.equal(200)

        // expect(res).to.equal(donor)

        //If not able to save donor
        mockObj.resolves(null);
        // mockObj1.resolves(null);

        try {
           await userService.sendEmailForDonorRegistration(req)
            // expect(res.status).to.equal(200)

        } catch (err) {
            // expect(err.message).to.equal('No project found')
        }
    })

    it('testing response for sendEmailForDonorRegistration', async () => {
        // let emails=[]
        let req = {
            body: {
                'email': [],
                'role': 'Corporate',
                'subRole': 'Institution'
            }

        }
        mockObj1.resolves(`<html>hi</html>`);
        
        await userService.sendEmailForDonorRegistration(req)
        // expect(res.status).to.equal(200)

        // expect(res).to.equal(donor)

        //If not able to save donor
        mockObj1.resolves(null);
        // mockObj1.resolves(null);

        try {
           await userService.sendEmailForDonorRegistration(req)
            // expect(res.status).to.equal(200)

        } catch (err) {
            // expect(err.message).to.equal('No project found')
        }
    })
})



// describe('TESTING USER SERVICE - Unapproved users', () => {
//     let mockObj = ""
//     beforeEach(() => {
//         mockObj = sandbox.stub(userModel, 'getUnapprovedUserDetails');
//     });

//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing response for getUnapprovedUser', async () => {
//         const registerUserData = {
//             firstName: 'Charles',
//             lastName: 'Mack',
//             orgName: 'Corporate',
//             userName: 'corp90',
//             email: 'info90@corp.com',
//             role: 'Corporate',
//             subRole: 'Institution',
//             status: 'created',
//             description: '',
//             website: '',
//             address: {
//                 addressLine1: 'address10',
//                 addressLine2: 'address20',
//                 city: 'city',
//                 state: '',
//                 zipCode: '',
//                 country: 'India'
//             },
//             phone: [
//                 {
//                     countryCode: '+91',
//                     phoneNumber: '97654579'
//                 }
//             ]
//         }
//         mockObj.resolves(registerUserData);
//         let res = await userService.getUnapprovedUserDetails()
//         expect(res).to.equal(registerUserData)

//         //If there is no Unapproved users
//         mockObj.resolves(null);
//         try {
//             let res = await userService.getUnapprovedUserDetails()
//             expect(res).to.equal(registerUserData)
//         } catch (err) {
//             expect(err.message).to.equal('Bad Connection')
//         }

//     })
// })

// // describe('TESTING USER SERVICE - approved users', () => {
// //     let mockObj = ""
// //     let mockObj1 = ""
// //     beforeEach(() => {
// //         mockObj = sandbox.stub(userModel, 'approveUser');
// //         mockObj1 = sandbox.stub(userModel, 'getUserDetails');
// //     });

// //     afterEach(() => {
// //         mockObj.restore();
// //         mockObj1.restore();
// //     });

// //     it('testing response for Approve users', async () => {
// //         const registerUserDataA = {
// //             firstName: 'Charles',
// //             lastName: 'Mack',
// //             orgName: 'Corporate',
// //             userName: 'corp90',
// //             email: 'info90@corp.com',
// //             role: 'Corporate',
// //             subRole: 'Institution',
// //             status: '',
// //             description: 'desc',
// //             website: 'test',
// //             address: {
// //                 addressLine1: 'address10',
// //                 addressLine2: 'address20',
// //                 city: 'city',
// //                 state: 'state',
// //                 zipCode: '567',
// //                 country: 'India'
// //             },
// //             phone: [
// //                 {
// //                     countryCode: '+91',
// //                     phoneNumber: '97654579'
// //                 }
// //             ]
// //         }
// //         const updateData = {
// //             ok: 0, n: 0, nModified: 1
// //         }
// //         const updateData1 = {
// //             ok: 0, n: 1, nModified: 0
// //         }
// //         const updateData2 = {
// //             ok: 0, n: 0, nModified: 0
// //         }

// //         mockObj.resolves(updateData);
// //         mockObj1.resolves(registerUserDataA);
// //         let res = await userService.approveUser('corp90')
// //         expect(res).to.equal(registerUserDataA.role.toLowerCase())

// //         //If not able to find user
// //         mockObj.resolves(updateData);
// //         mockObj1.resolves(null);
// //         try {
// //             let res1 = await userService.approveUser('corp91')
// //             expect(res1).to.equal('corp91 does not exist in mongo')
// //         } catch (err) {
// //             expect(err.message).to.equal('corp91 does not exist in mongo')
// //         }

// //         //If user is already approved
// //         mockObj.resolves(updateData1);
// //         mockObj1.resolves(registerUserDataA);
// //         try {
// //             let res = await userService.approveUser('corp90')
// //             expect(res).to.equal(registerUserDataA.role.toLowerCase())
// //         } catch (err) {
// //             expect(err.message).to.equal('corp90 is already approved')
// //         }

// //         //If user doesnot exist
// //         mockObj.resolves(updateData2);
// //         mockObj1.resolves(registerUserDataA);
// //         try {
// //             let res = await userService.approveUser('corp92')
// //             expect(res).to.equal(registerUserDataA.role.toLowerCase())
// //         } catch (err) {
// //             expect(err.message).to.equal('corp92 does not exist in mongo')
// //         }

// //     })
// // })

// // describe('TESTING USER SERVICE - approved users', () => {
// //     let mockObj = ""
// //     beforeEach(() => {
// //         mockObj = sandbox.stub(userModel, 'rejectUser');
// //     });

// //     afterEach(() => {
// //         mockObj.restore();
// //     });

// //     it('testing response for Reject users', async () => {
// //         const registerUserData = {
// //             firstName: 'Charles',
// //             lastName: 'Mack',
// //             orgName: 'Corporate',
// //             userName: 'corp90',
// //             email: 'info90@corp.com',
// //             role: 'Corporate',
// //             subRole: 'Institution',
// //             status: '',
// //             description: 'desc',
// //             website: 'test',
// //             address: {
// //                 addressLine1: 'address10',
// //                 addressLine2: 'address20',
// //                 city: 'city',
// //                 state: 'state',
// //                 zipCode: '567',
// //                 country: 'India'
// //             },
// //             phone: [
// //                 {
// //                     countryCode: '+91',
// //                     phoneNumber: '97654579'
// //                 }
// //             ]
// //         }

// //         mockObj.resolves(registerUserData);
// //         let res = await userService.rejectUser('corp90')
// //         expect(res).to.equal(registerUserData)

// //         //If data is not present
// //         mockObj.resolves(null);
// //         try {
// //             let res = await userService.rejectUser('corp90')
// //             expect(res).to.equal(registerUserData)
// //         } catch (err) {
// //             expect(err.message).to.equal('Bad Connection')
// //         }

// //     })
// // })
// describe('TESTING USER SERVICE - resetUserStatus', () => {
//     let mockObj = ""

//     beforeEach(() => {
//         mockObj = sandbox.stub(userModel, 'resetUserStatus');

//     });

//     afterEach(() => {
//         mockObj.restore();

//     });
//     it('testing response for ResetUserStatus', async () => {
//     const registerUserData1 = {
//         firstName: 'Rihana',
//         lastName: 'John',
//         orgName: 'Ngo',
//         userName: 'ngo90',
//         email: 'info90@ngo.com',
//         role: 'Ngo',
//         status: '',
//         description: '',
//         website: '',
//         address: {
//             addressLine1: 'address10',
//             addressLine2: 'address20',
//             city: 'city',
//             state: 'state',
//             zipCode: '6789',
//             country: 'India'
//         },
//         phone: [
//             {
//                 countryCode: '+91',
//                 phoneNumber: '97654579'
//             }
//         ],
//         paymentDetails: {
//             paymentType: "Cryptocurrency",
//             cryptoAddress: '1234',

//         }
//     }
//     mockObj.resolves(registerUserData1)
//     let res = await userService.resetUserStatus('ngo90')
//     expect(res).to.equal(true)

//     //When data is not present
//     mockObj.resolves(null)
//     try{
//     let res1 = await userService.resetUserStatus('ngo95')
//     expect(res1).to.equal(false)
//     }catch(err){
//         expect(err.message).to.equal(messages.error.RESET_USER)
//     }
// })
// })