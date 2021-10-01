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
const { orgModel, donorModel, projectModel } = require('../../model/models')
const messages = require('../../loggers/messages')

describe('BLOCKCHAIN UTILS ROUTER - /yearly-report API SUCCESS with data to excel', () => {
    let mockObj = ""
    let mockObj1 = ""
    let mockObj2 = ""
    let mockObj3 = ""


    let fResp = [
        {
            Key: '6TR4859388618251E',
            Record: '{"date":1632119396112,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 6TR4859388618251E\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '6ac2701b-a528-4726-a196-d7b1e0caae48',
            Record: '{"date":1632119484548,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '6V985345JG7964613',
            Record: '{"date":1632133831879,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 6V985345JG7964613\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":2,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '2GB23896580964930',
            Record: '{"date":1632134115706,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5XE6001938620031F',
            Record: '{"date":1632136269300,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 5XE6001938620031F\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":3,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1F5875870S694602L',
            Record: '{"date":1632136383208,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":15,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '3W390665LY2092431',
            Record: '{"date":1632136800830,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 3W390665LY2092431\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":1,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '88P27340CR5682312',
            Record: '{"date":1632211323124,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 88P27340CR5682312\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":100,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '69A28428W4252574C',
            Record: '{"date":1632302455780,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 69A28428W4252574C\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5YR97758AA2527234',
            Record: '{"date":1632303980100,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","paymentMode":"PayPal","qty":7,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '38E86180K2002884W',
            Record: '{"date":1632922238168,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 38E86180K2002884W\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '3CB53476UG519435E',
            Record: '{"date":1632923520443,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 3CB53476UG519435E\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":25,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '4V331710SK675670A',
            Record: '{"date":1632923831455,"from":"guest.corporate.csr.com","notes":"aj@gmail.com\\nPaymentId - 4V331710SK675670A\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1A600833617779406',
            Record: '{"date":1632923908729,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":25,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5N335190JJ954443R',
            Record: '{"date":1632923976018,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":14,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '4L2988663B748482G',
            Record: '{"date":1632924089184,"from":"testdonor.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","paymentMode":"PayPal","qty":22,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1B619042GX529100S',
            Record: '{"date":1632924120785,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":11,"to":"gwave.ngo.csr.com"}'
        }
    ]



    let orgs = [
        {
            firstName: 'Gaurav',
            lastName: 'Jena',
            userName: 'gaurav',
            email: 'gaurav.jena96@gmail.com',
            subRole: 'Individual'
        },
        {
            firstName: 'First',
            lastName: 'Last',
            userName: 'testdonor',
            email: 'testdonor@gwave.com',
            orgName: 'GJ Corp',
            subRole: 'Institution'
        }
    ]


    let pr = [
        {
            projectName: 'Grün',
            projectId: '099bc587-771c-42c9-8d3b-57243ed9007f'
        },
        {
            projectName: 'Prásinos Greek',
            projectId: '29836be8-b694-4237-8cbd-02961fb30580'
        },
        {
            projectName: 'Green',
            projectId: '8261be99-1f6a-4904-864b-f8505ada0af0'
        }
    ]

    let dono = [{
        email: "aj@gmail.com",
        name: "aj"
    },
    {
        email: "aj@gmail.com"
    }]

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(fResp));
    console.log(buffer)
    let orgModelList = []
    let donorModelList = []
    let projectModelList = []

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj2 = sandbox.stub(donorModel, 'find');
        mockObj3 = sandbox.stub(projectModel, 'find');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        mockObj2.restore();
        mockObj3.restore();

    });
    it('testing blockchain utils /yearly-report', async function () {
        mockObj.resolves(buffer)
        mockObj1.resolves(orgs)
        mockObj2.resolves(dono)
        mockObj3.resolves(pr)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "excel" })
            .query({
                year: "2021"
            })
        console.log("Resp yearly report: ", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})


describe('BLOCKCHAIN UTILS ROUTER - /yearly-report API SUCCESS with data', () => {
    let mockObj = ""
    let mockObj1 = ""
    let mockObj2 = ""
    let mockObj3 = ""


    let fResp = [
        {
            Key: '6TR4859388618251E',
            Record: '{"date":1632119396112,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 6TR4859388618251E\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '6ac2701b-a528-4726-a196-d7b1e0caae48',
            Record: '{"date":1632119484548,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '6V985345JG7964613',
            Record: '{"date":1632133831879,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 6V985345JG7964613\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":2,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '2GB23896580964930',
            Record: '{"date":1632134115706,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5XE6001938620031F',
            Record: '{"date":1632136269300,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 5XE6001938620031F\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":3,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1F5875870S694602L',
            Record: '{"date":1632136383208,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":15,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '3W390665LY2092431',
            Record: '{"date":1632136800830,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 3W390665LY2092431\\n","objRef":"29836be8-b694-4237-8cbd-02961fb30580","qty":1,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '88P27340CR5682312',
            Record: '{"date":1632211323124,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 88P27340CR5682312\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","qty":100,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '69A28428W4252574C',
            Record: '{"date":1632302455780,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 69A28428W4252574C\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":5,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5YR97758AA2527234',
            Record: '{"date":1632303980100,"from":"gaurav.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","paymentMode":"PayPal","qty":7,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '38E86180K2002884W',
            Record: '{"date":1632922238168,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 38E86180K2002884W\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '3CB53476UG519435E',
            Record: '{"date":1632923520443,"from":"guest.corporate.csr.com","notes":"\\nPaymentId - 3CB53476UG519435E\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":25,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '4V331710SK675670A',
            Record: '{"date":1632923831455,"from":"guest.corporate.csr.com","notes":"aj@gmail.com\\nPaymentId - 4V331710SK675670A\\n","objRef":"099bc587-771c-42c9-8d3b-57243ed9007f","paymentMode":"PayPal","qty":10,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1A600833617779406',
            Record: '{"date":1632923908729,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":25,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '5N335190JJ954443R',
            Record: '{"date":1632923976018,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":14,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '4L2988663B748482G',
            Record: '{"date":1632924089184,"from":"testdonor.corporate.csr.com","notes":"","objRef":"29836be8-b694-4237-8cbd-02961fb30580","paymentMode":"PayPal","qty":22,"to":"gwave.ngo.csr.com"}'
        },
        {
            Key: '1B619042GX529100S',
            Record: '{"date":1632924120785,"from":"testdonor.corporate.csr.com","notes":"","objRef":"8261be99-1f6a-4904-864b-f8505ada0af0","paymentMode":"PayPal","qty":11,"to":"gwave.ngo.csr.com"}'
        }
    ]



    let orgs = [
        {
            firstName: 'Gaurav',
            lastName: 'Jena',
            userName: 'gaurav',
            email: 'gaurav.jena96@gmail.com',
            subRole: 'Individual'
        },
        {
            firstName: 'First',
            lastName: 'Last',
            userName: 'testdonor',
            email: 'testdonor@gwave.com',
            orgName: 'GJ Corp',
            subRole: 'Institution'
        }
    ]


    let pr = [
        {
            projectName: 'Grün',
            projectId: '099bc587-771c-42c9-8d3b-57243ed9007f'
        },
        {
            projectName: 'Prásinos Greek',
            projectId: '29836be8-b694-4237-8cbd-02961fb30580'
        },
        {
            projectName: 'Green',
            projectId: '8261be99-1f6a-4904-864b-f8505ada0af0'
        }
    ]

    let dono = [{
        email: "aj@gmail.com",
        name: "aj"
    },
    {
        email: "aj@gmail.com"
    }]

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(fResp));
    console.log(buffer)
    let orgModelList = []
    let donorModelList = []
    let projectModelList = []

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj2 = sandbox.stub(donorModel, 'find');
        mockObj3 = sandbox.stub(projectModel, 'find');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        mockObj2.restore();
        mockObj3.restore();

    });
    it('testing blockchain utils /yearly-report', async function () {
        mockObj.resolves(buffer)
        mockObj1.resolves(orgs)
        mockObj2.resolves(dono)
        mockObj3.resolves(pr)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "json" })
            .query({
                year: "2021"
            })
        console.log("Resp yearly report: ", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN UTILS ROUTER - /yearly-report API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""
    let mockObj2 = ""
    let mockObj3 = ""



    let finalres = [{
        Key: '12E25274C17966904',
        Record: '{\"date\":\"1630660663324\",\"from\":\"guest.corporate.csr.com\",\"notes\":\"gaurav.jena96@gmail.com\\nPaymentId - 12E25274C17966904\\n\",\"objRef\":\"83a35cb6-d8d9-4acb-b37b-57da022fb4c8\",\"qty\":\"100\",\"to\":\"gwave.ngo.csr.com\"}'
    }]

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));
    console.log(buffer)
    let orgModelList = []
    let donorModelList = []
    let projectModelList = []

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
        mockObj1 = sandbox.stub(orgModel, 'find');
        mockObj2 = sandbox.stub(donorModel, 'find');
        mockObj3 = sandbox.stub(projectModel, 'find');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();
        mockObj2.restore();
        mockObj3.restore();

    });
    it('testing blockchain utils /yearly-report', async function () {
        mockObj.resolves(buffer)
        mockObj1.resolves(orgModelList)
        mockObj2.resolves(donorModelList)
        mockObj3.resolves(projectModelList)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "json" })
            .query({
                year: "2021"
            })
        console.log("Resp yearly report: ", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })

    it('testing blockchain utils /yearly-report for invalid response type', async function () {
        mockObj.resolves(buffer)
        mockObj1.resolves(orgModelList)
        mockObj2.resolves(donorModelList)
        mockObj3.resolves(projectModelList)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "jso" })
            .query({
                year: "2021"
            })
        console.log("Resp yearly report: ", response.body)
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal(messages.error.REPORT_TYPE)

    })
})

describe('BLOCKCHAIN UTILS ROUTER - /yearly-report API', () => {
    it('testing blockchain utils router API when responseType field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "" })
            .query({
                year: "2021"
            })

        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'responseType' field is missing or Invalid in the request")
    });

    it('testing blockchain utils router API when year field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)

            .get("/utils/yearly-report").set("csrtoken", "Bearer " + token).set("testmode", "Testing").set({ responseType: "json" })
            .query({
                year: ""
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'year' field is missing or Invalid in the request")
    });
})

// describe('BLOCKCHAIN UTILS ROUTER - /add-corporate-email API SUCCESS', () => {
//     let mockObj = ""
//     let finalres = {
//         success: true,
//         message: "Successfully invoked AddCorporateEmail"
//     }

//     beforeEach(() => {
//         mockObj = sandbox.stub(invoke, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain utils router API', async function () {
//         mockObj.resolves(null)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .post("/utils/add-corporate-email").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 corporateName: "keanu",
//                 email: "keanu@gmail.com"
//             })
//         expect(response.body.success).to.equal(true)
//     });
// })


// describe('BLOCKCHAIN UTILS ROUTER - /upload-excel API SUCCESS', () => {
//     let mockObj = ""
//     let finalres={
//         success: true,
//         message:"Successfully invoked AddCorporateEmail"
//     }
//     let fileData={
//         "fileName": "sample1.xls",
//         "fileData": "JVBERi0xLjMNCiXi48/TDQoNCjEgMCBvYmoNCjw8DQovVHlwZSAvQ2F0YWxvZw0KL091dGxpbmVzIDIgMCBSDQovUGFnZXMgMyAwIFINCj4+DQplbmRvYmoNCg0KMiAwIG9iag0KPDwNCi9UeXBlIC9PdXRsaW5lcw0KL0NvdW50IDANCj4+DQplbmRvYmoNCg0KMyAwIG9iag0KPDwNCi9UeXBlIC9QYWdlcw0KL0NvdW50IDINCi9LaWRzIFsgNCAwIFIgNiAwIFIgXSANCj4+DQplbmRvYmoNCg0KNCAwIG9iag0KPDwNCi9UeXBlIC9QYWdlDQovUGFyZW50IDMgMCBSDQovUmVzb3VyY2VzIDw8DQovRm9udCA8PA0KL0YxIDkgMCBSIA0KPj4NCi9Qcm9jU2V0IDggMCBSDQo+Pg0KL01lZGlhQm94IFswIDAgNjEyLjAwMDAgNzkyLjAwMDBdDQovQ29udGVudHMgNSAwIFINCj4+DQplbmRvYmoNCg0KNSAwIG9iag0KPDwgL0xlbmd0aCAxMDc0ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBBIFNpbXBsZSBQREYgRmlsZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIFRoaXMgaXMgYSBzbWFsbCBkZW1vbnN0cmF0aW9uIC5wZGYgZmlsZSAtICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjY0LjcwNDAgVGQNCigganVzdCBmb3IgdXNlIGluIHRoZSBWaXJ0dWFsIE1lY2hhbmljcyB0dXRvcmlhbHMuIE1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NTIuNzUyMCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDYyOC44NDgwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjE2Ljg5NjAgVGQNCiggdGV4dC4gQW5kIG1vcmUgdGV4dC4gQm9yaW5nLCB6enp6ei4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNjA0Ljk0NDAgVGQNCiggbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDU5Mi45OTIwIFRkDQooIEFuZCBtb3JlIHRleHQuIEFuZCBtb3JlIHRleHQuICkgVGoNCkVUDQpCVA0KL0YxIDAwMTAgVGYNCjY5LjI1MDAgNTY5LjA4ODAgVGQNCiggQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA1NTcuMTM2MCBUZA0KKCB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBFdmVuIG1vcmUuIENvbnRpbnVlZCBvbiBwYWdlIDIgLi4uKSBUag0KRVQNCmVuZHN0cmVhbQ0KZW5kb2JqDQoNCjYgMCBvYmoNCjw8DQovVHlwZSAvUGFnZQ0KL1BhcmVudCAzIDAgUg0KL1Jlc291cmNlcyA8PA0KL0ZvbnQgPDwNCi9GMSA5IDAgUiANCj4+DQovUHJvY1NldCA4IDAgUg0KPj4NCi9NZWRpYUJveCBbMCAwIDYxMi4wMDAwIDc5Mi4wMDAwXQ0KL0NvbnRlbnRzIDcgMCBSDQo+Pg0KZW5kb2JqDQoNCjcgMCBvYmoNCjw8IC9MZW5ndGggNjc2ID4+DQpzdHJlYW0NCjIgSg0KQlQNCjAgMCAwIHJnDQovRjEgMDAyNyBUZg0KNTcuMzc1MCA3MjIuMjgwMCBUZA0KKCBTaW1wbGUgUERGIEZpbGUgMiApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY4OC42MDgwIFRkDQooIC4uLmNvbnRpbnVlZCBmcm9tIHBhZ2UgMS4gWWV0IG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NzYuNjU2MCBUZA0KKCBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSB0ZXh0LiBBbmQgbW9yZSApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY2NC43MDQwIFRkDQooIHRleHQuIE9oLCBob3cgYm9yaW5nIHR5cGluZyB0aGlzIHN0dWZmLiBCdXQgbm90IGFzIGJvcmluZyBhcyB3YXRjaGluZyApIFRqDQpFVA0KQlQNCi9GMSAwMDEwIFRmDQo2OS4yNTAwIDY1Mi43NTIwIFRkDQooIHBhaW50IGRyeS4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gQW5kIG1vcmUgdGV4dC4gKSBUag0KRVQNCkJUDQovRjEgMDAxMCBUZg0KNjkuMjUwMCA2NDAuODAwMCBUZA0KKCBCb3JpbmcuICBNb3JlLCBhIGxpdHRsZSBtb3JlIHRleHQuIFRoZSBlbmQsIGFuZCBqdXN0IGFzIHdlbGwuICkgVGoNCkVUDQplbmRzdHJlYW0NCmVuZG9iag0KDQo4IDAgb2JqDQpbL1BERiAvVGV4dF0NCmVuZG9iag0KDQo5IDAgb2JqDQo8PA0KL1R5cGUgL0ZvbnQNCi9TdWJ0eXBlIC9UeXBlMQ0KL05hbWUgL0YxDQovQmFzZUZvbnQgL0hlbHZldGljYQ0KL0VuY29kaW5nIC9XaW5BbnNpRW5jb2RpbmcNCj4+DQplbmRvYmoNCg0KMTAgMCBvYmoNCjw8DQovQ3JlYXRvciAoUmF2ZSBcKGh0dHA6Ly93d3cubmV2cm9uYS5jb20vcmF2ZVwpKQ0KL1Byb2R1Y2VyIChOZXZyb25hIERlc2lnbnMpDQovQ3JlYXRpb25EYXRlIChEOjIwMDYwMzAxMDcyODI2KQ0KPj4NCmVuZG9iag0KDQp4cmVmDQowIDExDQowMDAwMDAwMDAwIDY1NTM1IGYNCjAwMDAwMDAwMTkgMDAwMDAgbg0KMDAwMDAwMDA5MyAwMDAwMCBuDQowMDAwMDAwMTQ3IDAwMDAwIG4NCjAwMDAwMDAyMjIgMDAwMDAgbg0KMDAwMDAwMDM5MCAwMDAwMCBuDQowMDAwMDAxNTIyIDAwMDAwIG4NCjAwMDAwMDE2OTAgMDAwMDAgbg0KMDAwMDAwMjQyMyAwMDAwMCBuDQowMDAwMDAyNDU2IDAwMDAwIG4NCjAwMDAwMDI1NzQgMDAwMDAgbg0KDQp0cmFpbGVyDQo8PA0KL1NpemUgMTENCi9Sb290IDEgMCBSDQovSW5mbyAxMCAwIFINCj4+DQoNCnN0YXJ0eHJlZg0KMjcxNA0KJSVFT0YNCg==",
//         "fileHash": "4b41a3475132bd861b30a878e30aa56a",
//         "fileSize": "3028",
//     }

//     beforeEach(() => {
//         mockObj = sandbox.stub(invoke,'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain utils router API', async function () {
//         mockObj.resolves(null)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//         .post("/utils/upload-excel").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         .send({
//             fileData:"34567dfghjxcvb",
//             year:"2021"
//         })
//         expect(response.body.success).to.equal(true)
//         // expect(response.body.message).to.equal("Successfully invoked AddCorporateEmail")
//     });
// })

// describe('BLOCKCHAIN UTILS ROUTER - /upload-excel API', () => {
//     it('testing blockchain utils router API column names error', async function () {
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//         .post("/utils/upload-excel").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("Column names should be corporateName, email and totalLiability.")
//     });
// })

