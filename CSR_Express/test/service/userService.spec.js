const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

const userService = require('../../service/userService');
const userModel = require('../../model/userModel');

const testUser = {
    firstName: 'Charles',
    lastName: 'Mack',
    orgName: 'Corporate',
    userName: 'corp3',
    email: 'info@corp.com',
    role: 'Corporate',
    subRole: 'Institution', //Not valid for ngo role
    status: '',
    description: '',
    website: '',
    address: {
        addressLine1: 'address1',
        addressLine2: 'address2',
        city: 'city',
        state: '',
        zipCode: '',
        country: 'India'
    },
    phone: [
        {
            countryCode: '+91',
            phoneNumber: '9765457'
        }
    ]

}

describe('TESTING USER SERVICE - REGISTER', () => {
    before((done) => {
        connectionToMongo('_test');
        done();
    })

    after((done) => {
        disconnectMongo()
            .then(() => {
                console.log('Mongo connection closed.');
                done()
            })
            .catch((err) => done(err))
    })

    it('testing response for registerUser', async () => {
        // const userDetails = testUser
        // const registerUserStub = sinon.stub(userModel, "registerUser").resolves({ success: true, message: 'user successfully registered...' });

        const res = await userService.registerUser(testUser);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(testUser.status).to.equal('created')
        expect(res.message).to.equal('user successfully registered...');
    });

    it('testing response status of registerUser if role is Corporate and subrole is Individual', async () => {
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
        const res = await userService.registerUser(registerUserData);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(registerUserData.status).to.equal('approved')
        expect(res.message).to.equal('user successfully registered...');
    });

    it('testing response for If role is Ngo and Payment Details is missing', async () => {
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
            paymentDetails:{
                
            }

        }
        try {
            const res = await userService.registerUser(registerUserData);
            //here to request
            expect(res).to.be.a('object');
            expect(res.success).to.equal(false);
        } catch (err) {
            console.log("Response:",err)
            expect(err.status).to.equal(400)
        }

    });

    it('testing response for If payment option is Paypal but paypal Id is missing', async () => {
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
                zipCode: '09876',
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
                paypalEmailId: "",

            }

        }
        try {
            const res = await userService.registerUser(registerUserData);
            //here to request
            expect(res).to.be.a('object');
            expect(res.success).to.equal(false);
        } catch (err) {
            expect(err.status).to.equal(400)
        }

    });

    it('testing response for If payment option is Crypto but crypto Id is missing', async () => {
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
                zipCode: '654',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '97654579'
                }
            ],
            paymentDetails: {
                paymentType: "CryptoCurrency",
                cryptoAddress: '',

            }

        }
        try {
            const res = await userService.registerUser(registerUserData);
            //here to request
            expect(res).to.be.a('object');
            expect(res.success).to.equal(false);
        } catch (err) {
            console.log("Response:",err)
            expect(err.status).to.equal(400)
        }

    });


    it('testing response for checkUserValidity', async () => {
        try {
            const res = await userService.checkUserNameValidty('corp3');
            console.log("Response:", res);
            expect(res).to.be.a('object');
        } catch (err) {
            expect(err.status).to.equal(500)
        }
    });

    it('testing response for checkUserValidity if it is new', async () => {
        const res = await userService.checkUserNameValidty('ngo88');
        expect(res).to.equal(true);
    });



    it('testing response for getUserDetails', async () => {
        const res = await userService.getUserDetails('corp3');
        expect(res).to.be.a('object');
    });

    it('testing response for getUserDetails if user does not exist', async () => {
        try {
            const res = await userService.getUserDetails('corp6');
            expect(res).to.be.a('object');
        } catch (err) {
            expect(err.status).to.equal(500)
        }
    });

    it('testing response for getting unapproved userList', async () => {
        const res = await userService.getUnapprovedUserDetails();
        expect(res[0].status).to.equal('created');
    });

    it('testing response for login if user is not approved', async () => {
        const res = await userService.login('info@corp.com');
        expect(res.success).to.equal(false);
        expect(res.message).to.equal('Pending for approval. Please try again later.')
    });

    it('testing response for ApproveUser', async () => {
        const res = await userService.approveUser('corp3');
        expect(res).to.equal(testUser.role.toLowerCase());
    });

    it('testing response for ApproveUser if user doesnot exist', async () => {
        try {
            const res = await userService.approveUser('corp8');
            expect(res).to.equal(testUser.role.toLowerCase());
        } catch (err) {
            expect(err.status).to.equal(500);
        }
    });



    it('testing response for getUserRedeemAccount', async () => {
        const registerDataTest = {
            firstName: 'Rihana',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo91',
            email: 'info91@ngo.com',
            role: 'Ngo',
            
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address10',
                addressLine2: 'address20',
                city: 'city',
                state: 'state',
                zipCode: '123456',
                country: 'India'
            },
            phone: [
                {
                    countryCode: '+91',
                    phoneNumber: '976545795'
                }
            ],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",
            }
        }
        await userService.registerUser(registerDataTest)
        const res = await userService.getUserRedeemAccount('ngo91', 'Paypal');
        expect(res).to.equal('ngo@paypal.com');

    });

    it('testing response for getUserRedeemAccount when payment type is Cryptocurrency', async () => {
        const registerDataTest = {
            firstName: 'Rihanas',
            lastName: 'John',
            orgName: 'Ngo',
            userName: 'ngo92',
            email: 'info92@ngo.com',
            role: 'Ngo',
            status: '',
            description: '',
            website: '',
            address: {
                addressLine1: 'address100',
                addressLine2: 'address200',
                city: 'city',
                state: 'state',
                zipCode: '3456',
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
                cryptoAddress: '1234',
            }
        }
        await userService.registerUser(registerDataTest)
        const res = await userService.getUserRedeemAccount('ngo92', 'Cryptocurrency');
        expect(res).to.equal('1234');

        //If user is Unauthorized
        try {
            const res = await userService.getUserRedeemAccount('ngo909', 'Cryptocurrency');
            expect(res).to.equal('1234');
        } catch (err) {
            expect(err.status).to.equal(401)
        }

        //If payment type is invalid
        try {
            const res = await userService.getUserRedeemAccount('ngo92', 'Crypto');
            expect(res).to.equal('1234');
        } catch (err) {
            expect(err.status).to.equal(500)
        }

    });



    // it('testing response for getting unapproved userList if data is not present', async () => {
    //     try{
    //     const res = await userService.getUnapprovedUserDetails();
    //     expect(res[0].status).to.equal('created');
    //     }catch(err){
    //         console.log("Error:",err);
    //         expect(err).to.equal('Bad Connection')
    //     }
    // });


    it('testing response for Already ApproveUser', async () => {
        try {
            const res = await userService.approveUser('corp3');
            expect(res).to.equal(testUser.role.toLowerCase());
        } catch (err) {
            expect(err.status).to.equal(500)
        }
    });

    // it('testing response for resetUserStatus', async () => {
    //     try{
    //     const res = await userService.resetUserStatus('corp3');
    //     expect(res[0].status).to.equal('approved');
    //     }catch(err){
    //         console.log("Error:",err);
    //         expect(err.status).to.equal(500)
    //     }
    // });

    it('testing response for Reject', async () => {
        const data = testUser;
        data.userName = 'corp12'
        data.email = 'newCorp@gmail.com';
        await userModel.registerUser(data);
        const res = await userService.rejectUser('corp12');
        expect(res.deletedCount).to.equal(1);

    });

    it('testing response for Reject if user does not exist', async () => {
        const res = await userService.rejectUser('corp19');
        expect(res.deletedCount).to.equal(0);
    });


    it('testing response for login', async () => {
        const res = await userService.login('info@corp.com');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('Login successful')
    });

    it('testing response for login if user does not exist', async () => {
        const res = await userService.login('info1@corp.com');
        expect(res.success).to.equal(false);
        expect(res.message).to.equal('User does not exist')
    })

    it('testing response for login if subrole is individual', async () => {
        let loginData = testUser;
        loginData.subRole = 'Individual'
        loginData.userName = 'corp00'
        loginData.email = 'newCorp00@gmail.com';
        await userModel.registerUser(loginData);
        await userService.approveUser('corp00');
        const res = await userService.login('newCorp00@gmail.com');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('Login successful')
        expect(res.name).to.equal(loginData.firstName + " " + loginData.lastName)

    });

    it('testing response for balance sheet if it does not exist', async () => {
        const res = await userService.getAmountFromBalanceSheet('corp99');
        expect(res.success).to.equal(false);
        expect(res.message).to.equal('not getting files from db')

    })

    let notification = {
        'txId': 'id-01',
        'seen': false
    };

    it('testing response for create notification', async () => {
        notification.username = 'corp3'
        const res = await userService.createNotification(notification);
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('notification created in db')
    })

    it('testing response for create Transaction', async () => {
        let txDescription = {
            'txId': notification.txId,
            'description': 'test description'
        }
        const res = await userService.createTxDescription(txDescription);
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('tx description created in db')
    })

    it('testing response for getNotification', async () => {

        const res = await userService.getNotifications('corp3', false);
        console.log("Response:", res);
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);

    })

    it('testing response for create notification of inavlid project', async () => {
        //If txId is not present
        const testProject = {
            "contributorsList": [],
            "username": "corp88",
            "images": [],
            "projectId": "p06",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo500",
            "place": "Mumbai",
            "description": "Testing Description",
            // "txId":"P09",
            "phases": [
                {
                    "phaseName": "Registration of students",
                    "description": "Enrollment of students in a school."
                },
                {
                    "phaseName": "Allotment of study materials",
                    "description": "Distribute the books and stationary to the students"
                },
                {
                    "phaseName": "Clearing Annual fee and exam fee",
                    "description": "Deposit the annual fee and exam fee of students"
                }
            ],
        }
        try {
            const res = await userService.createTxDescription(testProject);
            expect(res.success).to.equal(true);
            expect(res.message).to.equal('tx description created in db')
        } catch (err) {
            expect(err._message).to.equal('TxDescription validation failed')
        }
    })

    it('testing response for update notification', async () => {

        const res = await userModel.updateNotification('corp3', notification.txId);
        expect(res).to.be.a('object');
        expect(res.n).to.equal(1);
        expect(res.nModified).to.equal(1);
        expect(res.ok).to.equal(1);


    });
})







