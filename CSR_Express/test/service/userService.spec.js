const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const userService = require('../../service/userService');
const userModel = require('../../model/userModel');

const testUser = {
    name: 'ngo1',
    description: '',
    pan: 'PAN123',
    email: 'info@ngo1.com',
    regId: 'reg001',
    address: {
        doorNo: '',
        flat: '',
        street: '',
        country: '',
        state: '',
        district: '',
        locality: '',
        pinCode: ''
    },
    contact: [
        {
            name: 'ngo1-office',
            number: '9898989898'
        }
    ],
    userName: 'ngo1',
    role: 'Ngo'
}

describe('TESTING USER SERVICE - REGISTER', () => {

    it('testing response for registerUser', async () => {
        const userDetails = testUser
        const registerUserStub = sinon.stub(userModel, "registerUser").resolves({ success: true, message: 'user successfully registered...' });

        const res = await userService.registerUser(userDetails);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('user successfully registered...');
        expect(registerUserStub.calledOnce).to.be.true;
    });

    // it('testing if user is already registered in mongo', async () => {
    //     let userDetails = testUser;

    //     let res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);

    //     userDetails.userName = 'newNgo';
    //     res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);

    //     userDetails.userName = 'ngo1';
    //     userDetails.email = 'newEmail';
    //     res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);
    // });

    // it('testing user registration with empty userName/email in mongo', async () => {
    //     let userDetails = testUser;

    //     let res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);

    //     userDetails.userName = 'newNgo';
    //     userDetails.email = '';
    //     res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);

    //     userDetails.userName = '';
    //     userDetails.email = '';
    //     res = await userModel.registerUser(userDetails);
    //     expect(res).to.be.a('object');
    //     expect(res.success).to.equal(false);
    // });

    // it('testing response for getUserDetails', async () => {
    //     const res = await userModel.getUserDetails('info@ngo1.com');
    //     expect(res).to.be.a('object');
    // });

    // it('testing fail response for getUserDetails', async () => {
    //     const res = await userModel.getUserDetails('invalid_user.com');
    //     expect(res).to.be.a('null');
    // });

    // it('testing getUnapprovedUserDetails', async () => {
    //     const res = await userModel.getUnapprovedUserDetails();
    //     expect(res).to.be.a('array');
    //     expect(res).to.have.lengthOf(1);
    //     expect(res[0].status).to.equal('created')
    // });

    // it('testing approve user', async () => {
    //     const res = await userModel.approveUser('ngo1');
    //     expect(res).to.be.a('object');
    //     expect(res.n).to.equal(1);
    //     expect(res.nModified).to.equal(1);
    //     expect(res.ok).to.equal(1);
    // });
})
