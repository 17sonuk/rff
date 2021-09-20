const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const userService = require('../../service/userService');

const registerUser = require('../../fabric-sdk/registerUser');
const abc = {
    registerUser: registerUser
}
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');


describe('USER ROUTER - ONBOARD API', () => {
    let mockObj = ""
    // let mockObj1= ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'registerUser');
        // mockObj1= sandbox.stub(registerUser, 'main');
    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();
    });

    it('testing onboard API for Ngo when there is no Bearer Token', async function () {
        mockObj.rejects('Bad Connection')
        // try{
        const response = await request(app)
            .post("/mongo/user/onboard")
            .send({
                firstName: "ngo2",
                lastName: " xyz",
                orgName: "ngo",
                userName: "ngo2",
                email: "ngo2@gmail.com",
                role: "Ngo",
                description: "some desc",
                address: {
                    addressLine1: "address1",
                    addressLine2: "address2",
                    city: "city1",
                    state: "state1",
                    zipCode: "123456",
                    country: "Brazil"
                },
                phone: [{
                    countryCode: "91",
                    phoneNumber: "8989897878"
                }],
                paymentDetails: {
                    paymentType: "Paypal",
                    paypalEmailId: "ngo@paypal.com",

                }
            });
        expect(response.status).to.equal(401);
    })
})
describe('USER ROUTER - ONBOARD API when there is bearer token', () => {
    let mockObj = ""
    let mockObj1 = ""

    let mockObj2 = ""
   
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'registerUser');
        mockObj1 = sandbox.stub(abc, 'registerUser');
        mockObj2 = sandbox.stub(userService, 'sendEmailForDonorRegistration');

    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        mockObj2.restore();

    });
    it('testing onboard API for Ngo when there is Bearer Token', async function () {
        const Data = {
            firstName: "ngo2",
            lastName: " xyz",
            orgName: "ngo",
            userName: "ngo25674599007",
            email: "ngo2@gmail.com",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",
            }
        }

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        let resp = {
            "success": true,
            "message": "User registered successfully"
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(Data)
        mockObj1.resolves(resp)
        mockObj1.resolves(null)


        const response = await request(app)
            .post("/mongo/user/onboard").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send(
                Data
            );
        expect(response.status).to.equal(200);
    });
})


describe('USER ROUTER - CHECKUSERNAME API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'checkUserNameValidty');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing checkUserNameValidity API', async function () {

        const dataVal = {
            firstName: "ngo2",
            lastName: " xyz",
            orgName: "ngo",
            userName: "ngo2",
            email: "ngo2@gmail.com",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",

            }
        }

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves(dataVal)

        const response = await request(app)
            .post("/mongo/user/checkUserNameValidity").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: "ngo2",
            });
        expect(response.body).to.be.eql(dataVal);


    })

    it('testing checkUserNameValidity API if user is already present', async function () {

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.rejects("User already exists")
        const response = await request(app)
            .post("/mongo/user/checkUserNameValidity").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: "ngo2",
            });
        expect(response.status).to.equal(500);

    })
})
describe('USER ROUTER - Profile API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'getUserDetails');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing Profile API', async function () {

        const dataVal = {
            firstName: "ngo2",
            lastName: " xyz",
            orgName: "ngo",
            userName: "ngo2",
            email: "ngo2@gmail.com",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",

            }
        }

        let payload = {
            orgName: 'ngo',
            userName: 'ngo2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves(dataVal)

        const response = await request(app)
            .get("/mongo/user/profile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: "ngo2",
            })
        expect(response.body).to.be.eql(dataVal);

        //If user is not present
        mockObj.rejects('Bad Connection')
        // try{
        const response1 = await request(app)
            .get("/mongo/user/profile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: "ngo3",
            })
        expect(response1.status).to.equal(500);
        // }catch(err){
        //     console.log("error:15",err)
        // }
    })
})

describe('USER ROUTER - /update API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'updateUserProfile');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing user update API', async function () {

        const dataVal = {
            firstName: "ngo2",
            lastName: " xyz",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",

            }
        }

        const dataVal1 = {
            firstName: "ngo2",
            lastName: " xyz",
            orgName: "ngo",
            userName: "ngo2",
            email: "ngo2@gmail.com",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",

            }
        }

        let payload = {
            orgName: 'ngo',
            userName: 'ngo2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves(null)
        const response = await request(app)
            .put("/mongo/user/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                dataVal
            })
        expect(response.status).to.equal(200);

        //If notif is not present
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .put("/mongo/user/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
            })
        expect(response1.status).to.equal(500);

        const response2 = await request(app)
            .put("/mongo/user/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                dataVal1
            })
        expect(response2.status).to.equal(500);
    })
})

describe('USER ROUTER - Redeem Account API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'getUserRedeemAccount');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing getUserRedeemAccount API', async function () {

        const dataVal = {
            firstName: "ngo2",
            lastName: " xyz",
            orgName: "ngo",
            userName: "ngo2",
            email: "ngo2@gmail.com",
            role: "Ngo",
            description: "some desc",
            address: {
                addressLine1: "address1",
                addressLine2: "address2",
                city: "city1",
                state: "state1",
                zipCode: "123456",
                country: "Brazil"
            },
            phone: [{
                countryCode: "91",
                phoneNumber: "8989897878"
            }],
            paymentDetails: {
                paymentType: "Paypal",
                paypalEmailId: "ngo@paypal.com",

            }
        }

        let payload = {
            orgName: 'ngo',
            userName: 'ngo2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves('ngo@paypal.com')

        const response = await request(app)
            .get("/mongo/user/redeemAccount").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                type: 'Paypal'
            })
            .send({
                userName: "ngo2",
            })
        expect(response.body).to.be.eql('ngo@paypal.com');

        //If data is not present
        mockObj.rejects('Unauthorized user')
        const response1 = await request(app)
            .get("/mongo/user/redeemAccount").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                type: 'Paypal'
            })
            .send({
                userName: "ngo4",
            })
        expect(response1.status).to.equal(500);
    })
})




describe('USER ROUTER - Notification API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'getNotifications');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing getNotifications API', async function () {

        const Notif = {
            userName: 'ca2345',
            txId: "t101",
            description: "Description",
            seen: true
        }
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves(Notif)
        const response = await request(app)
            .get("/mongo/user/notification/true").set("csrtoken", "Bearer " + token).set("testmode", "Testing")

            .send({
                name: 'ca.creditsauthority@csr.com',
            })
        expect(response.body).to.be.eql(Notif);

        //If notif is not present
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/user/notification/false").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                name: 'ca.creditsauthority@csr.com',

            })
        expect(response1.status).to.equal(500);
    })
})

describe('USER ROUTER - UpdateNotification API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'updateNotification');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing getNotifications API', async function () {

        const Notif = {
            userName: 'ca2345',
            txId: "t101",
            description: "Description",
            seen: true
        }
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

        mockObj.resolves(Notif)
        const response = await request(app)
            .put("/mongo/user/notification").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                name: 'ca.creditsauthority@csr.com',
                txId: "t101"
            })
        expect(response.body).to.be.eql(Notif);

        //If notif is not present
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .put("/mongo/user/notification").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                name: 'ca.creditsauthority@csr.com',
                txId: 't101'
            })
        expect(response1.status).to.equal(500);
    })
})


// describe('USER ROUTER - unapproved-users API', () => {
//     let mockObj = ""
//     beforeEach(() => {
//         mockObj = sandbox.stub(userService, 'getUnapprovedUserDetails');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });

//     it('testing getUnapprovedUserDetails API', async function () {

//         const dataVal1 = {
//             firstName: "corp67",
//             lastName: " xyz",
//             orgName: "corporate",
//             userName: "corp2",
//             email: "corp2@gmail.com",
//             role: "Corporate",
//             subRole: "Individual",
//             description: "some desc",
//             address: {
//                 addressLine1: "address1",
//                 addressLine2: "address2",
//                 city: "city1",
//                 state: "state1",
//                 zipCode: "123456",
//                 country: "Brazil"
//             },
//             phone: [{
//                 countryCode: "91",
//                 phoneNumber: "8989897878"
//             }],

//         }

//         let payload = {
//             orgName: 'creditsauthority',
//             userName: 'ca'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

//         mockObj.resolves(dataVal1)

//         const response = await request(app)
//             .get("/mongo/user/unapproved-users").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response.body).to.be.eql(dataVal1);

//         //If data is not present
//         mockObj.rejects('Bad Connection')
//         const response1 = await request(app)
//             .get("/mongo/user/unapproved-users").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response1.status).to.equal(500);
//     })
// })



// describe('USER ROUTER - reject-user API', () => {
//     let mockObj = ""
//     beforeEach(() => {
//         mockObj = sandbox.stub(userService, 'rejectUser');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });

//     it('testing rejectUser API', async function () {

//         const dataVal1 = {
//             firstName: "corp67",
//             lastName: " xyz",
//             orgName: "corporate",
//             userName: "corp2",
//             email: "corp2@gmail.com",
//             role: "Corporate",
//             subRole: "Individual",
//             description: "some desc",
//             address: {
//                 addressLine1: "address1",
//                 addressLine2: "address2",
//                 city: "city1",
//                 state: "state1",
//                 zipCode: "123456",
//                 country: "Brazil"
//             },
//             phone: [{
//                 countryCode: "91",
//                 phoneNumber: "8989897878"
//             }],

//         }

//         let payload = {
//             orgName: 'creditsauthority',
//             userName: 'ca'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });

//         mockObj.resolves(dataVal1)

//         const response = await request(app)
//             .post("/mongo/user/reject-user").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 userName: "corp2"
//             })
//         expect(response.body).to.be.eql(dataVal1);

//         //If data is not present
//         mockObj.rejects('Bad Connection')
//         const response1 = await request(app)
//             .post("/mongo/user/reject-user").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 userName: "corp2"
//             })
//         expect(response1.status).to.equal(500);
//     })
// })


