const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
const commonService = require('../../service/commonService')
const projectModel = require('../../model/projectModel');
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
let fabricInvoke={};
fabricInvoke.invoke=invoke;


describe('TOKEN ROUTER - /request API', () => {
    it('testing token router API when amount field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "",
            paymentId:"10001",
            paymentStatus:"COMPLETED"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    });

    it('testing token router API when paymentId field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "90",
            paymentId:"",
            paymentStatus:"COMPLETED"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentId' field is missing or Invalid in the request")
    });

    it('testing token router API when paymentStatus field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp2'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "90",
            paymentId:"10001",
            paymentStatus:""

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentStatus' field is missing or Invalid in the request")
    });
});

describe('TOKEN ROUTER - /request API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing token request API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'corp2',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "90",
            paymentId:"10001",
            paymentStatus:"COMPLETED"
          
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})


describe('TOKEN ROUTER - /assign API', () => {
    it('testing token router API when paymentId field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/assign").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentId' field is missing or Invalid in the request")
    });

});

describe('TOKEN ROUTER - /assign API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing token assign API', async function () {
        mockObj.resolves(null)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/assign").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:"10001"
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})


describe('TOKEN ROUTER - /reject API', () => {
    it('testing token router API when paymentId field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:"",
            comment:"dsfgj"
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentId' field is missing or Invalid in the request")
    });

    it('testing token router API when comment field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:"10001",
            comment:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'comment' field is missing or Invalid in the request")
    });

});

describe('TOKEN ROUTER - /reject API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing token reject API', async function () {
        mockObj.resolves(null)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:"10001",
            comment:"dsfgj"
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})

describe('TOKEN ROUTER - /transfer API', () => {
    it('testing token router API when amount field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:"sgdfhs"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    });

    it('testing token router API when projectId field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "90",
            projectId:"",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:"sgdfhs"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing token router API when phaseNumber field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "200",
            projectId:"p01",
            phaseNumber:"",
            notes:"Requested",
            donorDetails:"sgdfhs"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'phaseNumber' field is missing or Invalid in the request")
    });

    it('testing token router API when donorDetails field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "200",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:""

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'donorDetails' field is missing or Invalid in the request")
    });

    it('testing token router API when donor email id field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "200",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:{email:""}

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'donor email id' field is missing or Invalid in the request")
    });

    it('testing token router API when donor name field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "200",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:{email:"aji@gmail.com",name:""}

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'donor name' field is missing or Invalid in the request")
    });

    it('testing token router API when paymentId field is empty', async function () {
        let payload = {
            orgName: 'corporate',
            userName: 'guest'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            // userName:"guest",
            amount: "200",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:{email:"guest@gmail.com",name:"guest",paymentId:""}

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentId' field is missing or Invalid in the request")
    });
});

describe('TOKEN ROUTER - /transfer API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""
    let mockObj2 = ""
    let mockres={
            success:true,
            message:"Transferred succesfully"
        }
    let donor="corp1@gmail.com"
    beforeEach(() => {
        console.log(typeof invoke)
        mockObj = sandbox.stub(invoke,'main');
        mockObj1 = sandbox.stub(projectService, 'addContributor');
        mockObj2 = sandbox.stub(commonService, 'saveDonor');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        mockObj2.restore();
    });
    it('testing token transfer API', async function () {
        mockObj.resolves(null)
        mockObj1.resolves(mockres);
        mockObj2.resolves(donor)
        let payload = {
            userName: 'corp1',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/transfer").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            amount: "200",
            projectId:"p01",
            phaseNumber:"0",
            notes:"Requested",
            donorDetails:{email:"aji@gmail.com",name:"aji",paymentId:"2345678"}
          
        })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})

describe('TOKEN ROUTER - /all-requests API', () => {
    it('testing token router API when pageSize field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/token/all-requests").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            pageSize:"",
            status:"true"
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'pageSize' field is missing or Invalid in the request")
    });

    it('testing token router API when status field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/token/all-requests").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            pageSize:2000,
            status:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'status' field is missing or Invalid in the request")
    });

    it('testing token router API when unauthorised use', async function () {
        let payload = {
            orgName: 'guest',
            userName: 'guest'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/token/all-requests").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            pageSize:10,
            status:"true"
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("Unauthorised token tx request access...")
    });

});

describe('TOKEN ROUTER - /all-requests API SUCCESS', () => {
    let mockObj = ""
    let msg={
        Results:[],
        RecordsCount:'0',
        Bookmark:'nil'
    }
    var buffer = Buffer.from(JSON.stringify(msg));

    beforeEach(() => {
        mockObj = sandbox.stub(query,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing token all-request API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/token/all-requests").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            pageSize:"1",
            bookmark:"",
            status:"Requested"
        })
        // .send({
        //     // qString: JSON.stringify(queryString),
        //     pageSize:"1",
        //     bookmark:"",
        //     status:"Requested"
        // })
        console.log("Resp23:",response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
    
})