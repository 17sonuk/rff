const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const invoke = require('../../fabric-sdk/invoke');
const query=require('../../fabric-sdk/query')
const fabricInvoke=
{
    invoke:invoke
}
// invoke.main()
const sinon = require("sinon");
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const { createSandbox } = require('sinon');
var auth;

describe('ESCROW ROUTER - /fund/reserve API', () => {
    it('testing reserve fund API when id field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp12'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/escrow/fund/reserve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            projectId: "",
            amount:"90"
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectID' field is missing or Invalid in the request")
    })

    it('testing reserve fund API when amount field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp12'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/escrow/fund/reserve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            projectId: "P90",
            amount:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('ESCROW ROUTER - /fund/reserve API SUCCESS', () => {
    let mockObj = ""
    // let mockOb=""

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        // mockOb=sinon.mock(["invoke"]);
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing reserve fund API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'corp12',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/escrow/fund/reserve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            projectId: "7cb5a5ad-29f1-478a-952d-89b22e7f3906",
            amount: "20"
          
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})