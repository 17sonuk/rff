const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { exception } = require('node:console');
const request = require('supertest');
const userService = require('../../service/userService');
// const app = require('../../routers/mongo/userRoute')
// const express = require('express');
// const app = express()
const sinon = require("sinon");
const app = require('../../app')
const { connectionToMongo, disconnectMongo } = require('../../model/connection')
chai.use(chaiAsPromised)

// const { expect } = require('chai')
// const request = require('supertest')
// // const model = require('../src/model/user')
// const app = 'http://localhost:4001/'
// const { connection } = require('mongoose')
// const { response } = require('express')
// const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')
// const { service } = require('../src/service/user')

describe('USER ROUTER - Testing app get routing', () => {
   

})

describe('USER ROUTER - Testing app post routing', () => {
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

    it('testing onboard API for Ngo when there is no Bearer Token', async function() {
        try{
         const registerUserStub = sinon.stub(userService, "registerUser").resolves({ success: false });
         
         const response = await request(app)
            // .set("Authorization", "Bearer " + token)
            .post("/mongo/user/onboard")
            .send({ 
                firstName: "ngo2",
                lastName: " xyz",
                orgName: "ngo2",
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
                    paypalEmailId : "ngo@paypal.com",
                    
                }
            });
        expect(response.status).to.equal(200); 
        }catch(err){
            console.log("Error:",err)
            exception(err).to.equal('Unauthorized user')
            sinon.assert.calledOnce(registerUserStub);
        }
    });

    it('testing onboard API for Corporate', async function() {
        
        // const token=userService.login('ca@csr.com')
        const response = await request(app)
            // .set("Authorization", "Bearer " + token)
            .post("/mongo/user/onboard")
            .send({ 
                firstName: "Harry",
                lastName: " James",
                orgName: "corp1002",
                userName: "corp13",
                email: "corp13@gmail.com",
                role: "Corporate",
                subRole: "Individual",
                description: "some desc",
                address: {
                    addressLine1: "address19",
                    addressLine2: "address29",
                    city: "city1",
                    state: "state1",
                    zipCode: "123456",
                    country: "Brazil"
                },
                phone: [{
                    countryCode: "91",
                    phoneNumber: "898989"
                }],
            });
            console.log("Response in onboard API- corporate:",rsponse)
        expect(response.status).to.equal(200); 
       
    });
   
})