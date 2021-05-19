const chai = require('chai');
const { expect } = require('chai'); // Library to clean and easy syntax
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
//const request = require('supertest'); //library for http agent

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

const userModel = require('../../model/userModel');

describe('testing user model', () => {

    before((done) => {

        // const options = { useNewUrlParser: true, useUnifiedTopology: true };
        // mongoose.connect('mongodb://localhost/CSR_test', options, function () {
        /* Drop the DB */
        // mongoose.connection.db.dropDatabase();
        // });
        connectionToMongo('_test');
        done();
    })

    after((done) => {
        // mongoose.disconnect()
        disconnectMongo()
            .then(() => {
                console.log('Mongo connection closed.');
                done()
            })
            .catch((err) => done(err))
    })

    it('testing response for registerUser', async () => {
        const userDetails = {
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
            role: 'Ngo',
            status: 'created'
        }
        const res = await userModel.registerUser(userDetails);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('user successfully registered...');
    });

    it('testing if user is already registered in mongo', async () => {
        let userDetails = {
            name: 'ngo1',
            description: '',
            pan: 'PAN123',
            email: 'info@ngo1.com',
            regId: '',
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

        let res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = 'newNgo';
        res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = 'ngo1';
        userDetails.email = 'newEmail';
        res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);
    });

    it('testing user registration with empty userName/email in mongo', async () => {
        let userDetails = {
            name: 'ngo1',
            description: '',
            pan: 'PAN123',
            email: 'info@ngo1.com',
            regId: '',
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
            userName: '',
            role: 'Ngo'
        }

        let res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = 'newNgo';
        userDetails.email = '';
        res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = '';
        userDetails.email = '';
        res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);
    });

    it('testing response for getUserDetails', async () => {
        const res = await userModel.getUserDetails('info@ngo1.com');
        expect(res).to.be.a('object');
    });

    it('testing fail response for getUserDetails', async () => {
        const res = await userModel.getUserDetails('invalid_user.com');
        expect(res).to.be.a('null');
    });

    it('testing getUnapprovedUserDetails', async () => {
        const res = await userModel.getUnapprovedUserDetails();
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);
        expect(res[0].status).to.equal('created')
    });

    it('testing approve user', async () => {
        const res = await userModel.approveUser('ngo1');
        expect(res).to.be.a('object');
        expect(res[0].status).to.equal('created')
    });
})
