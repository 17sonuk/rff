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
const query = require('../../fabric-sdk/query');
const { orgModel } = require('../../model/models');

describe('BLOCKCHAIN QUERY ROUTER - /corporateReport-userProfile API with data', () => {
    let mockObj = ""
    let mockObj1 = ""

    let transactionList = [
        {
            "Key": "1F5875870S694602L",
            "Record": "{\"from\":\"gaurav.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":15}"
        },
        {
            "Key": "2GB23896580964930",
            "Record": "{\"from\":\"gaurav.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":5}"
        },
        {
            "Key": "5YR97758AA2527234",
            "Record": "{\"from\":\"gaurav.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":7}"
        },
        {
            "Key": "6ac2701b-a528-4726-a196-d7b1e0caae48",
            "Record": "{\"from\":\"gaurav.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":5}"
        },
        {
            "Key": "38E86180K2002884W",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"099bc587-771c-42c9-8d3b-57243ed9007f\",\"qty\":10}"
        },
        {
            "Key": "3CB53476UG519435E",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"099bc587-771c-42c9-8d3b-57243ed9007f\",\"qty\":25}"
        },
        {
            "Key": "3W390665LY2092431",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":1}"
        },
        {
            "Key": "4V331710SK675670A",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"099bc587-771c-42c9-8d3b-57243ed9007f\",\"qty\":10}"
        },
        {
            "Key": "5XE6001938620031F",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":3}"
        },
        {
            "Key": "69A28428W4252574C",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"099bc587-771c-42c9-8d3b-57243ed9007f\",\"qty\":5}"
        },
        {
            "Key": "6TR4859388618251E",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":10}"
        },
        {
            "Key": "6V985345JG7964613",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":2}"
        },
        {
            "Key": "88P27340CR5682312",
            "Record": "{\"from\":\"guest.corporate.csr.com\",\"objRef\":\"099bc587-771c-42c9-8d3b-57243ed9007f\",\"qty\":100}"
        },
        {
            "Key": "1A600833617779406",
            "Record": "{\"from\":\"testdonor.corporate.csr.com\",\"objRef\":\"8261be99-1f6a-4904-864b-f8505ada0af0\",\"qty\":25}"
        },
        {
            "Key": "1B619042GX529100S",
            "Record": "{\"from\":\"testdonor.corporate.csr.com\",\"objRef\":\"8261be99-1f6a-4904-864b-f8505ada0af0\",\"qty\":11}"
        },
        {
            "Key": "4L2988663B748482G",
            "Record": "{\"from\":\"testdonor.corporate.csr.com\",\"objRef\":\"29836be8-b694-4237-8cbd-02961fb30580\",\"qty\":22}"
        },
        {
            "Key": "5N335190JJ954443R",
            "Record": "{\"from\":\"testdonor.corporate.csr.com\",\"objRef\":\"8261be99-1f6a-4904-864b-f8505ada0af0\",\"qty\":14}"
        }
    ]

    let buffer = Buffer.from(JSON.stringify(transactionList));
    let orgList = [
        {
            firstName: 'Gaurav',
            lastName: 'Jena',
            userName: 'gaurav',
            email: 'gaurav.jena96@gmail.com',
            subRole: 'Individual'
        },
        {
            firstName: 'Samuel',
            lastName: 'Jackson',
            userName: 'bcorp',
            email: 'donor@gwave.com',
            orgName: 'Best Corp',
            subRole: 'Institution'
        },
        {
            firstName: 'First',
            lastName: 'Last',
            userName: 'testdonor',
            email: 'testdonor@gwave.com',
            orgName: 'GJ Corp',
            subRole: 'Institution'
        },
        {
            firstName: 'First',
            lastName: 'Last',
            userName: 'testdonor00',
            email: 'testdonor@csr.com',
            subRole: 'Individual'
        }
    ]



    beforeEach(() => {
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj1.restore();
        mockObj.restore();

    });
    it('testing blockchain query /corporateReport-userProfile API', async function () {
        mockObj1.resolves(orgList)
        mockObj.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/query/corporateReport-userProfile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                responseType: "json",
                year: "2021"
            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /corporateReport-userProfile API', () => {
    let mockObj = ""
    let mockObj1 = ""

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));
    let orgList = []


    beforeEach(() => {
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj1.restore();
        mockObj.restore();

    });
    it('testing blockchain query /corporateReport-userProfile API', async function () {
        mockObj1.resolves(orgList)
        mockObj.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/query/corporateReport-userProfile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                responseType: "json",
                year: "2021"
            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /ngoReport-userProfile API with data', () => {
    let mockObj = ""
    let mockObj1 = ""

    let transactionList = [
        {
            Key: 'c37bcdad-299e-45d9-b651-9c74aa155a38',
            Record: '{"from":"ca.creditsauthority.csr.com","objRef":"0cb2aa50-f850-4467-b27e-040b4e4f4c4b","qty":10,"to":"gwave.ngo.csr.com","txType":"ApproveRedeemRequest"}'
        },
        {
            Key: 'fdd9f954-7e6a-473c-8ec2-56cc7de806b1',
            Record: '{"from":"ca.creditsauthority.csr.com","objRef":"781e8001-6596-4a2f-ad1b-2e13d151bb3c","qty":5,"to":"gwave.ngo.csr.com","txType":"ApproveRedeemRequest"}'
        },
        {
            Key: '1A600833617779406',
            Record: '{"from":"testdonor.corporate.csr.com","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","qty":25,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '1B619042GX529100S',
            Record: '{"from":"testdonor.corporate.csr.com","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","qty":11,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '1F5875870S694602L',
            Record: '{"from":"gaurav.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":15,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '2GB23896580964930',
            Record: '{"from":"gaurav.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '38E86180K2002884W',
            Record: '{"from":"guest.corporate.csr.com","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":10,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '3CB53476UG519435E',
            Record: '{"from":"guest.corporate.csr.com","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":25,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '3W390665LY2092431',
            Record: '{"from":"guest.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":1,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '4L2988663B748482G',
            Record: '{"from":"testdonor.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":22,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '4V331710SK675670A',
            Record: '{"from":"guest.corporate.csr.com","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":10,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '5N335190JJ954443R',
            Record: '{"from":"testdonor.corporate.csr.com","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","qty":14,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '5XE6001938620031F',
            Record: '{"from":"guest.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":3,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '5YR97758AA2527234',
            Record: '{"from":"gaurav.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":7,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '69A28428W4252574C',
            Record: '{"from":"guest.corporate.csr.com","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":5,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '6TR4859388618251E',
            Record: '{"from":"guest.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":10,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '6V985345JG7964613',
            Record: '{"from":"guest.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":2,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '6ac2701b-a528-4726-a196-d7b1e0caae48',
            Record: '{"from":"gaurav.corporate.csr.com","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        },
        {
            Key: '88P27340CR5682312',
            Record: '{"from":"guest.corporate.csr.com","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":100,"to":"gwave.ngo.csr.com","txType":"TransferToken"}'
        }
    ]

    let buffer = Buffer.from(JSON.stringify(transactionList));
    let orgList = [
        {
            firstName: 'Alex',
            lastName: 'Smith',
            orgName: 'Greenwave Foundation',
            userName: 'gwave',
            email: 'ngo@gwave.com'
        },
        {
            firstName: 'Lewis',
            lastName: 'Hamilton',
            orgName: 'NatGeo',
            userName: 'natgeo',
            email: 'info@gwave.com'
        },
        {
            firstName: 'First',
            lastName: 'Last',
            orgName: 'Test Foundation',
            userName: 'ngotest',
            email: 'testngo@gwave.com'
        }
    ]



    beforeEach(() => {
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj1.restore();
        mockObj.restore();

    });
    it('testing blockchain query /ngoReport-userProfile API', async function () {
        mockObj1.resolves(orgList)
        mockObj.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/query/ngoReport-userProfile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        // .send({
        //     responseType: "json",
        //     year: "2021"
        // })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /ngoReport-userProfile API', () => {
    let mockObj = ""
    let mockObj1 = ""

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));
    let orgList = []


    beforeEach(() => {
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj1.restore();
        mockObj.restore();

    });
    it('testing blockchain query /ngoReport-userProfile API', async function () {
        mockObj1.resolves(orgList)
        mockObj.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/query/ngoReport-userProfile").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                responseType: "json",
                year: "2021"
            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /balance API SUCCESS', () => {
    let mockObj = ""
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));


    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
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
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /funds-raised-by-ngo API SUCCESS', () => {
    let mockObj = ""
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));


    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
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
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /getRecord/:recordKey API SUCCESS', () => {
    let mockObj = ""
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));


    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
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
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
    })
})

describe('BLOCKCHAIN QUERY ROUTER - /getRecord/:recordKey API SUCCESS with data', () => {
    let mockObj = ""
    let transactionList = [
        {
            Key: '29836be8-b694-4237-8cbd-02961fb30580',
            Record: '{"actualStartDate":0,"approvalState":"Approved","balance":0,"comments":"","contributions":{"gaurav.corporate.csr.com":{"contributionQty":32,"donatorAddress":"gaurav.corporate.csr.com"},"guest.corporate.csr.com":{"contributionQty":16,"donatorAddress":"guest.corporate.csr.com"},"testdonor.corporate.csr.com":{"contributionQty":22,"donatorAddress":"testdonor.corporate.csr.com"}},"contributors":{"gaurav.corporate.csr.com":"exists","guest.corporate.csr.com":"exists","testdonor.corporate.csr.com":"exists"},"creationDate":1632119302889,"docType":"Project","ngo":"gwave.ngo.csr.com","phases":[{"caValidation":{"comments":"not yet","isValid":false},"endDate":1632940200000,"outstandingQty":149930,"phaseState":"Partially Funded","qty":150000,"startDate":1632076200000,"validationCriteria":{"milestone 101":[]}}],"place":"greece","projectName":"Prásinos Greek","projectState":"Partially Funded","projectType":"Forest Protection","totalProjectCost":150000,"totalReceived":70,"totalRedeemed":15}'
        }
    ]

    let buffer = Buffer.from(JSON.stringify(transactionList));


    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
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
            .get("/query/getRecord/:29836be8-b694-4237-8cbd-02961fb30580").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
    })
})

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



// describe('BLOCKCHAIN QUERY ROUTER - /getRecord/:recordKey API', () => {
//     it('testing blockchain query router API when recordKey field is empty', async function () {
//         let payload = {
//             userName: 'guest',
//             orgName: 'corporate'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/getRecord/:recordKey").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'recordKey' field is missing or Invalid in the request")
//     });
// })



// describe('BLOCKCHAIN QUERY ROUTER - /amount-parked API', () => {
//     it('testing blockchain query router API when projectId field is empty', async function () {
//         let payload = {
//             userName: 'corp1',
//             orgName: 'corporate'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/amount-parked").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 projectId: ""
//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
//     });
// })

// describe('BLOCKCHAIN QUERY ROUTER - /amount-parked API SUCCESS', () => {
//     let mockObj = ""
//     // let finalres={
//     //     getmessage:{
//     //         success: true,
//     //         message: "CommonQuery successful"
//     //     },
//     //     records:"1"
//     // }
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain query /amount-parked API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'corp1',
//             orgName: 'corporate'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/amount-parked").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 projectId: "p01"
//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//     })
// })

// describe('BLOCKCHAIN QUERY ROUTER - /it-report API', () => {
//     it('testing blockchain query router API when responseType field is empty', async function () {
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "" })
//             .query({
//                 year: "2021"
//             })
//         // .send({
//         //     responseType:"",
//         //     // year:"2021"
//         // })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'responseType' field is missing or Invalid in the request")
//     });

//     it('testing blockchain query router API when year field is empty', async function () {
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)

//             .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "json" })
//             .query({
//                 year: ""
//             })
//         // .send({
//         //     responseType:"json"
//         // })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'year' field is missing or Invalid in the request")
//     });
// })

// describe('BLOCKCHAIN QUERY ROUTER - /it-report API SUCCESS', () => {
//     let mockObj = ""
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain query /it-report API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/it-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "json" })
//             .query({
//                 year: "2021"
//             })
//         // .send({
//         //     responseType:"json",
//         // })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//     })
// })



// describe('BLOCKCHAIN QUERY ROUTER - /ngo-report API', () => {
//     let mockObj = ""
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));


//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain query /ngo-report API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/ngo-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 responseType: "json",
//                 year: "2021"
//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//     })
// })

// describe('BLOCKCHAIN QUERY ROUTER - /ngo-contribution-details API', () => {
//     it('testing blockchain query router API when ngoName field is empty', async function () {
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/ngo-contribution-details").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 ngoName: ""
//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'ngoName' field is missing or Invalid in the request")
//     });
// })

// describe('BLOCKCHAIN QUERY ROUTER - /ngo-contribution-details API SUCCESS', () => {
//     let mockObj = ""
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));


//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain query /ngo-contribution-details API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/ngo-contribution-details").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 ngoName: "goonj"
//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//     })
// })



// describe('BLOCKCHAIN QUERY ROUTER - /corporate-contributions API', () => {
//     let mockObj = ""
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));


//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain query /corporate-contributions API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/query/corporate-contributions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//     })
// })