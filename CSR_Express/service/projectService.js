const logger = require('../loggers/logger');

const projectModel = require('../model/projectModel');

const projectService = {};

logger.debug('<<<<<<<<<<<<<< project service >>>>>>>>>>>>>>>>>')

//Create project
projectService.createProject = (project) => {
    return projectModel.createProject(project).then(projectData => {
        if (projectData && projectData.error === true) {

            return { success: false, message: projectData.message };
        } 
        else if(!projectData){
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
        else {
            return { success: true, message: 'project created in db' };
        }
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

module.exports = projectService;