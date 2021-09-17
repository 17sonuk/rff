const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const invoke = require('../../fabric-sdk/invoke');
const query = require('../../fabric-sdk/query');
const { projectModel } = require('../../model/models')

describe('PROJECT ROUTER - create project API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'createProject');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing create project api', async function () {
        const testProject = {
            "contributorsList": [],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
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
            // "question1":"question1",
            "question6": `question6`,
            "question5": `question5`,
            "question4": `question4`,
            "question3": `question3`,
            'question2': `question2`,
            'question1': `question1`,
            'projectSummary': `projectSummary`

        }

        const proj = {}
        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(testProject)
        const response = await request(app)
            .post("/mongo/project/create").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                testProject
            });
        expect(response.body).to.be.eql(testProject);

        //If project fields are empty
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .post("/mongo/project/create").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                proj
            });
        expect(response1.status).to.equal(500);
    })
})

describe('PROJECT ROUTER - projects-ngo API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'getProjectsNGO');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing projects-ngo api', async function () {
        const testProject = {
            "contributorsList": [],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
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

        let payload = {
            orgName: 'ngo',
            userName: 'ngo501'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(testProject)
        const response = await request(app)
            .get("/mongo/project/projects-ngo").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                userName: 'ngo501'
            });
        expect(response.body).to.be.eql(testProject);

        //If there is no projects
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/project/projects-ngo").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: 'ngo502'
            });
        expect(response1.status).to.equal(500);
    })
})


describe('PROJECT ROUTER - projects-corporate API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'getProjectsCorporate');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing projects-corporate api', async function () {
        const testProject = {
            "contributorsList": ['corp1'],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
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

        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(testProject)
        const response = await request(app)
            .get("/mongo/project/projects-corporate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                userName: 'corp1'
            });
        expect(response.body).to.be.eql(testProject);

        //If there is no projects of corporate
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/project/projects-corporate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                userName: 'corp2'
            });
        expect(response1.status).to.equal(500);
    })
})

describe('PROJECT ROUTER - all projects API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'getAllProjects');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing get all projects api', async function () {
        const testProject = {
            "contributorsList": ['corp1'],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
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

        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(testProject)
        const response = await request(app)
            .get("/mongo/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response.body).to.be.eql(testProject);

        //If there is no projects
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")

        expect(response1.status).to.equal(500);
    })
})

describe('PROJECT ROUTER - get projects by projectId API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'getProjectById');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing get project by peojectID api', async function () {
        const testProject = {
            "contributorsList": ['corp1'],
            "images": [],
            "projectId": "p01",
            "projectName": "123Gift an education...Make a life!",
            "projectType": "Education",
            "ngo": "ngo501",
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

        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(testProject)
        const response = await request(app)
            .get("/mongo/project/p01").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response.body).to.be.eql(testProject);

        //If projectId is not present
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/project/p02").set("csrtoken", "Bearer " + token).set("testmode", "Testing")

        expect(response1.status).to.equal(500);
    })
})


describe('PROJECT ROUTER - countryAndProjectTypeFilter API', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectService, 'getFilters');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing get countryAndProjectTypeFilter api', async function () {
        let result={}

        let payload = {
            orgName: 'corporate',
            userName: 'corp1'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        mockObj.resolves(result)
        const response = await request(app)
            .get("/mongo/project/countryAndProjectTypeFilter").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
        expect(response.body).to.be.eql(result);

        //If there is no projects
        mockObj.rejects('Bad Connection')
        const response1 = await request(app)
            .get("/mongo/project/countryAndProjectTypeFilter").set("csrtoken", "Bearer " + token).set("testmode", "Testing")

        expect(response1.status).to.equal(500);
    })
})


/////////////////////////////////////////////////BLOCKCHAIN projectRouter.js\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

describe('BLOCKCHAIN PROJECT ROUTER - /initiate API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/initiate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: ""
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

})

describe('BLOCKCHAIN PROJECT ROUTER - /initiate API SUCCESS', () => {
    let mockObj = ""
    // let mockObj1 = ""

    // let resp={
    //     getMessage:{
    //         success: true,
    //         message: "Successfully invoked CreateProject"
    //     },
    //     projectId:"p01"
    // }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        // mockObj1 = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();

    });
    it('testing blockchain project initiate API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/initiate").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /abandon API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/abandon").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                comments: "dfg"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when comments field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/abandon").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                comments: ""

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'comments' field is missing or Invalid in the request")
    });

})

describe('BLOCKCHAIN PROJECT ROUTER - /abandon API SUCCESS', () => {
    let mockObj = ""
    // let mockObj1 = ""

    // let resp={
    //     getMessage:{
    //         success: true,
    //         message: "Successfully invoked CreateProject"
    //     },
    //     projectId:"p01"
    // }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        // mockObj1 = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj.restore();
        // mockObj1.restore();

    });
    it('testing blockchain project abandon API', async function () {
        mockObj.resolves(null)
        // mockObj1.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/abandon").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                comments: "dfg",

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})


describe('BLOCKCHAIN PROJECT ROUTER - /delete API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/delete").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                comments: "dfg"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when comments field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/delete").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                comments: ""

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'comments' field is missing or Invalid in the request")
    });

})

describe('BLOCKCHAIN PROJECT ROUTER - /delete API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""

    // let resp={
    //     getMessage:{
    //         success: true,
    //         message: "Successfully invoked CreateProject"
    //     },
    //     projectId:"p01"
    // }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        mockObj1 = sandbox.stub(projectService, 'deleteProjectById');

    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing blockchain project delete API', async function () {
        mockObj.resolves(null)
        mockObj1.resolves(null)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/delete").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                comments: "dfg",

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})


describe('BLOCKCHAIN PROJECT ROUTER - /userProfile/transactions API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""

    let finalres = {
        Results: [],
        RecordsCount: 0,
        bookmark: "nil"
    }

    let projects = []
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
        mockObj1 = sandbox.stub(projectModel, 'find');

    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing blockchain /userProfile/transactions API', async function () {
        mockObj.resolves(buffer)
        mockObj1.resolves(projects)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/userProfile/transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                // projectId: "3456",
                ngo: "ngo",
                corporate: "corporate"

            })
        console.log("Resp userprofile transactions:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})


describe('BLOCKCHAIN PROJECT ROUTER - /edit API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/edit").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                mongo: "{dfg}",
                blockchain: "{dfg}"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when projectdetails field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/edit").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                mongo: "",
                blockchain: "{dfg}"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectdetails' field is missing or Invalid in the request")
    });

    // it('testing blockchain project router API when status field is empty', async function () {
    //     let payload = {
    //         userName: 'ca',
    //         orgName: 'creditsauthority'
    //     }
    //     const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
    //     const response = await request(app)
    //     .put("/project/edit").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
    //     .send({
    //         projectId: "p01",
    //         projectdetails:"{dfg}",
    //         projectblock:"{dfg}"

    //     })
    //     expect(response.body.success).to.equal(false)
    //     expect(response.body.message).to.equal("'status' field is missing or Invalid in the request")
    // });
})

describe('BLOCKCHAIN PROJECT ROUTER - /edit API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""

    // let resp={
    //     getMessage:{
    //         success: true,
    //         message: "Successfully invoked CreateProject"
    //     },
    //     projectId:"p01"
    // }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        mockObj1 = sandbox.stub(query, 'main');

    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing blockchain project update API', async function () {
        mockObj.resolves(null)
        mockObj1.resolves(buffer)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/edit").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                mongo: "{dfg}",
                blockchain: "{dfg}"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /approve API SUCCESS', () => {
    let mockObj = ""
    let mockObj1 = ""

    // let transactionList=[]
    // let buffer=Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
        mockObj1 = sandbox.stub(projectService, 'updateProjectForApproval');

    });
    afterEach(() => {
        mockObj.restore();
        mockObj1.restore();

    });
    it('testing blockchain project approve API', async function () {
        mockObj.resolves(null)
        mockObj1.resolves(null)

        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/approve").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                mongo: "{dfg}",
                blockchain: "{dfg}"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /create API SUCCESS', () => {
    let mockObj = ""
    let resp = {
        getMessage: {
            success: true,
            message: "Successfully invoked CreateProject"
        },
        projectId: "p01"
    }

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project create API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/create").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                // contributorsList: [],
                // images: [],
                // projectId: "p01",
                projectName: "123Gift an education...Make a life!",
                projectType: "Education",
                ngo: "ngo501",
                place: "Mumbai",
                description: "Mysuru public school provide high quality school education to rural children in India who cannot otherwise access or afford it. The schools adopt a nurturing, holistic approach to education, helping children learn joyfully. 61% of the children get full scholarships while rest pay a subsidized fee. Your donation goes towards critical infrastructure like learning material, classrooms, school bus, etc.",
                phases: {
                    phaseName: "Registration of students",
                    description: "Enrollment of students in a school."
                }

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})


describe('BLOCKCHAIN PROJECT ROUTER - /update API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                phaseNumber: "0",
                status: "Created"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when phaseNumber field is empty', async function () {
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "",
                status: "Created"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'phaseNumber' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when status field is empty', async function () {
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                status: ""

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'status' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN PROJECT ROUTER - /update API SUCCESS', () => {
    let mockObj = ""
    let resp = {
        getMessage: {
            success: true,
            message: "Successfully invoked CreateProject"
        },
        projectId: "p01"
    }

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project update API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'ngo501',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .put("/project/update").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                status: "Created"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /validate-phase API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/validate-phase").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                phaseNumber: "0",
                isValid: "true",
                comments: "Validated"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when phaseNumber field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/validate-phase").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "",
                isValid: "true",
                comments: "Validated"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'phaseNumber' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when isValid field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/validate-phase").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                isValid: "",
                comments: "Validated"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'isValid' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN PROJECT ROUTER - /validate-phase API SUCCESS', () => {
    let mockObj = ""
    let resp = {
        // getMessage:{
        success: true,
        message: "Successfully invoked ValidatePhase"
        // }
        // projectId:"p01"
    }

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project validate-phase API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/validate-phase").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                isValid: "true",
                comments: "Validated"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /add-document-hash API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "",
                phaseNumber: "0",
                criterion: "true",
                docHash: "Validated",
                docName: "Something"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when phaseNumber field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "",
                criterion: "true",
                docHash: "Validated",
                docName: "Something"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'phaseNumber' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when criterion field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                criterion: "",
                docHash: "Validated",
                docName: "Something"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'criterion' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when docHash field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                criterion: "true",
                docHash: "",
                docName: "Something"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'docHash' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when docName field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                criterion: "true",
                docHash: "Sodfgdj",
                docName: ""

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'docName' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN PROJECT ROUTER - /add-document-hash API SUCCESS', () => {
    let mockObj = ""
    let resp = {
        // getMessage:{
        success: true,
        message: "Successfully invoked AddDocumentHash"
        // }
        // projectId:"p01"
    }

    beforeEach(() => {
        mockObj = sandbox.stub(invoke, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project add-document-hash API', async function () {
        mockObj.resolves(null)
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .post("/project/add-document-hash").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: "p01",
                phaseNumber: "0",
                criterion: "asdfgh",
                docHash: "Validated",
                docName: "Something"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /filtered-projects API', () => {
    it('testing blockchain project router API when self field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'self' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when applyFilter field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                place: "fg"
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'applyFilter' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when pageSize field is empty', async function () {
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "true",
                pageSize: "",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'pageSize' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when creditsauthority is calling and self field is true', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                approvalStatus: "UnApproved",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'self' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when corporate is calling and approvalStatus field is UnApproved', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                approvalStatus: "UnApproved",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'approvalStatus' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when ngo is calling and self field is false', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "false",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                approvalStatus: "UnApproved",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'self' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when ngo is calling and self field is false', async function () {
        let payload = {
            userName: 'guest',
            orgName: 'corporate'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                approvalStatus: "Approved",
                place: "fg"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'self' field is missing or Invalid in the request")
    });

})

describe('BLOCKCHAIN PROJECT ROUTER - /filtered-projects API SUCCESS', () => {
    let mockObj = ""
    let finalres = {
        Results: [],
        RecordsCount: 1,
        bookmark: "nil"
    }

    let msg = {
        success: true,
        message: finalres
    }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(finalres));

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project all API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/filtered-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                self: "true",
                applyFilter: "true",
                pageSize: "10",
                bookmark: "Something",
                projectType: "Education",
                projectStatus: "Seeking Validation",
                approvalStatus: "UnApproved",
                place: "fg"

            })
        console.log("Resp filtere project:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})




describe('BLOCKCHAIN PROJECT ROUTER - /corporate-project-transactions API', () => {
    it('testing blockchain project router API when corporate field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/corporate-project-transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                corporate: "",
                projectId: "p01"

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'corporate' field is missing or Invalid in the request")
    });

    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/corporate-project-transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                corporate: "keanu",
                projectId: ""
            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });

})

describe('BLOCKCHAIN PROJECT ROUTER - /corporate-project-transactions API SUCCESS', () => {
    let mockObj = ""
    let finalres = {
        getmessage: {
            success: true,
            message: "CommonQuery successful"
        },
        records: "sdfg"
    }

    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));
    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project corporate-project-transactions API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/corporate-project-transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                corporate: "keanu",
                projectId: "p01"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /ngo-project-transactions API SUCCESS', () => {
    let mockObj = ""
    let finalres = {
        getmessage: {
            success: true,
            message: "CommonQuery successful"
        },
        projectCount: "1"
    }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project ngo-project-transactions API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ngo2',
            orgName: 'ngo'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/ngo-project-transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                projectId: "p01"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

describe('BLOCKCHAIN PROJECT ROUTER - /transactions API', () => {
    it('testing blockchain project router API when projectId field is empty', async function () {
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .send({
                projectId: ""

            })
        expect(response.body.success).to.equal(false)
        expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
    });
})

describe('BLOCKCHAIN PROJECT ROUTER - /transactions API SUCCESS', () => {
    let mockObj = ""
    let finalres = {
        getmessage: {
            success: true,
            message: "CommonQuery successful"
        },
        records: "1"
    }
    let transactionList = []
    let buffer = Buffer.from(JSON.stringify(transactionList));

    beforeEach(() => {
        mockObj = sandbox.stub(query, 'main');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing blockchain project transactions API', async function () {
        mockObj.resolves(buffer)
        let payload = {
            userName: 'ca',
            orgName: 'creditsauthority'
        }
        const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
        const response = await request(app)
            .get("/project/transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
            .query({
                projectId: "p01"

            })
        console.log("Resp23:", response.body)
        expect(response.body.success).to.equal(true)
        // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
    })
})

// describe('BLOCKCHAIN PROJECT ROUTER - /getCorporateProjectDetails API', () => {
//     it('testing blockchain project router API when corporate field is empty', async function () {
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/getCorporateProjectDetails").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 corporate: ""

//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'corporate' field is missing or Invalid in the request")
//     });
// })

// describe('BLOCKCHAIN PROJECT ROUTER - /getCorporateProjectDetails API SUCCESS', () => {
//     let mockObj = ""
//     let finalres = {
//         getmessage: {
//             success: true,
//             message: "CommonQuery successful"
//         },
//         records: "1"
//     }
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain project getCorporateProjectDetails API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/getCorporateProjectDetails").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 args: "keanu"

//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//         // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
//     })
// })

// describe('BLOCKCHAIN PROJECT ROUTER - /total-corporate-ongoing-projects API', () => {
//     it('testing blockchain project router API when corporate field is empty', async function () {
//         let payload = {
//             userName: 'corp2',
//             orgName: 'corporate'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/total-corporate-ongoing-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .send({
//                 corporate: "",
//                 projectId: "p01"

//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'corporate' field is missing or Invalid in the request")
//     });
// })

// describe('BLOCKCHAIN PROJECT ROUTER - /total-corporate-ongoing-projects API SUCCESS', () => {
//     let mockObj = ""
//     let finalres = {
//         getmessage: {
//             success: true,
//             message: "CommonQuery successful"
//         },
//         projectCount: "1"
//     }
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(transactionList));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain project total-corporate-ongoing-projects API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'corp2',
//             orgName: 'corporate'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/total-corporate-ongoing-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 corporate: "keanu"

//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//         // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
//     })
// })

// describe('BLOCKCHAIN PROJECT ROUTER - /ngo-project-transactions API', () => {
//     // it('testing blockchain project router API when projectId field is empty', async function () {
//     //     let payload = {
//     //         userName: 'ngo2',
//     //         orgName: 'ngo'
//     //     }
//     //     const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//     //     const response = await request(app)
//     //         .get("/project/ngo-project-transactions").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//     //         .send({
//     //             projectId: ""

//     //         })
//     //     expect(response.body.success).to.equal(false)
//     //     expect(response.body.message).to.equal("'projectId' field is missing or Invalid in the request")
//     // });
// })




// describe('BLOCKCHAIN PROJECT ROUTER - /all API', () => {
//     it('testing blockchain project router API when self field is empty', async function () {
//         let payload = {
//             userName: 'ngo2',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 self: "",
//                 ongoing: "true",
//                 newRecords: "1",
//                 pageSize: "10",
//                 bookmark: "Something",
//                 ngoName: "ngo",
//                 projectType: "Education",
//                 place: "fg"

//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'self' field is missing or Invalid in the request")
//     });

//     it('testing blockchain project router API when ongoing field is empty', async function () {
//         let payload = {
//             userName: 'ngo2',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 self: "1",
//                 ongoing: "",
//                 newRecords: "1",
//                 pageSize: "10",
//                 bookmark: "Something",
//                 ngoName: "ngo",
//                 projectType: "Education",
//                 place: "fg"
//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'ongoing' field is missing or Invalid in the request")
//     });

//     it('testing blockchain project router API when newRecords field is empty', async function () {
//         let payload = {
//             userName: 'ngo2',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 self: 1,
//                 ongoing: "true",
//                 newRecords: "",
//                 pageSize: "10",
//                 bookmark: "Something",
//                 ngoName: "ngo",
//                 projectType: "Education",
//                 place: "fg"

//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'newRecords' field is missing or Invalid in the request")
//     });

//     it('testing blockchain project router API when pageSize field is empty', async function () {
//         let payload = {
//             userName: 'ngo2',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 self: 1,
//                 ongoing: "true",
//                 newRecords: "1",
//                 pageSize: "",
//                 bookmark: "Something",
//                 ngoName: "ngo",
//                 projectType: "Education",
//                 place: "fg"

//             })
//         expect(response.body.success).to.equal(false)
//         expect(response.body.message).to.equal("'pageSize' field is missing or Invalid in the request")
//     });

// })

// describe('BLOCKCHAIN PROJECT ROUTER - /all API SUCCESS', () => {
//     let mockObj = ""
//     let finalres = {
//         Results: [],
//         RecordsCount: 1,
//         bookmark: "nil"
//     }

//     let msg = {
//         success: true,
//         message: finalres
//     }
//     let transactionList = []
//     let buffer = Buffer.from(JSON.stringify(finalres));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain project all API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ngo2',
//             orgName: 'ngo'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/all").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//             .query({
//                 self: "self",
//                 ongoing: "true",
//                 newRecords: "1",
//                 pageSize: "10",
//                 bookmark: "Something",
//                 ngoName: "ngo",
//                 projectType: "Education",
//                 place: "fg"

//             })
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//         // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
//     })
// })

// describe('BLOCKCHAIN PROJECT ROUTER - /total-ongoing-projects API SUCCESS', () => {
//     let mockObj = ""
//     let finalres = {
//         getmessage: {
//             success: true,
//             message: "CommonQuery successful"
//         },
//         projectCount: 1
//     }
//     let msg = {
//         Results: [],
//         RecordsCount: '0',
//         Bookmark: 'nil'
//     }
//     var buffer = Buffer.from(JSON.stringify(msg));

//     beforeEach(() => {
//         mockObj = sandbox.stub(query, 'main');
//     });
//     afterEach(() => {
//         mockObj.restore();
//     });
//     it('testing blockchain project total-ongoing-projects API', async function () {
//         mockObj.resolves(buffer)
//         let payload = {
//             userName: 'ca',
//             orgName: 'creditsauthority'
//         }
//         const token = jwt.sign(payload, TOKEN_SECRET, { expiresIn: JWT_EXPIRY });
//         const response = await request(app)
//             .get("/project/total-ongoing-projects").set("csrtoken", "Bearer " + token).set("testmode", "Testing")
//         console.log("Resp23:", response.body)
//         expect(response.body.success).to.equal(true)
//         // expect(response.body.message).to.equal("'amount' field is missing or Invalid in the request")
//     })
// })