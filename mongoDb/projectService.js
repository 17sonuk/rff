const projectModel = require('./projectModel')
const projectService = {}

//Create project:
projectService.createProject = (project) => {
    return projectModel.createProject(project).then(projectData => {
        if (projectData) {
            return { success: true, message: 'project created in db' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
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

//Onboarding of user:
projectService.registerUser = (obj) => {
    obj['status'] = 'created';
    obj['date'] = new Date().getTime();
    return projectModel.registerUser(obj).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get user details:
projectService.getUserDetails = (name) => {
    return projectModel.getUserDetails(name).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get user details:
projectService.getUnapprovedUserDetails = () => {
    return projectModel.getUnapprovedUserDetails().then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//approve user :
projectService.approveUser = (name, pan) => {
    return projectModel.approveUser(name, pan).then(data => {
        if (data) {
            return data;
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//login user :
projectService.login = (name) => {
    return projectModel.getUserDetails(name).then(data => {
        if (data) {
            if (data['status'] == 'approved') {
                return { success: true, message: 'login successful', name: data.name, role: data.role };
            } else {
                return { success: false, message: 'onboarding not approved' }
            }
        } else {
            return { success: false, message: 'user does not exist' }
        }
    })
}

// upload Balance sheet:
projectService.uploadBalanceSheet = (file) => {
    return projectModel.uploadBalanceSheet(file).then(data => {
        if (data) return { success: true, message: 'balance Sheet uploaded successfully' }
        else return { success: false, message: 'Error in uploading the balance sheet' }
    })
}

// amount of corporate to convert in credits
projectService.getAmountFromBalanceSheet = (name) => {
    return projectModel.getAmountFromBalanceSheet(name).then(data => {
        if (data) {
            let d = new Date();
            let y = d.getFullYear();
            let m = d.getMonth();
            let year_p1 = '';
            let year_p2 = '';
            let year_p3 = '';
            if (m < 3) {
                year_p1 = String(y - 1) + '-' + String(y);
                year_p2 = String(y - 2) + '-' + String(y-1);
                year_p3 = String(y - 3) + '-' + String(y-2);
            } else {
                year_p1 = String(y) + '-' + String(y + 1);
                year_p2 = String(y-1) + '-' + String(y);
                year_p3 = String(y-2) + '-' + String(y - 1);
            }
            let total = 0;
            let j = 0;
            for (let i = 0; i < data.file.length; i++) {
                if (data.file[i].year == year_p1 || data.file[i].year == year_p2 || data.file[i].year == year_p3) {total+=Number(data.file[i].amount);j++;}
            }
            if(j==3) return { success: true, amount: Math.ceil(total/300)*2 };
            else return { success: false, message: 'balance sheets are not avilable.' }
            
        } else return { success: false, message: 'not getting files from db' }
    })
}


//Create notification
projectService.createNotification = (project) => {
    return projectModel.createNotification(project).then(notificationData => {
        if (notificationData) {
            return { success: true, message: 'notification created in db' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//Create tx description
projectService.createTxDescription = (project) => {
    return projectModel.createTxDescription(project).then(txDescriptionData => {
        if (txDescriptionData) {
            return { success: true, message: 'tx description created in db' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

//get notifications
projectService.getNotifications = (username, seen) => {
    return projectModel.getNotifications(username, seen).then(async notification => {
        if (notification) {
            for (let i = 0; i < notification.length; i++) {
                await projectModel.getNotificationDescription(notification[i].txId).then(data => {
                    if (data) {
                        notification[i]['description'] = data.description
                    }
                })
            }
            return notification
        }
        else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}

// update notification
projectService.updateNotification = (username, txId) => {
    return projectModel.updateNotification(username, txId).then(status => {
        if (status['nModified'] > 0) {
            return { success: true, message: 'notification updated' };
        } else {
            let err = new Error("Bad Connection")
            err.status = 500
            throw err
        }
    })
}
module.exports = projectService