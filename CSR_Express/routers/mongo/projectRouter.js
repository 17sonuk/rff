const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const projectService = require('../../service/projectService')

const commonService = require('../../service/commonService')

logger.debug('<<<<<<<<<<<<<< project router >>>>>>>>>>>>>>>>>')

//to Create project
router.post('/create', (req, res, next) => {
    // return project data object from service
    logger.debug(`router-createProject: ${JSON.stringify(req.body, null, 2)}`);

    projectService.createProject(req.userName, req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => {
            if (err['_message']) {
                err.status = 400
                err.message = err['_message'];
            }
            // console.log(err['_message'].toString())
            next(err)
        })
})

router.get('/projects-ngo', (req, res, next) => {
    logger.debug("router-getProjectNGO");

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
    logger.debug("router-getProjectsCorporate");

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
    logger.debug("router-getAllProjects");

    projectService.getAllProjects()
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/countryAndProjectTypeFilter', (req, res, next) => {
    logger.debug("router-filters");

    projectService.getFilters(req.userName, req.orgName)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

router.get('/projectsByCommunity', (req, res, next) => {
    logger.debug(`router-projectsByCommunity: ${req.query.communityId}`);

    projectService.getProjectsByCommunity(req.query.communityId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//this should be the last router
router.get('/:projectId', (req, res, next) => {
    logger.debug(`router-getProjectById: ${req.params.projectId}`);

    projectService.getProjectById(req.params.projectId)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

//is it really getting used?
router.put('/updateProject', (req, res, next) => {
    logger.debug(`router-updateProject: ${req.body}`);

    projectService.updateProjectById(req.body)
        .then((data) => {
            res.json(data)
        })
        .catch(err => next(err))
})

// not getting used. already used inside transfer token
// router.put('/addContributor/:projectId', (req, res, next) => {
//     logger.debug(`router-addContributor: ${req.params.projectId} ${req.body.contributor}`);

//     projectService.addContributor(req.params.projectId, req.body.contributor)
//         .then((data) => {
//             res.json(data)
//         })
//         .catch(err => next(err))
// })





module.exports = router;