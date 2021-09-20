const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const messages = require('../../loggers/messages');
const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

const userModel = require('../../model/userModel');

const testUser = {
    firstName: 'Charles',
    lastName: 'Mack',
    orgName: 'Corp',
    userName: 'corp1',
    email: 'info@corporate.com',
    role: 'Corporate',
    subRole: 'Institution',
    status: 'created',
    description: 'desc',
    website: 'www.example.com',
    address: {
        addressLine1: 'address1',
        addressLine2: 'address2',
        city: 'city',
        state: '',
        zipCode: '',
        country: 'India'
    },
    phone:[
        {
            countryCode: '+91',
            phoneNumber: '9765457'
        }
    ]
   
}

describe('testing user model - approve user', () => {

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

    it('testing response for registerUser', async () => {
        const userDetails = testUser
        const res = await userModel.registerUser(userDetails);
        console.log("Response",res);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal( messages.success.REGISTER_USER);
    });

    it('testing if user is already registered in mongo', async () => {
        let userDetails = testUser;

        let res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = 'newCorp';
        res = await userModel.registerUser(userDetails);
        expect(res).to.be.a('object');
        expect(res.success).to.equal(false);

        userDetails.userName = 'corp1';
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

        userDetails.userName = 'newCorp';
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
        const res = await userModel.getUserDetails('info@corporate.com');
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
        const res = await userModel.approveUser('corp1');
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
        let userDetails = testUser;
        userDetails.userName = 'newCorp';
        userDetails.email = 'newCorp@gmail.com';
	    userDetails.regId = undefined;
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

        notification.username = 'corp1';

        const res = await userModel.createNotification(notification);
        expect(res).to.be.a('object');
        expect(res).to.have.property('_id');
        expect(res.txId).to.equal('id-01');
        expect(res.seen).to.equal(false);
        expect(res.username).to.equal('corp1');
        notification.username = 'corp2';
        const res1 = await userModel.createNotification(notification);
        expect(res1).to.be.a('object');
        expect(res1).to.have.property('_id');
        expect(res1.txId).to.equal('id-01');
        expect(res1.seen).to.equal(false);
        expect(res1.username).to.equal('corp2');
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
        const res = await userModel.getNotifications('corp1', false);
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);
        const res1 = await userModel.getNotifications('corp2', false);
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
        const res = await userModel.updateNotification('corp1', notification.txId);
        expect(res).to.be.a('object');
        expect(res.n).to.equal(1);
        expect(res.nModified).to.equal(1);
        expect(res.ok).to.equal(1);
        const res1 = await userModel.getNotifications('corp1', false);
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
})
