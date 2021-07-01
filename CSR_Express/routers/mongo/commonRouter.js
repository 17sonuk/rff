const express = require('express');
const router = express.Router();

const logger = require('../../loggers/logger');

const commonService = require('../../service/commonService')

logger.debug('<<<<<<<<<<<<<< common router >>>>>>>>>>>>>>>>>')

//to save communities
router.post('/community', (req, res, next) => {
    // return project data object from service
    logger.debug(`router-createProject: ${JSON.stringify(req.body, null, 2)}`);

    commonService.saveCommunities(req.body)
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

router.get('/community/all', (req, res, next) => {
    // return project data object from service
    logger.debug('router-getcommunities');

    commonService.getCommunities()
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

//to get all donor details
router.get('/donor', (req, res, next) => {
    // return project data object from service
    logger.debug('router-getDonors');

    commonService.getDonors()
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

module.exports = router;