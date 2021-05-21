const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
//const request = require('supertest'); //library for http agent

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

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
    role: 'Ngo',
    status: 'created'
}

describe('testing user model - approve user', () => {

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
        const userDetails = testUser
        const res = await userModel.registerUser(userDetails);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('user successfully registered...');
    });

    it('testing if user is already registered in mongo', async () => {
        let userDetails = testUser;

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
        let userDetails = testUser;

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
        expect(res.n).to.equal(1);
        expect(res.nModified).to.equal(1);
        expect(res.ok).to.equal(1);
    });
})

describe('testing user model - reject user', () => {

    before((done) => {
        connectionToMongo('_test');
        done();
    })

    after((done) => {
        disconnectMongo()
            .then(() => {
                console.log('Mongo connection closed.');
                done()
            })
            .catch((err) => done(err))
    })

    it('testing response for reject user', async () => {
        const userDetails = testUser;

        await userModel.registerUser(userDetails);
        const unapprovedUsers = await userModel.getUnapprovedUserDetails();

        const res = await userModel.rejectUser(unapprovedUsers[0].userName);
        expect(res).to.be.a('object');
        expect(res.n).to.equal(1);
        expect(res.deletedCount).to.equal(1);
        expect(res.ok).to.equal(1);
    });

    it('testing response for reject user who doesn\'t exist', async () => {

        const res = await userModel.rejectUser("wrong_user");
        expect(res).to.be.a('object');
        // console.log(res)
        expect(res.n).to.equal(0);
        expect(res.deletedCount).to.equal(0);
        expect(res.ok).to.equal(1);
    });
})

describe('testing user model - notification', () => {

    before((done) => {
        connectionToMongo('_test');
        done();
    })

    after((done) => {
        disconnectMongo()
            .then(() => {
                console.log('Mongo connection closed.');
                done()
            })
            .catch((err) => done(err))
    })

    let notification = {
        'txId': 'id-01',
        'seen': false
    };

    it('testing response for create notification', async () => {

        notification.username = 'ngo1';

        const res = await userModel.createNotification(notification);
        expect(res).to.be.a('object');
        expect(res).to.have.property('_id');
        expect(res.txId).to.equal('id-01');
        expect(res.seen).to.equal(false);
        expect(res.username).to.equal('ngo1');

        notification.username = 'ngo2';
        const res1 = await userModel.createNotification(notification);
        expect(res1).to.be.a('object');
        expect(res1).to.have.property('_id');
        expect(res1.txId).to.equal('id-01');
        expect(res1.seen).to.equal(false);
        expect(res1.username).to.equal('ngo2');
    });

    it('testing response for create tx description', async () => {
        let txDescription = {
            'txId': notification.txId,
            'description': 'test description'
        }

        const res = await userModel.createTxDescription(txDescription);
        expect(res).to.be.a('object');
        expect(res).to.have.property('_id');
        expect(res.txId).to.equal('id-01');
        expect(res.description).to.equal(txDescription.description);
    });

    it('testing response for get notifications', async () => {

        const res = await userModel.getNotifications('ngo1', false);
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);

        const res1 = await userModel.getNotifications('ngo2', false);
        expect(res1).to.be.a('array');
        expect(res1).to.have.lengthOf(1);
    });

    it('testing response for get notifications of non-existing user', async () => {

        const res = await userModel.getNotifications('wrong_user', false);
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(0);
    });

    it('testing response for get notifications description', async () => {

        const res = await userModel.getNotificationDescription(notification.txId);
        expect(res).to.be.a('object');
        expect(res.txId).to.equal(notification.txId);
    });

    it('testing response for update notification', async () => {

        const res = await userModel.updateNotification('ngo1', notification.txId);
        expect(res).to.be.a('object');
        expect(res.n).to.equal(1);
        expect(res.nModified).to.equal(1);
        expect(res.ok).to.equal(1);

        const res1 = await userModel.getNotifications('ngo1', false);
        expect(res1).to.be.a('array');
        expect(res1).to.have.lengthOf(0);
    });
})

describe('testing user model - db unavailability', () => {

    it('testing response for db unavailability for all functions', async () => {
        const userDetails = testUser;

        const res = await userModel.registerUser(userDetails);

        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);
    });

    // it('testing response for reject user who doesn\'t exist', async () => {

    //     const res = await userModel.rejectUser("wrong_user");
    //     expect(res).to.be.a('object');
    //     // console.log(res)
    //     expect(res.n).to.equal(0);
    //     expect(res.deletedCount).to.equal(0);
    //     expect(res.ok).to.equal(1);
    // });
})