const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
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
let fabricInvoke={};
fabricInvoke.invoke=invoke;
// const fabricInvoke=
// {
//     invoke:invoke
// }

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
    // let mockObj1 = ""
    // let mockObj2 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
        // mockObj1 = sandbox.stub(nil, nil);
        // mockObj2 = sandbox.stub(nil, nil);
    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();
        // mockObj2.restore();
    });
    it('testing token request API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(null)
        // mockObj2.resolves(null)
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
    // let mockObj1 = ""
    // let mockObj2 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
        // mockObj1 = sandbox.stub(nil, nil);
        // mockObj2 = sandbox.stub(nil, nil);
    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();
        // mockObj2.restore();
    });
    it('testing token assign API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(null)
        // mockObj2.resolves(null)
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
    // let mockObj1 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
        // mockObj1 = sandbox.stub(nil, nil);
    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();
    });
    it('testing token reject API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(null)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/token/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            paymentId:"10001"
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
    // let mockObj2 = ""
    beforeEach(() => {
        console.log(typeof invoke)
        mockObj = sandbox.stub(invoke,'main');
        mockObj1 = sandbox.stub(projectModel, 'addContributor');
        // mockObj2 = sandbox.stub(nil, nil);
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        // mockObj2.restore();
    });
    it('testing token transfer API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(null)
        // mockObj2.resolves(null)
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

    it('testing response for addContributor', async () => {
        const testProject = {
            "contributorsList": ['corp1'],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
            "place": "Mumbai",
            "description": "Mysuru public school provide high quality school education to rural children in India who cannot otherwise access or afford it. The schools adopt a nurturing, holistic approach to education, helping children learn joyfully. 61% of the children get full scholarships while rest pay a subsidized fee. Your donation goes towards critical infrastructure like learning material, classrooms, school bus, etc.",
            "phases": [
                {
                    "phaseName": "Registration of students",
                    "description": "Enrollment of students in a school."
                },
                {
                    "phaseName": "Allotment of study materials",
                    "description": "Distribute the books and stationary to the students"
                },
                {
                    "phaseName": "Clearing Annual fee and exam fee",
                    "description": "Deposit the annual fee and exam fee of students"
                }
            ],
        }
        mockObj1.resolves(testProject);
        let res = await projectService.addContributor('p01','corp1')
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj1.resolves(null);
        try{
            let res = await projectService.addContributor('p06','corp3')
            expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
    
})