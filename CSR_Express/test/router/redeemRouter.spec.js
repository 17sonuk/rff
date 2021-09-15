const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');

describe('REDEEM ROUTER - /request API', () => {
    it('testing redeem router API when quantity field is empty', async function () {
        let qty=""
        let paymentDetails={
                paymentType:'Paypal',
                paypalEmailId:'paypal@pay.com'
            }
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'quantity' field is missing or Invalid in the request")
    });

    it('testing redeem router API when paymentDetails field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty=100
        let paymentDetails=""
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentDetails' field is missing or Invalid in the request")
    });

    it('testing redeem router API when payment type field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="3456"
        let paymentDetails={
                paymentType:'sdfg',
                paypalEmailId:'paypal@pay.com'
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'payment type' field is missing or Invalid in the request")
    });

    it('testing redeem router API when paypal email id of beneficiary field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="345"
        let paymentDetails={
                paymentType:'Paypal',
                paypalEmailId:""
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paypal email id of beneficiary' field is missing or Invalid in the request")
    });

    it('testing redeem router API when crypto address of beneficiary field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Cryptocurrency',
                cryptoAddress:""
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'crypto address of beneficiary' field is missing or Invalid in the request")
    });

    it('testing redeem router API when bank account details of beneficiary field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:""
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'bank account details of beneficiary' field is missing or Invalid in the request")
    });

    it('testing redeem router API when is US bank field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:undefined,
                    bankName:"CityBank",
                    bankAddress:{
                        city:"Nairobi",
                        country:"Kenya"
                    },
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'is US bank' field is missing or Invalid in the request")
    });

    it('testing redeem router API when bank name is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"",
                    bankAddress:{
                        city:"Nairobi",
                        country:"Kenya"
                    },
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'bank name' field is missing or Invalid in the request")
    });

    it('testing redeem router API when bank address is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"CityBank",
                    bankAddress:"",
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'bank address' field is missing or Invalid in the request")
    });

    it('testing redeem router API when bank address city field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"CityBank",
                    bankAddress:{
                        city:"",
                        country:"Kenya"
                    },
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'bank address city' field is missing or Invalid in the request")
    });

    it('testing redeem router API when bank address country field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"CityBank",
                    bankAddress:{
                        city:"Nairobi",
                        country:""
                    },
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'bank address country' field is missing or Invalid in the request")
    });

    it('testing redeem router API when currency type field is empty', async function () {
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"CityBank",
                    bankAddress:{
                        city:"Nairobi",
                        country:"Kenya"
                    },
                    currencyType:""
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'currency type' field is missing or Invalid in the request")
    });
    
});

describe('REDEEM ROUTER - /request API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing REDEEM request API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        let qty="2345"
        let paymentDetails={
                paymentType:'Bank',
                bankDetails:{
                    isUSBank:"true",
                    bankName:"CityBank",
                    bankAddress:{
                        city:"Nairobi",
                        country:"Kenya"
                    },
                    currencyType:"USD"
                }
            }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/request").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            qty: qty,
            paymentDetails:paymentDetails
          
        })
        expect(response.body.success).to.equal(true)
    })
    
})

describe('REDEEM ROUTER - /approve API', () => {
    it('testing redeem router API when redeemId field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/approve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "",
            paymentId:"34556"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'redeemId' field is missing or Invalid in the request")
    });

    it('testing redeem router API when paymentId field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/approve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "3456",
            paymentId:""

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'paymentId' field is missing or Invalid in the request")
    });
});

describe('REDEEM ROUTER - /approve API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing REDEEM approve API', async function () {
        mockObj.resolves(null)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/approve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "34567",
            paymentId:"34556"
          
        })
        expect(response.body.success).to.equal(true)
    })
    
})

describe('REDEEM ROUTER - /reject API', () => {
    it('testing redeem router API when redeemId field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "",
            rejectionComments:"dfghdf"

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'redeemId' field is missing or Invalid in the request")
    });

    it('testing redeem router API when rejectionComments field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "3456",
            rejectionComments:""

        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'rejectionComments' field is missing or Invalid in the request")
    });
});

describe('REDEEM ROUTER - /reject API SUCCESS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(invoke,'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing REDEEM reject API', async function () {
        mockObj.resolves(null)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .post("/redeem/reject").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .send({
            redeemId: "34567",
            rejectionComments:"sdfghj"
          
        })
        expect(response.body.success).to.equal(true)
    })
    
})

describe('REDEEM ROUTER - /request/all API', () => {
    it('testing redeem router API when pageSize field is empty', async function () {
        let qstring={
            "pageSize":"",
            "status":"Requested",
            "bookmark":""
        }
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/redeem/request/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            status:"Requested",
            bookmark:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'pageSize' field is missing or Invalid in the request")
    });

    it('testing redeem router API when status field is empty', async function () {
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/redeem/request/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            pageSize:10,
            status:"",
            bookmark:""
        })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'status' field is missing or Invalid in the request")
    });

});

describe('REDEEM ROUTER - /request/all API SUCCESS', () => {
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
    it('testing redeem request API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            orgName: 'creditsauthority',
            userName: 'ca'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
        .get("/redeem/request/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        .query({
            pageSize:10,
            status:"Requested",
            bookmark:""
        })
        expect(response.body.success).to.equal(true)
    })
    
})