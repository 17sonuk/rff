const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
const request = require('supertest');
const projectService = require('../../service/projectService');
const sinon = require("sinon");
const app = require('../../app')
chai.use(chaiAsPromised)
var sandbox = require("sinon").createSandbox();
require('dotenv').config();
const { JWT_EXPIRY, TOKEN_SECRET, CA_EMAIL, IT_EMAIL, GUEST_EMAIL } = process.env;
var jwt = require('jsonwebtoken');
const { createSandbox } = require('sinon');
var auth;

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
        }

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