const { projectModel, saveprojectModel } = require('./models');
const messages = require('../loggers/messages');
const projectModelObj = {}

//create a new project
projectModelObj.createProject = (projectData) => {
    return projectModel.find({ projectId: projectData.projectId }).then(p => {
        if (p.length > 0) {
            return ({ message: messages.error.PROJECT_ID, error: true })
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
        if (data.nModified > 0) return { message: messages.success.ADD_CONTRIBUTOR }
        else return { message: messages.error.INVALID_CONTRIBUTOR }
    })
}

//delete project
projectModelObj.deleteProjectById = (projectId) => {
    return projectModel.find({ projectId: projectId }).then(p => {
        if (!p.length > 0) {
            return ({ message: messages.error.INVALID_PROJECT_ID, error: true })
        } else {
            return projectModel.deleteOne({ projectId: projectId }).then((data) => {
                console.log("data: ", data)
                return ({ message: messages.success.PROJECT_DELETE })
            }).catch((error) => {
                return ({ message: error, error: true })
            });
        }
    }).catch(err => {
        console.log(err)
        err = new Error(messages.error.DB_ERROR)
        err.status = 500
        throw err
    });
}

//approval project update
projectModelObj.updateProjectForApproval = async (projectId, projectObj) => {
    try {
        await projectModel.updateOne({ projectId: projectId }, { $set: projectObj });
        return { success: true, message: messages.success.PROJECT_APPROVAL }
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
            return ({ message: messages.error.INVALID_PROJECT_ID, error: true })
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
        return ({ message: messages.success.PROJECT_EDIT, success: true })
    }

    catch (err) {
        console.log(err)
        err = new Error(messages.error.DB_ERROR)
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

//save project
projectModelObj.saveProject = (projectData) => {
    return saveprojectModel.find({ projectId: projectData.projectId }).then(p => {
        if (p.length > 0) {
            return saveprojectModel.updateOne({ projectId: projectData.projectId }, { $set: projectData }).then(data => {
                console.log("data from mongo after update", data);
                if (data) {
                    return data;
                } else {
                    return null
                }
            })
        } else {
            return saveprojectModel.create(projectData).then(data => {
                console.log("data from mongo after save", data);
                if (data) {
                    return data
                } else {
                    return null
                }
            })
        }
    })
}
// get saved project
projectModelObj.getsavedProject = (projectData) => {
    console.log("input data ", projectData);
    return saveprojectModel.find({ orgName: projectData.orgName }).then(p => {
        //console.log("fetching  datat************",p);
        return p;
    })
}

// delete saved projects
projectModelObj.deleteSavedProject = (projectData) => {
    console.log("project data is ****************", projectData);
    return saveprojectModel.deleteOne({ projectId: projectData.projectId }).then(response => {
        console.log("deleting data from save project schema", response);
        return response;
    })
}


module.exports = projectModelObj;