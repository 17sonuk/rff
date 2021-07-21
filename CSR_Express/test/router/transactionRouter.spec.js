const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
const sinon = require("sinon");
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const { createSandbox } = require('sinon');
var auth;
const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');


describe('BLOCKCHAIN TRANSACTION ROUTER - /parked-by-corporate API', () => {
    it('testing blockchain transaction router API when parked field is empty', async function () {
        let payload = {
            userName: 'corp1',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/tx/parked-by-corporate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            parked: ""

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'parked' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN TRANSACTION ROUTER - /parked-by-corporate API SUCCESS', () => {
    let mockObj = ""
    let msg=[]
    let buffer=Buffer.from(JSON.stringify(msg));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
        // mockObj1 = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();
    });
    it('testing blockchain transaction parked-by-corporate API', async function () {
        mockObj.resolves(buffer)
        // mockObj1.resolves(finalres)
        let payload = {
            userName: 'corp1',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/tx/parked-by-corporate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            parked:true
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})