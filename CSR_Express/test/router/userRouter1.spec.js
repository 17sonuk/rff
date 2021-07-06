const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const userService = require('../../service/userService');
const sinon = require("sinon");
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
var auth;


describe('USER ROUTER - ONBOARD API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(userService, 'registerUser');
    });
    afterEach(() => {
        mockObj.restore();
    });

    it('testing onboard API for Ngo when there is no Bearer Token', async function () {
        mockObj.resolves('Bad Connection')
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
        //    console.log("Response-Onboard:",response.)
        expect(response.status).to.equal(401);
        // }catch(err){
        //     console.log("error:",err)
        //     expect(err.status).to.equal(401)
        // }
    })

//     it('testing onboard API for Ngo when there is Bearer Token', async function () {
//         const Data = {
//             firstName: "ngo2",
//             lastName: " xyz",
//             orgName: "ngo",
//             userName: "ngo2",
//             email: "ngo2@gmail.com",
//             role: "Ngo",
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
//             paymentDetails: {
//                 paymentType: "Paypal",
//                 paypalEmailId: "ngo@paypal.com",
//             }
//         }

//         let payload = {
//             orgName: 'creditsauthority',
//             userName: 'ca'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         mockObj.resolves(Data)

//         const response = await request(app)
//             .post("/mongo/user/onboard").set("csrtoken", "Bearer " + token)
//             .send({
//                 firstName: "ngo2",
//                 lastName: " xyz",
//                 orgName: "ngo",
//                 userName: "ngo2",
//                 email: "ngo2@gmail.com",
//                 role: "Ngo",
//                 description: "some desc",
//                 address: {
//                     addressLine1: "address1",
//                     addressLine2: "address2",
//                     city: "city1",
//                     state: "state1",
//                     zipCode: "123456",
//                     country: "Brazil"
//                 },
//                 phone: [{
//                     countryCode: "91",
//                     phoneNumber: "8989897878"
//                 }],
//                 paymentDetails: {
//                     paymentType: "Paypal",
//                     paypalEmailId: "ngo@paypal.com",

//                 }
//             });
//         console.log("Response in onboard API- Ngo:", response)
//         expect(response.status).to.equal(200);
//         expect(response.text).to.equal('"success":true,"message":"User onboarded successfully!"')
//     });
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
        mockObj.resolves(true)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        console.log("Token:",token)
        const response = await request(app)
            .post("/mongo/user/checkUserNameValidity").set("authorization", "Bearer " + token)
            .send({ 
                userName: "ngo2",
            });
        console.log("Response in checkUserNameValidity API12", response.text)
        console.log("Response in checkUserNameValidity API", response.header)
        console.log("Response in checkUserNameValidity API", response.body)
        console.log("Response in checkUserNameValidity API", response.status)
        expect(response.status).to.equal(200);

    })
})