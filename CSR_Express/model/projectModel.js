const { projectModel } = require('./models');
const projectModelObj = {}

//create a new project
projectModelObj.createProject = (projectData) => {
    return projectModel.find({ projectId: projectData.projectId }).then(p => {

        if (p.length > 0) {
            return ({ message: 'Project ID already exist.', error: true })
        } else {
            return projectModel.create(projectData).then(data => {
                if (data) {
                    return data
                } else {
                    return null
                }
            })
        }
    })
}

//get projects for ngo
projectModelObj.getAllProjectsNgo = (ngoName) => {
    return projectModel.find({ ngo: ngoName }, { _id: 0, projectId: 1, projectName: 1, place: 1, projectSummary: 1, description: 1, communities: 1, images: { $slice: 1 } }).then(data => {
        return data
    })
}

// get projects for corporate(invested)
projectModelObj.getProjectsCorporate = (corporateName) => {
    return projectModel.find({ contributorsList: corporateName }, { _id: 0, projectId: 1, projectName: 1, place: 1, communities: 1, projectSummary: 1, description: 1, images: { $slice: 1 } }).then(data => {
        return data
    })
}

// get all projects
projectModelObj.getAllProjects = () => {
    return projectModel.find({}, { _id: 0, projectId: 1, projectName: 1, place: 1, projectSummary: 1, description: 1, communities: 1, images: { $slice: 1 } }).then(data => {
        return data
    })
}

// get project by ID
projectModelObj.getProjectById = (projectId) => {
    return projectModel.findOne({ projectId: projectId }, { _id: 0 }).then(data => {
        return data
    })
}

// update project by ID
projectModelObj.updateProjectById = (project) => {
    return projectModel.updateOne({ projectId: project.projectId }, { $set: project }).then(data => {
        return data
    })
}

// add contributors
projectModelObj.addContributor = (projectId, contributor) => {
    return projectModel.updateOne({ projectId: projectId }, { $addToSet: { contributorsList: contributor } }).then(data => {
        if (data.nModified > 0) return { message: 'Contributor added successfully' }
        else return { message: 'Contributor already exists' }
    })
}

//delete project
projectModelObj.deleteProjectById = (projectId) => {
    return projectModel.find({ projectId: projectId }).then(p => {

        if (!p.length > 0) {
            return ({ message: 'Project ID does not exist.', error: true })
        } else {
            return projectModel.deleteOne({ projectId: projectId }).then((data) => {
                console.log("data: ", data)
                return ({ message: 'Project deleted Successfully.' })
            }).catch((error) => {
                return ({ message: error, error: true })
            });
        }
    }).catch(err => {
        console.log(err)
        err = new Error("Received error from database")
        err.status = 500
        throw err
    });
}

//approval project update
projectModelObj.updateProjectForApproval = async (projectId, projectObj) => {
    try {

        let updateRes = await projectModel.updateOne({ projectId: projectId }, { $set: projectObj });
        return { success: true, message: 'project successfully approved' }
    }
    catch (error) {
        throw error;
    }
}

//edit project
projectModelObj.editProject = async (projectId, projectObj, currentPhaseNum) => {
    try {
        let p = await projectModel.findOne({ projectId: projectId })

        if (!p) {
            return ({ message: 'Project ID does not exist.', error: true })
        }
        p.question1 = projectObj.question1
        p.question2 = projectObj.question2
        p.question3 = projectObj.question3
        p.question4 = projectObj.question4
        p.question5 = projectObj.question5
        p.question6 = projectObj.question6
        p.question7 = projectObj.question7
        p.images = projectObj.images
        for (let i = 0; i < p.phases.length; i++) {
            if (currentPhaseNum <= i) {
                p.phases[i].phaseName = projectObj.phases[i].phaseName
                p.phases[i].description = projectObj.phases[i].description
            }
        }

        let data = await projectModel.updateOne({ projectId: projectId }, { $set: p })
        console.log("data: ", data)
        return ({ message: 'Project edited Successfully.', success: true })
    }

    catch (err) {
        console.log(err)
        err = new Error("Received error from database")
        err.status = 500
        throw err
    }
}

// get country and category filters
projectModelObj.getFilters = async (userName, orgName) => {

    let country = [];
    let category = [];

    if (orgName === 'ngo') {
        country = await projectModel.distinct('place', { ngo: userName });
        category = await projectModel.distinct('projectType', { ngo: userName });
    } else {
        country = await projectModel.distinct('place');
        category = await projectModel.distinct('projectType');
    }

    return {
        countries: country,
        categories: category
    }
}

//get projects by community
projectModelObj.getProjectsByCommunity = (communityId) => {
    return projectModel.find({ communities: communityId }, { _id: 0, projectId: 1, projectName: 1 }).then(data => {
        return data
    })
}

module.exports = projectModelObj;