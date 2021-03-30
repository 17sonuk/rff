const collection = require("./connection").projectCollection();

const projectModel = {}

console.log('<<<<<<<<<<<<<< project model >>>>>>>>>>>>>>>>>')

//create a new project
projectModel.createProject = (projectData) => {
    // console.log(projectData);
    // return connection.projectCollection().then(collection => {
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
projectModel.getAllProjectsNgo = (ngoName) => {
    // console.log('model-getAllProjectsNgo', ngoName);
    // return connection.projectCollection().then(collection => {
    return collection.find({ ngo: ngoName }, { _id: 0, projectId: 1, place: 1, images: 1 }).then(data => {
        // Mongoose.connection.close()
        return data
    })
    // })
}

// get projects for corporate(invested)
projectModel.getProjectsCorporate = (corporateName) => {
    // console.log('model-getProjectsCorporate', corporateName);
    // return connection.projectCollection().then(collection => {
    return collection.find({ contributorsList: corporateName }, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
        // Mongoose.connection.close()
        // console.log(data);
        return data
    })
    // })
}

// get all projects
projectModel.getAllProjects = () => {
    // console.log('model-getAllProject');
    // return connection.projectCollection().then(collection => {
    return collection.find({}, { _id: 0, projectId: 1, place: 1, images: { $slice: 1 } }).then(data => {
        // Mongoose.connection.close()
        // console.log(data);
        return data
    })
    // })
}

// get project by ID
projectModel.getProjectById = (projectId) => {
    // console.log('model-getProjectById', projectId);
    // return connection.projectCollection().then(collection => {
    return collection.findOne({ projectId: projectId }, { _id: 0 }).then(data => {
        // Mongoose.connection.close()
        // console.log(data);
        return data
    })
    // })
}

// update project by ID
projectModel.updateProjectById = (project) => {
    return collection.updateOne({ projectId: project.projectId }, { $set: project }).then(data => {
        return data
    })
}

// add contributors
projectModel.addContributor = (projectId, contributor) => {
    // console.log('model-addContributor', projectId, contributor);
    // return connection.projectCollection().then(collection => {
    return collection.updateOne({ projectId: projectId }, { $addToSet: { contributorsList: contributor } }).then(data => {
        // Mongoose.connection.close()
        if (data.nModified > 0) return { message: 'Contributor added successfully' }
        else return { message: 'Contributor already exists' }
    })
    // })
}

module.exports = projectModel;