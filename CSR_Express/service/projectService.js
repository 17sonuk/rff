const logger = require('../loggers/logger');

const projectModel = require('../model/projectModel');
const userModel = require('../model/userModel');

const projectService = {};

logger.debug('<<<<<<<<<<<<<< project service >>>>>>>>>>>>>>>>>')

//Create project
projectService.createProject = (userName, project) => {
    return userModel.getNgoOrgName(userName)
        .then(data => {
            project.orgName = data;
            return projectModel.createProject(project).then(projectData => {
                if (projectData && projectData.error === true) {

                    return { success: false, message: projectData.message };
                }
                else if (!projectData) {
                    let err = new Error("Bad Connection")
                    err.status = 500
                    throw err
                }
                else {
                    return { success: true, message: 'project created in db' };
                }
            })
        })
}

//get projects for ngo
projectService.getProjectsNGO = (ngoName) => {
    return projectModel.getAllProjectsNgo(ngoName).then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get projects for corporate(invested0)
projectService.getProjectsCorporate = (corporateName) => {
    return projectModel.getProjectsCorporate(corporateName).then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get all projects
projectService.getAllProjects = () => {
    return projectModel.getAllProjects().then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get project by Id
projectService.getProjectById = (projectId) => {
    return projectModel.getProjectById(projectId).then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//update project by Id
projectService.updateProjectById = (project) => {
    return projectModel.updateProjectById(project).then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//add contributor
projectService.addContributor = (projectId, contributor) => {
    return projectModel.addContributor(projectId, contributor).then(projectData => {
        if (projectData) {
            return projectData;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//delete project by Id
projectService.deleteProjectById = (projectId) => {
    return projectModel.deleteProjectById(projectId).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//updateProjectForApproval
projectService.updateProjectForApproval = async (projectId, projectObj) => {
    try {
        return await projectModel.updateProjectForApproval(projectId, projectObj)
    }
    catch (error) {
        console.log(error)
        let err = new Error("Approval failed!")
        err.status = 500
        throw err
    }
}

//edit project
projectService.editProject = async (projectId, projectObj, currentPhaseNum) => {
    try {

        return await projectModel.editProject(projectId, projectObj, currentPhaseNum)
    }
    catch (error) {
        console.log(error)
        let err = new Error("Edit failed!")
        err.status = 500
        throw err
    }
}

//get country and category filters
projectService.getFilters = () => {
    console.log('service')
    return projectModel.getFilters().then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("No records found")
            err.status = 500
            throw err
        }
    })
}

projectService.getProjectsByCommunity = (communityId) => {
    return projectModel.getProjectsByCommunity(communityId).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("No records found")
            err.status = 500
            throw err
        }
    })
}

module.exports = projectService;