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

describe('TESTING PROJECT MODEL - CREATE', () => {

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

    it('testing get all ngo projects in mongo', async () => {

        const res = await projectModel.getAllProjectsNgo('ngo1');
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);

        const res1 = await projectModel.getAllProjectsNgo('wrong_ngo');
        expect(res1).to.be.a('array');
        expect(res1).to.have.lengthOf(0);
    });

    it('testing get all projects donated by corp in mongo', async () => {

        const res = await projectModel.getProjectsCorporate('corp1');
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(0);
    });

    it('testing get all projects in mongo', async () => {

        const res = await projectModel.getAllProjects();
        expect(res).to.be.a('array');
        expect(res).to.have.lengthOf(1);
    });

    it('testing get project by id in mongo', async () => {

        const res = await projectModel.getProjectById('p01');
        expect(res).to.be.a('object');
    });

    it('testing add contributor to project in mongo', async () => {

        const res = await projectModel.addContributor('p01', 'corp1');
        expect(res).to.be.a('object');
        expect(res.message).to.equal('Contributor added successfully');

        const res1 = await projectModel.getProjectsCorporate('corp1');
        expect(res1).to.be.a('array');
        expect(res1).to.have.lengthOf(1);
    });
})
