const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const commonService = require('../../service/commonService');
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');

describe('COMMON ROUTER - community API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'saveCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing save communities api', async function () {

        const communities = {
            name: "TestUser12",
            place: "Test12"
        }

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(communities)
        const response = await request(app)
            .post("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                communities
            });
        expect(response.body).to.be.eql(communities);

        //If communities fields are empty
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .post("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({

            });
        expect(response1.status).to.equal(500);
    })
})

describe('COMMON ROUTER - All community API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'getCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing getCommunities api', async function () {

        const communities = {
            name: "TestUser12",
            place: "Test12"
        }

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(communities)
        const response = await request(app)
            .get("/mongo/common/community/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response.body).to.be.eql(communities);

        //If No community is presnt
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/common/community/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response1.status).to.equal(500);
    })
})

describe('COMMON ROUTER - getCommunity API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'getCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing getCommunity api', async function () {

        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        let communityId='4567'

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(communities)
        const response = await request(app)
            .get("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                communityId:communityId
            })
        expect(response.body).to.be.eql(communities);

        //If No community is presnt
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response1.status).to.equal(500);
    })
})


describe('COMMON ROUTER - update-community API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'updateCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing update-community api', async function () {

        const communities = {
            name: "TestUser12",
            place: "Test12"
        }

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(null)
        const response = await request(app)
            .put("/mongo/common/update-community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                'communityId': "23",
                'name': "df",
                'place': 'dfg',
                'paymentDetails': '{paypal}'
            });
        expect(response.status).to.equal(200);

        // expect(response.body).to.be.eql(communities);

        //If communities fields are empty
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .put("/mongo/common/update-community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({

            });
        expect(response1.status).to.equal(500);
    })
})

describe('COMMON ROUTER - deleteCommunities API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'deleteCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing deleteCommunities api', async function () {

        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        let communityIds=['4567']

        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(null)
        const response = await request(app)
            .put("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                communityIds
            });
        expect(response.status).to.equal(200);

        // expect(response.body).to.be.eql(communities);

        //If communities fields are empty
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .put("/mongo/common/community").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({

            });
        expect(response1.status).to.equal(500);
    })
})

describe('COMMON ROUTER - listed API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonService, 'getListedCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing listed api', async function () {

        const communityIds = []
        let communities={}

        let payload = {
            orgName: 'ngo',
            userName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(communities)
        const response = await request(app)
            .post("/mongo/common/community/listed").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                communityIds
            });
        expect(response.status).to.equal(200);

        // expect(response.body).to.be.eql(communities);

        //If communities fields are empty
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .post("/mongo/common/community/listed").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({

            });
        expect(response1.status).to.equal(500);
    })
})

// describe('COMMON ROUTER - getDonors API', () => {
//     let mockObj = ""
//     beforeEach(() => {
//         mockObj = sandbox.stub(commonService, 'getDonors');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing getDonors api', async function () {

//         const donors = {
//             name: "TestUser12",
//             email: "Test12@gmail.com"
//         }

//         let payload = {
//             orgName: 'creditsauthority',
//             userName: 'ca'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         mockObj.resolves(donors)
//         const response = await request(app)
//             .get("/mongo/common/donor").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response.body).to.be.eql(donors);

//         //If No community is presnt
//         mockObj.rejects('Bad Connection')
//         const response1 = await request(app)
//             .get("/mongo/common/donor").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response1.status).to.equal(500);
//     })
// })
