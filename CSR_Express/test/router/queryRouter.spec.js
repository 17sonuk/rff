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



// describe('BLOCKCHAIN QUERY ROUTER - /funds-raised-by-ngo API', () => {
//     it('testing blockchain project router API when projectId field is empty', async function () {
//         let payload = {
//             userName: 'ngo1',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//         .get("/query/funds-raised-by-ngo").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
//     });
// })

describe('BLOCKCHAIN QUERY ROUTER - /funds-raised-by-ngo API SUCCESS', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query funds-raised-by-ngo API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ngo1',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/funds-raised-by-ngo").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /getRecord/:recordKey API', () => {
    it('testing blockchain query router API when recordKey field is empty', async function () {
        let payload = {
            userName: 'guest',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/getRecord/:recordKey").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'recordKey' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN QUERY ROUTER - /getRecord/:recordKey API SUCCESS', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /getRecord/:recordKey API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'guest',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/getRecord/:1").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /amount-parked API', () => {
    it('testing blockchain query router API when projectId field is empty', async function () {
        let payload = {
            userName: 'corp1',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/amount-parked").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            projectId:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN QUERY ROUTER - /amount-parked API SUCCESS', () => {
    let mockObj = ""
    // let finalres={
    //     getmessage:{
    //         success: true,
    //         message: "CommonQuery successful"
    //     },
    //     records:"1"
    // }
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /amount-parked API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'corp1',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/amount-parked").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            projectId:"p01"
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /it-report API', () => {
    it('testing blockchain query router API when responseType field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({responseType:""})
        .query({
            year:"2021"
        })
        // .send({
        //     responseType:"",
        //     // year:"2021"
        // })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'responseType' field is missing or Invalid in the request")
    });

    it('testing blockchain query router API when year field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        
        .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({responseType:"json"})
        .query({
            year:""
        })
        // .send({
        //     responseType:"json"
        // })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'year' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN QUERY ROUTER - /it-report API SUCCESS', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /it-report API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({responseType:"json"})
        .query({
            year:"2021"
        })
        // .send({
        //     responseType:"json",
        // })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})



describe('BLOCKCHAIN QUERY ROUTER - /ngo-report API', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /ngo-report API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/ngo-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            responseType:"json",
            year:"2021"
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /ngo-contribution-details API', () => {
    it('testing blockchain query router API when ngoName field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/ngo-contribution-details").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            ngoName:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'ngoName' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN QUERY ROUTER - /ngo-contribution-details API SUCCESS', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /ngo-contribution-details API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/ngo-contribution-details").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            ngoName:"goonj"
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /balance API SUCCESS', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query balance API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ngo1',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/balance").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /corporate-contributions API', () => {
    let mockObj = ""
    let transactionList=[]
    let buffer=Buffer.from(JSON.stringify(transactionList));
    
    
    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain query /corporate-contributions API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/query/corporate-contributions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})