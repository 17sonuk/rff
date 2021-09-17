const chai = require('chai');
const { expect } = require('chai');
var sandbox = require("sinon").createSandbox();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");
const initiateEmailTemplate = require('../../email-templates/projectInitiationEmail');
const mongoProjectService = require('../../service/projectService');

const donorEmailTemplate = require('../../email-templates/donorEmail');
const query = require('../../fabric-sdk/query');
const { orgModel } = require('../../model/models');

const commonService = require('../../service/commonService');
const commonModel = require('../../model/commonModel');


describe('TESTING COMMON SERVICE - SAVE COMMUNITIES', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'saveCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for saveCommunities', async () => {
        const communities = [{
            name: "TestUser12",
            place: "Test12"
        }]
        mockObj.resolves(communities);
        let res = await commonService.saveCommunities(communities)
        expect(res).to.equal(communities)

        //If communities is not getting saved
        mockObj.resolves(null);
        try {
            let res = await commonService.saveCommunities(communities)
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET COMMUNITIES', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getCommunities', async () => {
        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        mockObj.resolves(communities);
        let res = await commonService.getCommunities()
        expect(res).to.equal(communities)

        //If communities is not found
        mockObj.resolves(null);
        try {
            let res = await commonService.getCommunities()
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET COMMUNITY', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getCommunities', async () => {
        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        mockObj.resolves(communities);
        let res = await commonService.getCommunity()
        expect(res).to.equal(communities)

        //If communities is not found
        mockObj.resolves(null);
        try {
            let res = await commonService.getCommunity()
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('No community')
        }
    })
})

describe('TESTING COMMON SERVICE - DELETE COMMUNITY', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'deleteCommunities');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for deleteCommunities', async () => {
        const communityids = []
        const result = []

        mockObj.resolves(result);
        let res = await commonService.deleteCommunities(communityids)
        expect(res).to.be.a('array');

        // expect(res).to.be.a('object');
        // expect(res.status).to.equal(200)

        mockObj.resolves(null);
        try {
            let res = await commonService.deleteCommunities(communityids)
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - SAVE DONOR', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'saveDonor');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for saveDonor', async () => {
        const donor = {

            name: "Ngo1"
        }
        mockObj.resolves(donor);
        let res = await commonService.saveDonor(donor)
        expect(res).to.equal(donor)

        //If not able to save donor
        mockObj.resolves(null);
        try {
            let res = await commonService.saveDonor(donor)
            expect(res).to.equal(donor)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET DONOR', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getDonors');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getDonors', async () => {
        const donor = {

            name: "Ngo1"
        }
        mockObj.resolves(donor);
        let res = await commonService.getDonors()
        expect(res).to.equal(donor)

        //If not able to find donors
        mockObj.resolves(null);
        try {
            let res = await commonService.getDonors()
            expect(res).to.equal(donor)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - UPDATE COMMUNITY', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'updateCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for updateCommunity', async () => {
        const communities = {
            communityId: "1",
            name: "TestUser12",
            place: "Test12",
            paymentDetails: "paypal"
        }
        mockObj.resolves(communities);
        let res = await commonService.updateCommunity(communities.communityId, communities.name, communities.place, communities.paymentDetails)
        expect(res).to.equal(communities)

        //If communities is not getting saved
        mockObj.resolves(null);
        try {
            let res = await commonService.updateCommunity(communities.communityId, communities.name, communities.place, communities.paymentDetails)
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET LISTED COMMUNITIES', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getListedCommunity');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getListedCommunity', async () => {
        const communities = {
            name: "TestUser12",
            place: "Test12"
        }
        const communityIds = []
        const orgName = "ngo"

        mockObj.resolves(communities);
        let res = await commonService.getListedCommunity(communityIds, orgName)
        expect(res).to.equal(communities)

        //If communities is not found
        mockObj.resolves(null);
        try {
            let res = await commonService.getListedCommunity(communityIds, orgName)
            expect(res).to.equal(communities)
        } catch (err) {
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING COMMON SERVICE - GET getOrgDetails', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getOrgDetails');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getOrgDetails', async () => {
        const org = {
            userName: "ngo",
            name: "TestUser12",
            place: "Test12"
        }
        mockObj.resolves(org);
        let res = await commonService.getOrgDetails(org.userName)
        expect(res).to.equal(org)

        //If communities is not found
        mockObj.resolves(null);
        try {
            let res = await commonService.getOrgDetails(org.userName)
            expect(res).to.equal(org)
        } catch (err) {
            expect(err.message).to.equal('No data found')
        }
    })
})

describe('TESTING COMMON SERVICE - sendEmailToDonor', () => {
    let mockObj = ""
    let mockObj1 = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getProjectById');
        mockObj1 = sandbox.stub(donorEmailTemplate, 'donorEmail');
    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing response for sendEmailToDonor', async () => {
        const project = {}
        mockObj.resolves(project);
        mockObj1.resolves(`<html>hi</html>`);

        let email = "rainforest.csr@gmail.com"
        let amount = 100
        let name = "Ca"
        let projectId = "p01"
        let address = "address"
        let res = await commonService.sendEmailToDonor(email, name, amount, projectId, address)
        // expect(res.status).to.equal(200)

        // expect(res).to.equal(donor)

        //If not able to save donor
        mockObj.resolves(null);
        mockObj1.resolves(null);

        try {
            let res = await commonService.sendEmailToDonor(email, name, amount, projectId, address)
            // expect(res.status).to.equal(200)

        } catch (err) {
            expect(err.message).to.equal('No project found')
        }
    })
})

describe('TESTING COMMON SERVICE - GET getDonorEmailList', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(commonModel, 'getDonorEmailList');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getDonorEmailList', async () => {
        const contributors = [{
            userName: "ngo",
            name: "TestUser12",
            place: "Test12"
        }]
        mockObj.resolves(contributors);
        let res = await commonService.getDonorEmailList(contributors)
        expect(res).to.equal(contributors)

        //If communities is not found
        mockObj.resolves(null);
        try {
            let res = await commonService.getDonorEmailList(contributors)
            expect(res).to.equal(contributors)
        } catch (err) {
            expect(err.message).to.equal('No data found')
        }
    })
})


// describe('TESTING COMMON SERVICE - projectInitiation', () => {
//     let mockObj = ""
//     let mockObj1 = ""
//     let mockObj2 = ""
//     let mockObj3 = ""
//     const testProject = {
//         "contributorsList": [],
//         "images": [],
//         "projectId": "p01",
//         "projectName": "123Gift an education...Make a life!",
//         "projectType": "Education",
//         "ngo": "ngo1",
//         "place": "Mumbai",
//         "description": "Mysuru public school provide high quality school education to rural children in India who cannot otherwise access or afford it. The schools adopt a nurturing, holistic approach to education, helping children learn joyfully. 61% of the children get full scholarships while rest pay a subsidized fee. Your donation goes towards critical infrastructure like learning material, classrooms, school bus, etc.",
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
//         "question6": `question6`,
//         "question5": `question5`,
//         "question4": `question4`,
//         "question3": `question3`,
//         'question2': `question2`,
//         'question1': `question1`,
//         'projectSummary': `projectSummary`
//     }

//     beforeEach(() => {
//         mockObj = sandbox.stub(mongoProjectService, 'getProjectById');
//         mockObj3 = sandbox.stub(orgModel, 'find');

//         mockObj1 = sandbox.stub(query, 'main');

//         mockObj2 = sandbox.stub(initiateEmailTemplate, 'projectInitiationEmail');
//     });
//     afterEach(() => {
//         mockObj.restore();
//         mockObj3.restore();
//         mockObj1.restore();
//         mockObj2.restore();



//     });
//     it('testing response for projectInitiation', async () => {
//         let project = []
//         let buffer = Buffer.from(JSON.stringify(project))
//         let emailList = []
//         mockObj.resolves(testProject);
//         mockObj3.resolves(emailList);
//         mockObj1.resolves(buffer);

//         mockObj2.resolves(`<html>hi</html>`);

//         let email = "rainforest.csr@gmail.com"
//         let amount = 100
//         let username = "Ca"
//         let projectId = "p01"
//         let orgname = "ngo"
//         let res = await commonService.projectInitiation(projectId, username, orgname)
//         // expect(res.status).to.equal(200)

//         // expect(res).to.equal(donor)

//         //If not able to save donor
//         mockObj.resolves(null);
//         mockObj1.resolves(null);
//         mockObj2.resolves(null);

//         try {
//             let res = await commonService.projectInitiation(projectId, username, orgname)
//             // expect(res.status).to.equal(200)

//         } catch (err) {
//             expect(res).to.be.a('object');

//             // expect(err.message).to.equal('No project found')
//         }
//     })
// })











