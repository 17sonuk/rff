const express = require('express');
const router = express.Router();
const projectService = require('../../service/projectService')
const { v4: uuid } = require('uuid');

//to Create project
router.post('/create', (req, res, next) => {
    // return project data object from service
    projectService.createProject(req.userName, req.body)
        .then((data) => {
            //let obj= {projectId:req.body.projecttId}
            projectService.deleteSavedProject(req.userName, req.body)
                .then((data1) => {
                    console.log("inside save project delete method*********", data1);
                    res.json(data);
                }).catch(err => {
                    if (err) {
                        err.status = 400
                        err.message = err['_message'];
                    }
                })

            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

router.get('/projects-ngo', (req, res, next) => {
    userName = req.userName

    if (req.orgName === 'creditsauthority') {
        userName = req.query.userName
    }
    projectService.getProjectsNGO(userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/projects-corporate', (req, res, next) => {
    userName = req.userName

    if (req.orgName === 'creditsauthority') {
        userName = req.query.userName
    }
    projectService.getProjectsCorporate(userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/all', (req, res, next) => {
    projectService.getAllProjects()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/countryAndProjectTypeFilter', (req, res, next) => {
    projectService.getFilters(req.userName, req.orgName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/projectsByCommunity', (req, res, next) => {
    projectService.getProjectsByCommunity(req.query.communityId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//this should be the last router
router.get('/byId', (req, res, next) => {
    projectService.getProjectById(req.query.projectId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})


//save-project
router.post('/drafts-project', (req, res, next) => {
    let projectId = ''
    if (!req.body.projectId) {
        projectId = uuid().toString()
        req.body['projectId'] = projectId;
    } else {
        projectId = req.body.projectId;
    }
    projectService.saveProject(req.userName, req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

//fetch drafts project details
router.post('/get-drafts-project', (req, res, next) => {
    projectService.getsavedProject(req.userName, req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

// delete drafts projects
router.post('/delete-drafts-project', (req, res, next) => {
    let username = req.userName;
    //console.log("inside delete project");
    projectService.deleteSavedProject(req.userName, req.body)
        .then((data) => {
            res.json(data);
        }).catch(err => {
            if (err) {
                err.status = 400
                err.message = err['_message'];
            }
            next(err)
        })
})

// //is it really getting used? : not using
// router.put('/updateProject', (req, res, next) => {
//     projectService.updateProjectById(req.body)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })

module.exports = router;