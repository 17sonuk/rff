const express = require('express');
const router = express.Router();
const projectService = require('../../service/ProjectService')

console.log('<<<<<<<<<<<<<< project router >>>>>>>>>>>>>>>>>')

//to Create project
router.post('/create', (req, res, next) => {
    // return project data object from service
    console.log("router-createProject", req.body);
    projectService.createProject(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/projects-ngo', (req, res, next) => {
    console.log("router-getProjectNGO");
    projectService.getProjectsNGO(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/projects-corporate', (req, res, next) => {
    console.log("router-getProjectsCorporate");
    projectService.getProjectsCorporate(req.query.userName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/all', (req, res, next) => {
    console.log("router-getAllProjects");
    projectService.getAllProjects()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/:projectId', (req, res, next) => {
    console.log("router-getProjectById", req.params.projectId);
    projectService.getProjectById(req.params.projectId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//is it really getting used?
router.put('/updateProject', (req, res, next) => {
    console.log("router-updateProject", req.body);
    projectService.updateProjectById(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.put('/addContributor/:projectId', (req, res, next) => {
    console.log("router-addContributor", req.params.projectId, req.body.contributor);
    projectService.addContributor(req.params.projectId, req.body.contributor)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

module.exports = router;