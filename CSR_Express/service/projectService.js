const projectModel = require('../model/projectModel');
const userModel = require('../model/userModel');
const messages = require('../loggers/messages');
const projectService = {};

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
                    let err = new Error(messages.error.BAD_CONNECTION)
                    err.status = 500
                    throw err
                }
                else {
                    return { success: true, message: messages.success.PROJECT_CREATED };
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
            let err = new Error(messages.error.BAD_CONNECTION)
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
        let err = new Error(messages.error.FAILED_PROJECT_APPROVAL)
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
        let err = new Error(messages.error.FAILED_EDIT_PROJECT)
        err.status = 500
        throw err
    }
}

//get country and category filters
projectService.getFilters = (userName, orgName) => {
    return projectModel.getFilters(userName, orgName).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error(messages.error.NO_RECORDS)
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
            let err = new Error(messages.error.NO_RECORDS)
            err.status = 500
            throw err
        }
    })
}


//save project

projectService.saveProject = (userName, project) => {
    return userModel.getNgoOrgName(userName)
        .then(data => {
            project.orgName = data;
            //console.log("data storing in mongo ",project);
            return projectModel.saveProject(project).then(projectData => {
                //console.log("mongo **********",projectData);
                if (projectData && projectData.error === true) {
                    return { success: false, message: projectData.message };
                }
                else if (!projectData) {
                    let err = new Error(messages.error.BAD_CONNECTION)
                    err.status = 500
                    throw err
                }
                else {
                    return { success: true, message: messages.success.PROJECT_CREATED, projectId: project.projectId };
                }
            })
        })
}
// fetch drafts projects
projectService.getsavedProject = (userName, data) => {
    return projectModel.getsavedProject(data).then(response => {
        if (response) {
            return response;
        } else {
            let err = new Error(messages.error.NO_RECORDS)
            err.status = 500
            throw err
        }
    })
}

// delete drafts project
projectService.deleteSavedProject = (userName, data) => {
    return projectModel.deleteSavedProject(data).then(response => {
        if (response) {
            return response
        } else {
            let err = new Error(message.error.No_RECORDS);
            err.status = 500
            throw err
        }
    })
}


module.exports = projectService;