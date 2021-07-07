const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const commonService = require('../../service/commonService');
const sinon = require("sinon");
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const { createSandbox } = require('sinon');
var auth;

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