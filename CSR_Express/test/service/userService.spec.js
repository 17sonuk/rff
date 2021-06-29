const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')

const userService = require('../../service/userService');
const userModel = require('../../model/userModel');

const testUser = {
    firstName: 'Charles',
    lastName: 'Mack',
    orgName: 'Corporate',
    userName: 'corp3',
    email: 'info@corp.com',
    role: 'Corporate',
    subRole: 'Institution', //Not valid for ngo role
    status:'',
    description: '',
    website: '',
    address: {
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
    },
    phone:[
        {
            countryCode: '+91',
            phoneNumber: '9765457'
        }
    ]
   
}

describe('TESTING USER SERVICE - REGISTER', () => {
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
        // const userDetails = testUser
        // const registerUserStub = sinon.stub(userModel, "registerUser").resolves({ success: true, message: 'user successfully registered...' });

        const res = await userService.registerUser(testUser);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(testUser.status).to.equal('created')
        expect(res.message).to.equal('user successfully registered...');
    });


    it('testing response for getUserDetails', async () => {
        const res = await userService.getUserDetails('corp3');
        expect(res).to.be.a('object');
    });

    it('testing response for login if user is not approved', async () => {
        const res = await userService.login('info@corp.com');
        expect(res.success).to.equal(false);
        expect(res.message).to.equal('Pending for approval. Please try again later.')  
    });

    it('testing response for ApproveUser', async () => {
        const res = await userService.approveUser('corp3');
        expect(res).to.equal(testUser.role.toLowerCase());
    });

    it('testing response for Already ApproveUser', async () => {
        try{
        const res = await userService.approveUser('corp3');
        expect(res).to.equal(testUser.role.toLowerCase());
        }catch(err){
            expect(err.status).to.equal(500)
        }
    });

    it('testing response for login', async () => {
        const res = await userService.login('info@corp.com');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('Login successful')  
    });
    
    it('testing response for login if user does not exist', async () => {
        const res = await userService.login('info1@corp.com');
        expect(res.success).to.equal(false);
        expect(res.message).to.equal('User does not exist')  
    })
    
    // it('testing response for balance sheet if it does not exist', async () => {
    //     try{
    //     const res = await userService.getAmountFromBalanceSheet('corp3');
    //     console.log("Response",res);
    //     expect(res.success).to.equal(false);
    //     expect(res.message).to.equal('not getting files from db')  
    //     }catch(err){
    //         console.log("Error:",err);
    //     }
    // })
    
    // it('testing response for create notification', async () => {
    //     const testProject = {
    //         "contributorsList": [],
    //         "username": "corp3",
    //         "images": [],
    //         "projectId": "p06",
    //         "projectName": "123Gift an education...Make a life!",
    //         "projectType": "Education",
    //         "ngo": "ngo1",
    //         "place": "Mumbai",
    //         "description": "Testing Description",
    //         "phases": [
    //             {
    //                 "phaseName": "Registration of students",
    //                 "description": "Enrollment of students in a school."
    //             },
    //             {
    //                 "phaseName": "Allotment of study materials",
    //                 "description": "Distribute the books and stationary to the students"
    //             },
    //             {
    //                 "phaseName": "Clearing Annual fee and exam fee",
    //                 "description": "Deposit the annual fee and exam fee of students"
    //             }
    //         ],
    //     }
    //     const res = await userService.createNotification(testProject);
    //     expect(res.success).to.equal(true);
    //     expect(res.message).to.equal('notification created in db')  
    // })
})


