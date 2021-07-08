const chai = require('chai');
const { expect } = require('chai');
var sandbox = require("sinon").createSandbox();
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const projectService = require('../../service/projectService');
const projectModel = require('../../model/projectModel');

describe('TESTING PROJECT SERVICE - CREATE PROJECT', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'createProject');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for createProject', async () => {
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

        // const testProjectBlank ={

        // }
        mockObj.resolves(testProject);
        let res = await projectService.createProject(testProject)
        expect(res.success).to.equal(true)
        expect(res.message).to.equal('project created in db')

        //If there is any error in project
        mockObj.resolves(null);
        try{
        let res1 = await projectService.createProject(testProject)
        expect(res1.success).to.equal(false)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
        // Project ID already exist.
        mockObj.resolves({ message: 'Project ID already exist.', error: true });
        let res2 = await projectService.createProject(testProject)
        expect(res2.success).to.equal(false)
        

    })
})


describe('TESTING PROJECT SERVICE - GET ALL NGO PROJECT', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'getAllProjectsNgo');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getAllProjectsNgo', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.getProjectsNGO('ngo501')
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.getProjectsNGO('ngo501')
            expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

describe('TESTING PROJECT SERVICE - GET ALL CORPORATE PROJECT', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'getProjectsCorporate');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getProjectsCorporate', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.getProjectsCorporate('corp1')
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.getProjectsCorporate('corp1')
            expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})


describe('TESTING PROJECT SERVICE - GET ALL PROJECTS', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'getAllProjects');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getAllProjects', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.getAllProjects()
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.getAllProjects()
            expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})


describe('TESTING PROJECT SERVICE - GET PROJECT BY ID', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'getProjectById');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for getProjectById', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.getProjectById('p01')
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.getProjectById('p01')
        expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})


describe('TESTING PROJECT SERVICE - UPDATE PROJECT BY ID', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'updateProjectById');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for updateProjectById', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.updateProjectById(testProject)
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.updateProjectById(testProject)
        expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})


describe('TESTING PROJECT SERVICE - ADD CONTRIBUTOR IN PROJECT', () => {
    let mockObj = ""
    beforeEach(() => {
        mockObj = sandbox.stub(projectModel, 'addContributor');
    });
    afterEach(() => {
        mockObj.restore();
    });
    it('testing response for addContributor', async () => {
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
        mockObj.resolves(testProject);
        let res = await projectService.addContributor('p01','corp2')
        expect(res).to.equal(testProject)

        //If project is not present
        mockObj.resolves(null);
        try{
            let res = await projectService.addContributor('p06','corp3')
            expect(res).to.equal(testProject)
        }catch(err){
            expect(err.message).to.equal('Bad Connection')
        }
    })
})

