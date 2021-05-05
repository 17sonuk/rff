const logger = require('../loggers/logger');

const { projectModel } = require('./models');

const projectModelObj = {}

logger.debug('<<<<<<<<<<<<<< project model >>>>>>>>>>>>>>>>>')

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
    // })
}

//get projects for ngo
projectModelObj.getAllProjectsNgo = (ngoName) => {
    return projectModel.find({ ngo: ngoName }, { _id: 0, projectId: 1, place: 1, images: 1 }).then(data => {
        return data
    })
}

// get projects for corporate(invested)
projectModelObj.getProjectsCorporate = (corporateName) => {
    return projectModel.find({ contributorsList: corporateName }, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
        return data
    })
}

// get all projects
projectModelObj.getAllProjects = () => {
    return projectModel.find({}, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
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

module.exports = projectModelObj;