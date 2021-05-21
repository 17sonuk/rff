const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

const projectModel = require('../../model/projectModel');

const testProject = {
    "contributorsList": [],
    "images": [],
    "projectId": "p01",
    "projectName": "123Gift an education...Make a life!",
    "projectType": "Education",
    "ngo": "ngo1",
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

describe('testing project model - create', () => {

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

    it('testing response for createProject', async () => {
        const projectDetails = testProject;
        const res = await projectModel.createProject(projectDetails);
        expect(res).to.be.a('object');
    });

    it('testing if project already exists in mongo', async () => {
        const projectDetails = testProject;

        const res = await projectModel.createProject(projectDetails);
        expect(res).to.be.a('object');
        expect(res.error).to.equal(true);
    });

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

// describe('testing user model - reject user', () => {

//     before((done) => {
//         connectionToMongo('_test');
//         done();
//     })

//     after((done) => {
//         disconnectMongo()
//             .then(() => {
//                 console.log('Mongo connection closed.');
//                 done()
//             })
//             .catch((err) => done(err))
//     })

//     it('testing response for reject user', async () => {
//         const userDetails = testUser;

//         await userModel.registerUser(userDetails);
//         const unapprovedUsers = await userModel.getUnapprovedUserDetails();

//         const res = await userModel.rejectUser(unapprovedUsers[0].userName);
//         expect(res).to.be.a('object');
//         expect(res.n).to.equal(1);
//         expect(res.deletedCount).to.equal(1);
//         expect(res.ok).to.equal(1);
//     });

//     it('testing response for reject user who doesn\'t exist', async () => {

//         const res = await userModel.rejectUser("wrong_user");
//         expect(res).to.be.a('object');
//         // console.log(res)
//         expect(res.n).to.equal(0);
//         expect(res.deletedCount).to.equal(0);
//         expect(res.ok).to.equal(1);
//     });
// })

// describe('testing user model - notification', () => {

//     before((done) => {
//         connectionToMongo('_test');
//         done();
//     })

//     after((done) => {
//         disconnectMongo()
//             .then(() => {
//                 console.log('Mongo connection closed.');
//                 done()
//             })
//             .catch((err) => done(err))
//     })

//     let notification = {
//         'txId': 'id-01',
//         'seen': false
//     };

//     it('testing response for create notification', async () => {

//         notification.username = 'ngo1';

//         const res = await userModel.createNotification(notification);
//         expect(res).to.be.a('object');
//         expect(res).to.have.property('_id');
//         expect(res.txId).to.equal('id-01');
//         expect(res.seen).to.equal(false);
//         expect(res.username).to.equal('ngo1');

//         notification.username = 'ngo2';
//         const res1 = await userModel.createNotification(notification);
//         expect(res1).to.be.a('object');
//         expect(res1).to.have.property('_id');
//         expect(res1.txId).to.equal('id-01');
//         expect(res1.seen).to.equal(false);
//         expect(res1.username).to.equal('ngo2');
//     });

//     it('testing response for create tx description', async () => {
//         let txDescription = {
//             'txId': notification.txId,
//             'description': 'test description'
//         }

//         const res = await userModel.createTxDescription(txDescription);
//         expect(res).to.be.a('object');
//         expect(res).to.have.property('_id');
//         expect(res.txId).to.equal('id-01');
//         expect(res.description).to.equal(txDescription.description);
//     });

//     it('testing response for get notifications', async () => {

//         const res = await userModel.getNotifications('ngo1', false);
//         expect(res).to.be.a('array');
//         expect(res).to.have.lengthOf(1);

//         const res1 = await userModel.getNotifications('ngo2', false);
//         expect(res1).to.be.a('array');
//         expect(res1).to.have.lengthOf(1);
//     });

//     it('testing response for get notifications of non-existing user', async () => {

//         const res = await userModel.getNotifications('wrong_user', false);
//         expect(res).to.be.a('array');
//         expect(res).to.have.lengthOf(0);
//     });

//     it('testing response for get notifications description', async () => {

//         const res = await userModel.getNotificationDescription(notification.txId);
//         expect(res).to.be.a('object');
//         expect(res.txId).to.equal(notification.txId);
//     });

//     it('testing response for update notification', async () => {

//         const res = await userModel.updateNotification('ngo1', notification.txId);
//         expect(res).to.be.a('object');
//         expect(res.n).to.equal(1);
//         expect(res.nModified).to.equal(1);
//         expect(res.ok).to.equal(1);

//         const res1 = await userModel.getNotifications('ngo1', false);
//         expect(res1).to.be.a('array');
//         expect(res1).to.have.lengthOf(0);
//     });
// })

// describe('testing user model - db unavailability', () => {

//     it('testing response for db unavailability for all functions', async () => {
//         const userDetails = testUser;

//         const res = await userModel.registerUser(userDetails);

//         expect(res).to.be.a('object');
//         expect(res.success).to.equal(false);
//     });

//     // it('testing response for reject user who doesn\'t exist', async () => {

//     //     const res = await userModel.rejectUser("wrong_user");
//     //     expect(res).to.be.a('object');
//     //     // console.log(res)
//     //     expect(res.n).to.equal(0);
//     //     expect(res.deletedCount).to.equal(0);
//     //     expect(res.ok).to.equal(1);
//     // });
// })