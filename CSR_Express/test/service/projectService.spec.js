const chai = require('chai');
const { expect } = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised)
const sinon = require("sinon");

const { connectionToMongo, connectToMongo, disconnectMongo } = require('../../model/connection')
const projectService = require('../../service/projectService');
// const userService = require('../../service/userService');
const projectModel = require('../../model/projectModel');

describe('TESTING PROJECT SERVICE - CREATE PROJECT', () => {
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
        // const createProjectStub = sinon.stub(projectModel, "createProject").resolves({ success: true,message:'project created in db' });
        const res = await projectService.createProject(testProject);
        //here to request
        expect(res).to.be.a('object');
        expect(res.success).to.equal(true);
        expect(res.message).to.equal('project created in db');
        // expect(createProjectStub.calledOnce).to.be.true;
        // createProjectStub.restore();
    })
        


    it('Error in testing response for createProject', async () => {
        //This is the case when we are sending projectId as blank
        const errorTestProject = {
            "contributorsList": [],
            "images": [],
            "projectId": "",
            "projectName": "Project_Test",
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
        
        try{
        const response = await projectService.createProject(errorTestProject);
        //here to request
        console.log("Response:",response);
        expect(response).to.be.a('object');
        expect(response.success).to.equal(true);
        }catch(err){
            expect(err._message).to.equal('Project validation failed')
        }
    })

    it('testing response for getProjectforNgo', async () => {  
        const res = await projectService.getProjectsNGO('ngo1');
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);        
    })

    it('testing response for getProjectforCorporate', async () => {  
        const res = await projectService.getProjectsCorporate('corp1');
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(0);        
    })
    
    it('testing response for getAllProjects', async () => {  
        const res = await projectService.getAllProjects();
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);        
    })
    
    it('testing response for getprojectsById', async () => {  
        const res = await projectService.getProjectById('p01');
        expect(res).to.be.a('object');      
    })
    
    it('testing response for updateProjectById', async () => { 
        const data={
            projectId: 'p03'
        } 
        const res = await projectService.updateProjectById(data);
        expect(res).to.be.a('object');  
        expect(res.ok).to.equal(1);
        expect(res.nModified).to.equal(0);
    })

    it('testing response for addContributor', async () => {  
        const res = await projectService.addContributor('p01','corp3');
        expect(res).to.be.a('object');      
    })
})