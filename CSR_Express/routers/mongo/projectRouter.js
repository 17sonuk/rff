const express = require('express');
const router = express.Router();
const projectService = require('../../service/projectService')

//to Create project
router.post('/create', (req, res, next) => {
    // return project data object from service
    projectService.createProject(req.userName, req.body)
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
router.get('/:projectId', (req, res, next) => {
    projectService.getProjectById(req.params.projectId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//is it really getting used?
router.put('/updateProject', (req, res, next) => {
    projectService.updateProjectById(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

module.exports = router;