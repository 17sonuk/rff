// const { expect } = require('chai');
// var sandbox = require("sinon").createSandbox();
// const chaiAsPromised = require('chai-as-promised');
// chai.use(chaiAsPromised)
// const userService = require('../../service/userService');
// const userModel = require('../../model/userModel');
// const messages = require('../../loggers/messages');

// const projectService = require('../../service/projectService');
// const commonService = require('../../service/commonService');
// const { generateError, getMessage } = require('../../utils/functions');
// const paymentService = require('../../routers/payment-gateway/paymentService');

// const invoke = require('../../fabric-sdk/invoke');

// describe('PSP SERVICE - saveTx SUCCESS', () => {
//     let mockObj = ""
//     beforeEach(() => {
//         mockObj = sandbox.stub(invoke, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing psp saveTx ', async function () {
//         mockObj.resolves(null)
//         let payload = {
//             userName: 'corp2',
//             orgName: 'corporate'
//         }
//         let donorDetails={
//             email:"aj@gmail.com",
//             name:"aj"
//         }
//         let payl={
//             amount: "34",
//             projectId:"p01",
//             donorDetails:donorDetails
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .post("/psp/coinbase/charge").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 requestType:"FundRequest",
//                 payload:payl,
//                 userName:"aj"

//             })
//         console.log("Resp23:", response.body)
//         expect(response.status).to.equal(200)

//         // expect(response.body.success).to.equal(true)
//     })

// })