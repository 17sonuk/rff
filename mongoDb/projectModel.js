const connection = require("./connection")
const Mongoose = require("mongoose")
const projectDB = {}

//create a new project
projectDB.createProject = (projectData) => {
    // console.log(projectData);
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection();
        return collection.find({ projectId: projectData.projectId }).then(p => {
            if (p.length > 0) {
                // Mongoose.connection.close()
                // console.log(p);
                return ({ message: 'Project ID already exist.', error: true })
            } else {
                return collection.create(projectData).then(data => {
                    // Mongoose.connection.close()
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
projectDB.getAllProjectsNgo = (ngoName) => {
    // console.log('model-getAllProjectsNgo', ngoName);
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection()
        return collection.find({ ngo: ngoName }, { _id: 0, projectId: 1, place: 1, images: 1 }).then(data => {
            // Mongoose.connection.close()
            return data
        })
    // })
}

// get projects for corporate(invested)
projectDB.getProjectsCorporate = (corporateName) => {
    // console.log('model-getProjectsCorporate', corporateName);
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection()
        return collection.find({ contributorsList: corporateName }, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
            // Mongoose.connection.close()
            // console.log(data);
            return data
        })
    // })
}

// get all projects
projectDB.getAllProjects = () => {
    // console.log('model-getAllProject');
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection()
        return collection.find({}, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
            // Mongoose.connection.close()
            // console.log(data);
            return data
        })
    // })
}

// get project by ID
projectDB.getProjectById = (projectId) => {
    // console.log('model-getProjectById', projectId);
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection()
        return collection.findOne({ projectId: projectId }, { _id: 0 }).then(data => {
            // Mongoose.connection.close()
            // console.log(data);
            return data
        })
    // })
}

// update project by ID
projectDB.updateProjectById = (project) => {
    let collection = connection.projectCollection()
    return collection.updateOne({ projectId: project.projectId }, { $set: project }).then(data => {
        return data
    })
}

// add contributors
projectDB.addContributor = (projectId, contributor) => {
    // console.log('model-addContributor', projectId, contributor);
    // return connection.projectCollection().then(collection => {
        let collection = connection.projectCollection();
        return collection.updateOne({ projectId: projectId }, { $addToSet: { contributorsList: contributor } }).then(data => {
            // Mongoose.connection.close()
            if (data.nModified > 0) return { message: 'Contributor added successfully' }
            else return { message: 'Contributor already exist' }
        })
    // })
}

// onboarding of user
projectDB.registerUser = (obj) => {
    // console.log('model-registerUser', obj);
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        let criteria = [{ name: obj.name }, { pan: obj.pan }]
        if (obj.regId) criteria.push({ regId: obj.regId })
        return collection.find({ $or: criteria }).then(user => {
            if (user.length > 0) {
                // Mongoose.connection.close()
                // console.log(user);
                return ({ message: 'user already registered', error: true })
            }
            else {
                return collection.create(obj).then(data => {
                    // Mongoose.connection.close()
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

// get user details
projectDB.getUserDetails = (name) => {
    // console.log('model-getUserDetails', name);
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        return collection.findOne({ name: name }, { _id: 0, date: 0 }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

// get unapproved users 
projectDB.getUnapprovedUserDetails = () => {
    // console.log('model-getUnapprovedUserDetails');
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        return collection.find({ status: 'created' }, { _id: 0 }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

// approve users
projectDB.approveUser = (name, pan) => {
    // console.log('model-approveUser');
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        return collection.updateOne({ name: name, pan: pan }, { $set: { "status": 'approved' } }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

// upload Balance Sheet for corporate
projectDB.uploadBalanceSheet = (name, file) => {
    // console.log('model-uploadBalanceSheet');
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        return collection.updateOne({ name: name, role: 'Corporate' }, { $push: { file: file } }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

//get current balancesheet amount
projectDB.getAmountFromBalanceSheet = (name) => {
    // console.log('model-getAmountFromBalanceSheet');
    // return connection.orgCollection().then(collection => {
        let collection = connection.orgCollection()
        return collection.findOne({ name: name, role: 'Corporate' }, { _id: 0, file: 1 }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

//create a new notification
projectDB.createNotification = (notificationData) => {
    // return connection.notificationCollection().then(collection => {
        let collection = connection.notificationCollection()
        return collection.create(notificationData).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

//create a new tx description
projectDB.createTxDescription = (txDescriptionData) => {
    // return connection.txDescriptionCollection().then(collection => {
        let collection = connection.txDescriptionCollection()
        return collection.create(txDescriptionData).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

//get notification
projectDB.getNotifications = (username, seen) => {
    // return connection.notificationCollection().then(collection => {
        let collection = connection.notificationCollection()

        return collection.find({ username: username, seen: seen }, { _id: 0, txId: 1, seen: 1 }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

//get description of notification
projectDB.getNotificationDescription = (txId) => {
    // return connection.txDescriptionCollection().then(collection => {
        let collection = connection.txDescriptionCollection()
        return collection.findOne({ txId: txId }, { _id: 0, txId: 1, description: 1 }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}

// update seen notification
projectDB.updateNotification = (username, txId) => {
    // return connection.notificationCollection().then(collection => {
        let collection = connection.notificationCollection()
        return collection.updateOne({ username, txId }, { seen: true }).then(data => {
            // Mongoose.connection.close()
            if (data) {
                return data
            } else {
                return null
            }
        })
    // })
}
module.exports = projectDB;
