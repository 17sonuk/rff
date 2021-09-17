const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
const commonService = require('../../service/commonService')
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET } = process.env;
var jwt = require('jsonwebtoken');
const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const { COINBASE_API_KEY, COINBASE_WEBHOOK_SECRET } = process.env;

const { Client, resources, Webhook } = require('coinbase-commerce-node');
Client.init(COINBASE_API_KEY);
const { Charge } = resources;
const paymentService = require('../../routers/payment-gateway/paymentService');
const messages = require('../../loggers/messages')


describe('PSP ROUTER - /coinbase/charge API', () => {

    it('testing psp router API when request type field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"",
                payload:payl,
                userName:"aj"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'request type' field is missing or Invalid in the request")
    });

    it('testing psp router API when payload field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:"",
                userName:"aj"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'payload' field is missing or Invalid in the request")
    });

    it('testing psp router API when amount field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    });

    

    it('testing psp router API when userName field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:""
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'userName' field is missing or Invalid in the request")
    });

    it('testing psp router API when projectId field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing psp router API when donorDetails field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:""
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'donorDetails' field is missing or Invalid in the request")
    });

    it('testing psp router API when email field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'email' field is missing or Invalid in the request")
    });

    it('testing psp router API when name field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:""
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'name' field is missing or Invalid in the request")
    });



});

describe('PSP ROUTER - /coinbase/charge API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(Charge, 'create');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing psp coinbase/charge API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'corp2',
            orgName: 'corporate'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                requestType:"FundRequest",
                payload:payl,
                userName:"aj"

            })
        console.log("Resp23:", response.body)
        expect(response.status).to.equal(200)

        // expect(response.body.success).to.equal(true)
    })

})

describe('PSP ROUTER - /coinbase/chargeStatus API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""

    beforeEach(() => {
        mockObj1 = sandbox.stub(Webhook, 'verifySigHeader');
        mockObj = sandbox.stub(paymentService, 'saveTx');

    });
    afterEach(() => {
        mockObj1.restore();
        mockObj.restore();

    });
    it('testing psp /coinbase/chargeStatus API', async function () {
        mockObj1.resolves(true)
        mockObj.resolves(null)

        let payload = {
            userName: 'corp2',
            orgName: 'corporate'
        }
        let donorDetails={
            email:"aj@gmail.com",
            name:"aj"
        }
        let payl={
            amount: "34",
            projectId:"p01",
            donorDetails:donorDetails
        }
        let event={
            metadata:{
                userName:"corp2",
                payload:payl,
                requestType:'FundRequest'
            }
                ,
            type:"transfer",
            id:"456"
        }
        
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/psp/coinbase/chargeStatus").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send(
                event
            )
        console.log("Resp23:", response.body)
        expect(response.status).to.equal(400)
    })

})